/*jslint node:true */
/*global $,c3,pathname,superagent,Config */
$(document).ready(function () {
  'use strict';
  var table;
  var currentField;
  var dtFacets = {};
  var facets   = [];
  var facetsPrefs;
  var fieldNb;
  var filter   = {};
  var graphChart;
  var graphOptions;
  var graphId;
  var graphPref;
  var i;
  var request  = superagent;
  var self     = this;
  var marked   = require('marked');

  var isOnlyChart = function isOnlyChart(id) {
    return pathname === '/chart.html' &&
           typeof params !== 'undefined' &&
           params.id === id;
  };

  var filter2Selector = function filter2Selector() {
    var sel = {};
    Object.keys(filter, function (key, value) {
      if (key !== 'main') {
        var facetId = facets.indexOf(key);
        sel[facetsPrefs[facetId].path] = encodeURIComponent(value);
      }
    });
    return JSON.stringify(sel);
  };

  var updateDocumentsTable = function updateDocumentsTable() {
    // Reset the search
    table.columns(0).search('');
    for(i = 0; i < facets.length; i++) {
      table.columns(fieldNb + i).search('');
    }
    // Apply filter to the search
    Object.keys(filter, function (key, value) {
      if (key === 'main') {
        table.columns(0).search(value);
      }
      else {
        var facetIndex = facets.indexOf(key);
        table.columns(fieldNb + facetIndex).search(value);
      }
    });
    table.draw();
  };

  var updateFacets = function updateFacets() {
    facets.forEach(function (facetLabel, facetId) {
      var facet = facetsPrefs[facetId];
      var url = '/compute.json?o=distinct&f=' + facet.path;
      if (filter.main) {
        url += '&sel={"' + currentField + '":"'+encodeURIComponent(filter.main)+'"}';
      }
      dtFacets[facetId].ajax.url(url);
      dtFacets[facetId].ajax.reload();
    });
  };

  var updateGraph = function updateGraph() {
    if (!graphOptions) return;
    if (!(graphOptions.data || graphOptions.dataProvider || graphOptions.elements)) return;
    if (!(graphPref.type || graphOptions.data || graphOptions.data.type || graphOptions.data.types)) return;

    var operator = graphPref.operator ? graphPref.operator : "distinct";
    var maxItems = graphPref.maxItems ? graphPref.maxItems : 0;
    var fields   = graphPref.fields ? graphPref.fields : [graphPref.field];
    var url      = '/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    url += '&itemsPerPage=' + maxItems;


    // add filter to the URL
    var sel = filter2Selector();
    if (graphPref.type !== 'histogram') {
      url +=
         '&columns[0][data]=value&columns[0][orderable]=true' +
         '&order[0][column]=0&order[0][dir]=desc';
    }
    if (sel.length && sel !== '{}') {
      url += '&sel=' + sel;
    }

    request
    .get(url)
    .end(function(res) {
      var type = graphOptions.data ?
        graphOptions.data.type || graphOptions.data.types.notices :
        graphPref.type;
      switch(type) {
        case 'pie':
          graphChart.dataProvider = res.body.data;
          graphChart.validateData();
          // Select the main filter again (on the pie)
          graphChart.dataProvider.forEach(function (slice, index) {
            if (slice._id === filter.main) {
              graphChart.clickSlice(index);
            }
          });
          break;
        case 'horizontalbars':
        case 'histogram':
          res.body.data.each(function (e) {
            if (e._id === filter.main) {
              e.alpha = 0.5;
            }
          });
          graphChart.dataProvider = res.body.data;
          graphChart.validateData();
          break;
        case 'map':
          createMap(res.body.data, graphId, graphPref);
          // Select the main filter again (on the map)
          var mapObjects = graphChart.dataProvider.areas.filter(function (area) {
            return (area.id === filter.main);
          });
          var mapObject = mapObjects[0];
          if (mapObject) {
            // TODO improve this (click twice: 1 - remove selection, 2 - add selection) ?!?!?
            graphChart.clickMapObject(mapObject);
            graphChart.clickMapObject(mapObject);
          }
          break;
        case 'network':
          // Unselect all nodes
          graphChart.nodes(':selected').unselect();
          displayNetworkLinks(res.body.data, graphId, graphPref);
          // Select the node
          if (filter.main) {
            graphChart.nodes('[name="' + filter.main + '"]').select();
          }
          break;
        default:
          console.warn('Unknown chart type ' + type + '!');
      }
    });
  };

  var updateAll = function updateAll() {
    updateDocumentsTable();
    updateFacets();
    updateGraph();
  };

  if (pathname === "/chart.html") {
    var vm = new Vue({
      el: '#filters',
      data: {
        filter: filter
      },
      methods: {
        removeFilter: function (filterItem) {
          filter.$delete(filterItem.$key);
          updateAll();
        },
        removeAllFilters: function () {
          updateDocumentsTable();
          Object.keys(filter, function (key) {
            filter.$delete(key);
          });
          updateAll();
        }
      }
    });
  }

  var bootstrapPosition = function(id, size) {
    if (isOnlyChart(id)) {
      return;
    }
    if (size.columns) {
      $('#' + id)
      .parent()
      .removeClass("col-md-12")
      .addClass("col-md-" + size.columns);
    }
    if (size.offset) {
      $('#' + id)
      .parent()
      .addClass("col-md-offset-" + size.offset);
    }
    if (size.height) {
      $('#' + id)
      .height(size.height + 'px');
    }
  };

  /**
   * Update the options of an pie
   * @param  {Array}  data    result of an Ajax request
   * @param  {String} id      identifier of the DIV
   * @param  {Object} pref    preferences coming from the JSON settings
   * @return {Object}         options
   */
  var updatePieOptions = function (data, id, pref) {
    var options = {
      "type"  : "pie",
      "theme" : "light",
      "pathToImages" : "assets/amcharts/images/",
      "dataProvider" : data,
      "valueField"  : "value",
      "titleField": "_id",
      "labelText" : "[[title]]: [[value]]",
      "balloonText" : "[[title]]: <strong>[[value]]</strong>",
      "pullOutOnlyOne": true,
      "startDuration": 1,
      "marginBottom": 0,
      "marginTop"   : 0
    };
    return options;
  };

  /**
   * Update the options of an histogram
   * @param  {Array}  data    result of an Ajax request
   * @param  {String} id      identifier of the DIV
   * @param  {Object} pref    preferences coming from the JSON settings
   * @return {Object}         options
   */
  var updateHistogramOptions = function (data, id, pref) {
    var options = {
      "type"  : "serial",
      "rotate": false,
      "theme" : "light",
      "pathToImages" : "assets/amcharts/images/",
      "dataProvider" : data,
      "categoryField": "_id",
      "startDuration": 1,
      "graphs" : [{
        "type"        : "column",
        "alphaField"  : "alpha",
        "fillAlphas": 1,
        "balloonText" : "[[_id]]: [[value]]",
        "dashLengthField": "dashLengthColumn", // REMOVE ?
        "title"       : pref.title ? pref.title : "",
        "valueField"  : "value",
        "showHanOnHover" : true
      }]
    };
    if (pref.color) {
      options.graphs[0].fillColors = [ pref.color ];
    }
    return options;
  };

  /**
   * Update the options of an horizontalbar
   * @param  {Array}  data    result of an Ajax request
   * @param  {String} id      identifier of the DIV
   * @param  {Object} pref    preferences coming from the JSON settings
   * @return {Object}         options
   */
  var updateHorizontalBarsOptions = function (data, id, pref) {
    var options = {
      "type"  : "serial",
      "rotate": true,
      "theme" : "light",
      "pathToImages" : "assets/amcharts/images/",
      "dataProvider" : data,
      "categoryField": "_id",
      "startDuration": 1,
      "graphs" : [{
        "type"        : "column",
        "alphaField"  : "alpha",
        "fillAlphas": 1,
        "balloonText" : "[[_id]]: [[value]]",
        "dashLengthField": "dashLengthColumn", // REMOVE ?
        "title"       : pref.title ? pref.title : "",
        "valueField"  : "value",
        "showHanOnHover" : true
      }],
      "creditsPosition": "right"
    };
    if (pref.color) {
      options.graphs[0].fillColors = [ pref.color ];
    }
    return options;
  };

  /**
   * Update a network options
   * @param  {Array}   data   result of the graph operator
   * @param  {String}   id     identifier of the network
   * @param  {Object}   pref   preferences for the network
   * @param  {Array}   fields array of fields to display
   * @param  {Function} cb     cb(err, options)
   */
  var updateNetworkOptions = function updateNetworkOptions(data, id, pref, fields, cb) {
    // TODO: finish refactoring (async the two ajax queries in updateNetworkOptions)

    // FIXME: distinct operator does not use several fields
    var nodesUrl = '/compute.json?o=distinct';
    fields.forEach(function (field) {
      nodesUrl += '&f=' + field;
    });
    nodesUrl += '&itemsPerPage=';

    request
    .get(nodesUrl)
    .end(function(res2) {
      var edges     = [];
      var nodeIds   = {};
      var nodes     = [];
      var maxWeight = -Infinity;
      var minWeight = +Infinity;
      var maxOcc    = -Infinity;
      var minOcc    = +Infinity;

      res2.body.data.forEach(function (e, id) {
        maxOcc = Math.max(maxOcc, e.value);
        minOcc = Math.min(minOcc, e.value);
      });

      data.forEach(function (e, id) {
        var affEff = JSON.parse(e._id);
        e.source = affEff[0];
        e.target = affEff[1];
        maxWeight = Math.max(maxWeight, e.value);
        minWeight = Math.min(minWeight, e.value);
        edges.push({
          data: {
            id: '#' + id,
            weight: e.value,
            source: e.source,
            target: e.target
          }
        });
        // memorize nodeIds
        nodeIds[e.source] = true;
        nodeIds[e.target] = true;
      });

      var domain = [minOcc, maxOcc];
      var scale  = chroma.scale('YlOrRd').domain(domain, 9);

      // fill nodes table
      Object.keys(nodeIds).forEach(function (nodeId, i, a) {
        var filteredNodes = res2.body.data.filter(function findNode(n) {
          return n._id === nodeId;
        });
        var node = filteredNodes[0];
        nodes.push({
          data: {
            id: nodeId,
            name: nodeId,
            occ: node.value,
            color: scale(node.value).toString()
          }
        });
      });

      // Override options with configuration values
      if (pref.size) {
        options.size = pref.size;
        bootstrapPosition(id, pref.size);
      }


      // if (isOnlyChart(id)) {
      // }
      $('#' + id)
      .addClass('network');
      var options = {
        container: document.getElementById(id),

        elements: {
          edges: edges,
          nodes: nodes
        },

        style: cytoscape.stylesheet()
          .selector('node')
            .css({
              'content': 'data(id)',
              'text-valign': 'center',
              'color': 'black',
              'background-color': 'data(color)',
              'text-opacity': 'mapData(occ, ' + minOcc + ', ' +  maxOcc + ', 0.50, 1.00)',
              'text-outline-width': 2,
              'text-outline-color': '#888'
            })
          .selector('edge')
            .css({
              'width': 'mapData(weight, ' + minWeight + ', ' + maxWeight + ', 1, 10)',
              'line-color': '#ddd'
            })
          .selector(':selected')
            .css({
              'background-color': 'black',
              'line-color': 'black'
            })
          .selector('.faded')
            .css({
              'opacity': 0.5,
              'text-opacity': 0.25
            }),

        layout: {
          name: 'cola',
          directed: false,
          padding: 10,
          avoidOverlap: true,
          minNodeSpacing: 20,
          nodeSpacing: function (node) { return 20; },
          // animate: false
        },

        ready: function () {
          var cy = this;

          cy.layout().on('layoutstop', function () {
            cy.fit(cy.nodes(':visible'), 10);
          });

          cy.on('select', 'node', function (e) {
            var node = e.cyTarget;
            var neighborhood = node.closedNeighborhood();

            cy.elements().addClass('faded');
            neighborhood.removeClass('faded');

            if (isOnlyChart(id)) {
              filter.$delete('main');
              filter.$add('main', node.element(0).data().id);
              updateDocumentsTable();
              updateFacets();
            }
          });

          cy.on('tap', function (e) {
            // If tap on no element
            if (e.cyTarget === cy) {
              filter.$delete('main');
              updateDocumentsTable();
              updateFacets();
            }
          });

          cy.on('unselect', 'node', function (e) {
            cy.elements().removeClass('faded');
            if (isOnlyChart(id)) {
              cy.nodes(':selected').unselect();
              updateDocumentsTable();
              updateFacets();
            }
          });

        }
      };
      cb(null, options);
    });
  };

  /**
   * Update the options of an AmMap
   * @param  {Array}  areas   result of an Ajax request
   * @param  {String} id      identifier of the DIV
   * @param  {Object} pref    preferences coming from the JSON settings
   * @return {Object}         options
   */
  var updateMapOptions = function (areas, id, pref) {
    var colorScale  = pref.colors && pref.colors.scale ?
                        pref.colors.scale :
                        (pref.colors ? pref.colors : "YlOrRd");
    var colorDistri = pref.colors && pref.colors.distrib ?
                        pref.colors.distrib :
                        'log';

    areas = areas
    .filter(function (area) {
      return area._id !== null;
    });
    var values  = {};
    var data    = [];
    areas.forEach(function (area) { if (!values["v"+area.value]) values["v"+area.value] = true; data.push(area.value); });
    var valuesNb = Object.getOwnPropertyNames(values).length;
    var colorNb  = Math.min(9, valuesNb);
    // var scale  = chroma.scale(['lightblue', 'navy']).domain(domain,10,'log');
    // color scales (see http://colorbrewer2.com/):
    // RdYlBu (Red, Yellow Blue), BuGn (light blue, Green), YlOrRd (Yellow, Orange, Red)
    var scale  = colorDistri === 'linear' ?
                  chroma.scale(colorScale).domain(data, colorNb) :
                  chroma.scale(colorScale).domain(data, colorNb, colorDistri);
    areas = areas
    .map(function (area) {
      area.id = area._id;
      area.color = scale(area.value).toString();
      return area;
    });


    /* create areas settings
     * autoZoom set to true means that the map will zoom-in when clicked on the area
     * selectedColor indicates color of the clicked area.
     */
    var legendData = [];
    var dom = scale.domain();
    var maxCars = 0;
    for (var i = 0; i < dom.length - 1; i++) {
      var val = dom[i];
      var title = (+ val.toFixed(1)).toString() + ' - ' + (+ dom[i+1].toFixed(1)).toString();
      legendData.push({
        color: scale(val),
        title: title
      });
      maxCars = Math.max(maxCars, title.length);
    }
    var options = {
      type: "map",
      theme: "none", // Useless?
      pathToImages: "assets/ammap/images/",
      dataProvider: {
        map: "world",
        areas: areas
      },
      areasSettings: {
        selectable: isOnlyChart(id),
        selectedColor: "#EEEEEE",
        selectedOutlineColor: "red",
        outlineColor: "black",
        outlineThickness: 0.5,
        balloonText: "[[title]]: [[value]]",
        unlistedAreasAlpha: 0.7
      },
      legend: {
        width: (maxCars - 3) * 5 + 55,
        marginRight: 0,
        equalWidths: true,
        maxColumns: 1,
        right: 0,
        data: legendData,
        backgroundAlpha: 0.5
      }
    };
    return options;
  };

  var createPie = function (data, id, pref) {
    var options = updatePieOptions(data, id, pref);

    var chart = window.chart = AmCharts.makeChart("#" + id, options);

    if (isOnlyChart(id)) {
      chart.addListener("rendered", function addBarsListeners() {
        chart.addListener('pullOutSlice', function (event) {
          var filterValue = event.dataItem.title;
          filter.$add('main', filterValue);
          updateDocumentsTable();
          updateFacets();
        });
        chart.addListener('pullInSlice', function (event) {
          var filterValue = event.dataItem.title;
          filter.$delete('main');
          updateDocumentsTable();
          updateFacets();
        });
      });

      graphOptions = options;
      graphId      = id;
      graphPref    = pref;
    }

    chart.write(id);
    graphChart = chart;
  };

  var createHistogram = function (data, id, pref) {
    var options = updateHistogramOptions(data, id, pref);

    var chart = window.chart = AmCharts.makeChart("#" + id, options);

    if (isOnlyChart(id)) {
      chart.addListener("rendered", function addBarsListeners() {
        chart.addListener('clickGraphItem', function (event) {
          var filterValue = event.item.category;
          if (filter.main !== filterValue) {
            filter.$delete('main');
            filter.$add('main', filterValue);
            highlightOnly(chart, event.item);
          }
          else {
            filter.$delete('main');
            unhighlightAll(chart);
          }
          chart.validateData();
          updateDocumentsTable();
          updateFacets();
        });
      });

      graphOptions = options;
      graphId      = id;
      graphPref    = pref;
    }

    chart.write(id);
    graphChart = chart;
  };

  var unhighlightAll = function unhighlightAll(chart) {
    chart.dataProvider.forEach(function (i) {
      if (i.alpha) {
        delete i.alpha;
      }
    });
  };

  var highlightOnly = function highlightOnly(chart, item) {
    unhighlightAll(chart);
    item.dataContext.alpha = 0.5;
  };

  var createHorizontalBars = function (data, id, pref) {
    var options = updateHorizontalBarsOptions(data, id, pref);

    var chart = window.chart = AmCharts.makeChart("#" + id, options);

    if (isOnlyChart(id)) {
      chart.addListener("rendered", function addBarsListeners() {
        console.info('rendered');
        chart.addListener('clickGraphItem', function (event) {
          console.info('clickItem', event);
          var filterValue = event.item.category;
          if (filter.main !== filterValue) {
            filter.$delete('main');
            filter.$add('main', filterValue);
            highlightOnly(chart, event.item);
          }
          else {
            filter.$delete('main');
            unhighlightAll(chart);
          }
          chart.validateData();
          updateDocumentsTable();
          updateFacets();
        });
      });

      graphOptions = options;
      graphId      = id;
      graphPref    = pref;
    }

    chart.write(id);
    graphChart = chart;
  };

  var createMap = function (data, id, pref) {
    // Generate the map.
      $('#' + id).height('600px');

      var options = {};
      options = updateMapOptions(data, id, pref);

      var map = AmCharts.makeChart("#" + id, options);

      if (isOnlyChart(id)) {

        // Seems to work only when map.areasSettings.autoZoom or selectable is true!
        map.addListener('clickMapObject', function (event) {
          var filterValue = event.mapObject.id;
          if (filter.main !== filterValue) {
            filter.$delete('main');
            filter.$add('main', filterValue);
          }
          else if (!event.mapObject.map) {
            filter.$delete('main');
            // unselect area on the map by clicking on the background
            map.clickMapObject(map.dataProvider);
          }
          updateDocumentsTable();
          updateFacets();
        });
        graphOptions = options;
        graphId      = id;
        graphPref    = pref;
      }

      map.write(id);
      graphChart = map;
  };

  var createNetwork = function createNetwork (data, id, pref, fields) {
    updateNetworkOptions(data, id, pref, fields, function (err, options) {

      var network = window.network = new cytoscape(options);
      if (isOnlyChart(id)) {
        graphPref    = pref;
        graphPref.operator = "graph";
        graphId      = id;
        graphChart   = network;
        graphOptions = options;
      }

      // Remove the spinning icon
      $('#' + id + ' i').remove();

    });

  };

  var initPie = function(id, pref) {
    var operator = pref.operator ? pref.operator : "distinct";
    var fields   = pref.fields ? pref.fields : [pref.field];
    var url      = '/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    url += '&columns[0][data]=value&columns[0][orderable]=true';
    url += '&order[0][column]=0&order[0][dir]=desc';
    url += '&itemsPerPage=';

    if (pref.title && !$('#' + id).prev().length) {
      $('#' + id)
      .before('<div class="panel-heading">' +
              '<h2 class="panel-title">' +
              pref.title +
              '</h2></div>');
      $('#' + id)
      .append('<i class="fa fa-refresh fa-spin"></i>');
    }
    $('#' + id).height('500px'); // Default height
    if (pref.size) {
      bootstrapPosition(id, pref.size);
    }

    request
    .get(url)
    .end(function(res) {
      createPie(res.body.data, id, pref);
    });
  };

  var initHistogram = function(id, pref) {
    var operator = pref.operator ? pref.operator : "distinct";
    var fields   = pref.fields ? pref.fields : [pref.field];
    var url      = '/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    url += '&itemsPerPage=';

    if (pref.title && !$('#' + id).prev().length) {
      $('#' + id)
      .before('<div class="panel-heading">' +
              '<h2 class="panel-title">' +
              pref.title +
              '</h2></div>');
      $('#' + id)
      .append('<i class="fa fa-refresh fa-spin"></i>');
    }
    $('#' + id).height('500px'); // Default height
    if (pref.size) {
      bootstrapPosition(id, pref.size);
    }

    request
    .get(url)
    .end(function(res) {
      createHistogram(res.body.data, id, pref);
    });
  };

  var initHorizontalBars = function(id, pref) {
    var operator = pref.operator ? pref.operator : "distinct";
    var maxItems = pref.maxItems ? pref.maxItems : 0;
    var fields   = pref.fields ? pref.fields : [pref.field];
    var url      = '/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    url += '&columns[0][data]=value&columns[0][orderable]=true';
    url += '&order[0][column]=0&order[0][dir]=desc';
    url += '&itemsPerPage=' + maxItems;

    if (pref.title && !$('#' + id).prev().length) {
      $('#' + id)
      .before('<div class="panel-heading">' +
              '<h2 class="panel-title">' +
              pref.title +
              '</h2></div>');
      $('#' + id)
      .append('<i class="fa fa-refresh fa-spin"></i>');
    }
    $('#' + id).height('500px'); // Default height
    if (pref.size) {
      bootstrapPosition(id, pref.size);
    }

    request
    .get(url)
    .end(function(res) {
      createHorizontalBars(res.body.data, id, pref);
    });
  };

  var initMap = function(id, pref) {
    var operator    = pref.operator ? pref.operator : "distinct";
    var fields      = pref.fields ? pref.fields : [pref.field];
    var url         = '/compute.json?o=' + operator;

    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    url += '&columns[0][data]=value&columns[0][orderable]=true';
    url += '&order[0][column]=0&order[0][dir]=desc';
    url += '&itemsPerPage=';

    if (pref.title && !$('#' + id).prev().length) {
      $('#' + id)
      .before('<div class="panel-heading">' +
              '<h2 class="panel-title">' +
              pref.title +
              '</h2></div>');
      $('#' + id)
      .append('<i class="fa fa-refresh fa-spin"></i>');
    }

    request
    .get(url)
    .end(function(res) {
      createMap(res.body.data, id, pref);
    });
  };

  var displayNetworkLinks = function displayNetworkLinks(links, id, pref) {
    network.nodes().hide();
    links.forEach(function (link) {
      var nodes = JSON.parse(link._id);
      network.nodes('[name="' + nodes[0] + '"]').show();
      network.nodes('[name="' + nodes[1] + '"]').show();
    });
    network.fit(network.nodes(':visible'));
  };

  var initNetwork = function(id, pref) {
    var operator = pref.operator ? pref.operator : "graph";
    var maxItems = pref.maxItems ? pref.maxItems : 1000;
    var fields   = pref.fields ? pref.fields : [pref.field];
    var url      = '/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    url += '&columns[0][data]=value&columns[0][orderable]=true';
    url += '&order[0][column]=0&order[0][dir]=desc';
    url += '&itemsPerPage=' + maxItems;
    if (pref.threshold && typeof pref.threshold === 'number') {
      url += '&query={"$gte":' + pref.threshold + '}';
    }

    if (pref.title && !$('#' + id).prev().length) {
      $('#' + id)
      .before('<div class="panel-heading">' +
        '<h2 class="panel-title">' +
        pref.title +
        '</h2></div>');
      $('#' + id)
      .append('<i class="fa fa-refresh fa-spin"></i>');
    }

    request
    .get(url)
    .end(function(res) {
      createNetwork(res.body.data, id, pref, fields);
    });
  };


  /**
   * Create the facets of the graph id
   * @param  {String} id     Identifier of the graph
   * @param  {Array}  facets Facets to draw for the graph
   */
  var createFacets = function createFacets(id, facets) {
    if (!facets) {
      $('#charts').removeClass('col-md-9').addClass('col-md-12');
      $('#facetsTabs').addClass('hidden');
      return;
    }
    var facetNb = 0;
    facets.forEach(function (facet, facetId) {
      // Dropdowns
      var dropLi =
        '<li id="facet-' + facetId + '" class="facetLi" role="presentation">' +
        ' <a href="#tabFacet-' + facetId +'" role="menuitem" tabindex="-1">' + facet.label;
      if (facet.help) {
        // dropLi += '<i class="fa fa-question-circle"' +
        //          ' data-toggle="popover" title="Help"' +
        //          ' data-content="' + marked(facet.help) +  '"></i>';
        dropLi += ' <i class="fa fa-question-circle"' +
                 ' data-toggle="tooltip"' +
                 ' data-placement="bottom"' +
                 ' title="' + facet.help.escapeHTML() +  '"></i>';
      }
      dropLi +=  '</a>' + '</li>';
      $('#facets')
      .append(dropLi);

      // Tables
      $('#facetsDrop')
      .after(
        '<table ' +
        '  class="table table-striped table-bordered table-hover"' +
        '  id="dtFacets-' + facetId + '">' +
        '  <thead>' +
        '  <tr>' +
        '    <th>' + facet.label + '</th>' +
        '    <th>' + (facet.column2 || 'Occ') + '</th>' +
        '  </tr>' +
        '  </thead>' +
        '</table>');

      var options = {
        ajax: '/compute.json?o=distinct&f=' + facet.path,
        serverSide: true,
        dom: "rtip",
        pagingType: "simple",
        columns: [
          { "data": "_id" },
          { "data": "value" }
        ],
        "order": [[1, "desc"]]
      };
      if (facet.paging === false) {
        options.dom = "rti";
      }
      var dtFacet = $('#dtFacets-' + facetId).DataTable(options);
      dtFacets[facetId] = dtFacet; // for later reference
      if (facetNb) {
        $('#dtFacets-' + facetId + '_wrapper').hide();
      }

      // make tab-nav work
      $('#facet-' + facetId + '>a')
      .click(function (e) {
        e.preventDefault();
        $('#facetsTabs>.dataTables_wrapper').hide();
        $('#dtFacets-'+facetId).parent().show();
        // make the new tab active, and the old one not.
        $('.facetLi').removeClass('active');
        $('#facet-' + facetId).addClass('active');
        $('#facetLabel').text(facet.label);
      });
      if (!facetNb) {
        $('#facet-' + facetId).addClass('active');
        $('#facetLabel').text(facet.label);
      }

      $('#dtFacets-' + facetId + ' tbody').on('click','tr', function selectFacet() {
        // Select only one row
        if ($(this).hasClass('selected')) {
          $(this).removeClass('selected');
        }
        else {
          dtFacet.$('tr.selected').removeClass('selected');
          $(this).addClass('selected');
        }
        var selection = dtFacet.rows('.selected').data();
        var facetIndex = facetId;
        if(selection.length) {
          var facetValue = selection[0]._id;
          table.columns(fieldNb + facetIndex).search(facetValue).draw();
          // $delete and $add are Vuejs methods
          filter.$delete(facet.label);
          filter.$add(facet.label, facetValue);
          updateGraph();
        }
        else {
          table.columns(fieldNb + facetIndex).search('').draw();
          filter.$delete(facet.label);
          updateGraph();
        }
      });
      facetNb ++;
    });
  };

  // Get the dashboard preferences

  if (Config.dashboard && Config.dashboard.charts && Array.isArray(Config.dashboard.charts)) {

    Config.dashboard.charts.forEach(function (pref, chartNb) {
      var id = "chart" + chartNb;

      if (isOnlyChart(id) || pathname !== '/chart.html') {
        var fields = pref.fields ? pref.fields : [pref.field];
        currentField = fields[0];

        $('#charts').append('<div class="panel panel-default col-md-12">' +
          '<div id="' +  id + '" class="panel-body"></div>' +
          '</div>');

        if (pref.type && (pref.field || pref.fields) ) {

          if (isOnlyChart(id)) {
            var addLink = function addLink(data, type, row) {
              return '<a href="/display/' + row.wid + '.html">' + data + '</a>';
            };
            var options = {
              search: {
                regex: true
              },
              ordering: true,
              serverSide: true,
              lengthMenu: [Config.itemsPerPage||5,10,25,50,100],
              ajax: "/browse.json",
              dom: "lifrtip"
            };
            var columns = [{
              data: pref.field || pref.fields[1] || pref.fields[0]
            }];
            var facetsNb  = 0;
            var allFields = [];
            fieldNb       = 1;
            for (var documentfield in Config.documentFields) {
              if (Config.documentFields[documentfield].visible) {
                columns.push({data: documentfield.replace('$','')});
                allFields.push(fieldNb);
                fieldNb++;
              }
            }
            if (pref.facets) {
              facetsPrefs = pref.facets;
              facetsNb = pref.facets.length;
              pref.facets.forEach(function (facet, facetNb) {
                facets.push(facet.label);
                var facetId = "facet" + facetNb;
                columns.push({data: facet.path});
                $('#dataTables-documents tr')
                .append('<th>' + facet.label + '</th>');
              });
            }
            options.columns = columns;
            options.columnDefs = [{
              "render": addLink,
              "targets": allFields
            }];
            table = $('#dataTables-documents').DataTable(options);
            table.column(0).visible(false);
            // facets
            for (var i = 0; i < facetsNb; i++) {
              table.column(fieldNb + i).visible(false);
            }
            createFacets(id, pref.facets);
          }


          if (pref.type === 'histogram') {
            initHistogram(id, pref);
          }
          else if (pref.type === 'horizontalbars') {
            initHorizontalBars(id, pref);
          }
          else if (pref.type === 'pie') {
            initPie(id, pref);
          }
          else if (pref.type === 'network') {
            initNetwork(id, pref);
          }
          else if (pref.type === 'map') {
            initMap(id, pref);
          }

          if (isOnlyChart(id)) {
            $('[data-toggle="tooltip"]').tooltip();
            if (pref.help) {
              $('.specificHelp').append(marked(pref.help));
            }
          }
          else {
            $('#' + id).after(
              '<a href="chart.html?id=' + id + '">' +
              '<div class="panel-footer">'+
              '<span class="pull-left">View Details</span>'+
              '<span class="pull-right"><i class="fa fa-arrow-circle-right"></i></span>'+
              '<div class="clearfix"></div>'+
              '</div>' +
              '</a>');
          }

        }
        else {
          console.log('Bad preference for "%s" chart :', id, '(`field` and `type` are not define)');
          console.log(pref);
        }
      }

    });
  }
  else {
    $('#charts').append('<div  class="alert alert-danger" role="alert">' +
      'No chart configured !' +
      '</div>');
  }


});
