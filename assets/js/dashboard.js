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
        if (typeof value !== 'object') {
          table.columns(0).search(value);
        }
        else {
          table.columns(0).search(value.code);
        }
      }
      else {
        // FIXME: does not work in multifields network without matching facets
        var facetIndex = facets.indexOf(key);
        if (facetIndex !== -1) {
          table.columns(fieldNb + facetIndex).search(value);
        }
      }
    });
    table.draw();
  };

  /**
   * Return the url for a facet
   * @param  {Number} facetId Identifier of the facet
   * @param  {Object} pref    Preference of the facet
   * @return {String}         URL to get the distinct values of the facet
   */
  var facet2url = window.f = function facet2url(facetId, pref) {
    var sel         = {};
    var selMain     = {};
    var selCenter   = {};
    var selSelector = {};
    var selArray    = [];
    if (filter.main) {
      switch(typeof filter.main) {
      case 'object':
        selMain[currentField] = filter.main.code;
        break;
      default:
        selMain[currentField] = filter.main;
        break;
      }
      selArray.push(selMain);
    }
    if (pref.centerOn && pref.centerOn.length) {
      selCenter[currentField] = {'$elemMatch':{ '$in': pref.centerOn }};
      selArray.push(selCenter);
    }
    if (pref.selector && typeof pref.selector === 'object') {
      selSelector = pref.selector;
      selArray.push(selSelector);
    }

    var facet = facetsPrefs[facetId];
    var url   = '/-/v2/compute.json?o=distinct&f=' + facet.path;

    if (selArray.length && selArray.length < 2) {
      sel = selArray[0];
    }
    else if (selArray.length >= 2) {
      sel = { '$and': selArray };
    }

    if (Object.keys(sel).length) {
      url += '&sel=' + encodeURIComponent(JSON.stringify(sel));
    }
    return url;
  };

  var updateFacets = function updateFacets() {
    facets.forEach(function (facetLabel, facetId) {
      var url = facet2url(facetId, graphPref);
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
    var flyings  = graphPref.flying ? graphPref.flying : [];
    var url      = '/-/v2/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    flyings.forEach(function (flying) {
      url += '&ff=' + flying;
    });
    url += '&itemsPerPage=' + maxItems;


    // add filter to the URL
    var sel = filter2Selector();
    var jsonSel = JSON.parse(sel);
    if (graphPref.type !== 'histogram') {
      url +=
         '&columns[0][data]=value&columns[0][orderable]=true' +
         '&order[0][column]=0&order[0][dir]=desc';
      if (graphPref.type === 'network') {
        /// threshold is not wanted there
        // if (graphPref.threshold && typeof graphPref.threshold === 'number') {
        //   url += '&query={"$gte":' + graphPref.threshold + '}';
        // }
        if (graphPref.selector && typeof graphPref.selector === 'object') {
          // WARNING: when the key is the same, it is overwritten
          sel = /*encodeURIComponent(*/JSON.stringify(jQuery.extend(jsonSel, graphPref.selector))/*)*/;
        }
      }
    }
    else {
      url +=
         '&columns[0][data]=_id&columns[0][orderable]=true' +
         '&order[0][column]=0&order[0][dir]=asc';
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
    // Vue.config('debug', true);
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
      "marginTop"   : 0,
      "creditsPosition": "bottom-right",
      "export": {
        "enabled": true,
        "libs": {
          "path": "/assets/amcharts/plugins/export/libs/"
        }
      }
    };
    if (pref.legend) {
      options.legend = pref.legend || {};
      options.labelText = "[[value]]";
      // Change legend labels
      if (pref.labels) {
        var legendData = [];
        var defaultColors = ["#FF0F00", "#FF6600", "#FF9E01", "#FCD202", "#F8FF01", "#B0DE09", "#04D215", "#0D8ECF", "#0D52D1", "#2A0CD0", "#8A0CCF", "#CD0D74", "#754DEB", "#DDDDDD", "#999999", "#333333", "#000000", "#57032A", "#CA9726", "#990000", "#4B0C25"];
        for (var i = 0; i < data.length; i++) {
          legendData.push({
            title: pref.labels[data[i]._id] ? pref.labels[data[i]._id] : data[i]._id,
            value: data[i].value,
            color: pref.colors? pref.colors[i%pref.colors.length] : defaultColors[i%defaultColors.length]
          });
        }
        options.legend.data = legendData;
      }
    }
    if (pref.colors) {
      options.colors = pref.colors ;
    }
    if (pref.groupPercent) {
      options.groupPercent = pref.groupPercent;
    }
    if (pref.groupedTitle) {
      options.groupedTitle = pref.groupedTitle;
    }
    if (pref.removeLabels) {
      options.labelsEnabled = false;
    }
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
      "categoryAxis" : {
      },
      "startDuration": 1,
      "valueAxes"    : [{
        "id": "v1",
        "position": "left",
        "minimum": 0
      },{
        "id": "v2",
        "position": "right",
        "gridAlpha": 0,
        "minimum": 0
      }],
      "graphs" : [{
        "type"        : "column",
        "alphaField"  : "alpha",
        "fillAlphas": 1,
        "balloonText" : "[[_id]]: [[value]]",
        "dashLengthField": "dashLengthColumn", // REMOVE ?
        "title"       : pref.title ? pref.title : "",
        "valueField"  : "value",
        "valueAxis"   : "v1",
        "showHandOnHover" : true
      }],
      "creditsPosition": "bottom-right",
      "export": {
        "enabled": true,
        "libs": {
          "path": "/assets/amcharts/plugins/export/libs/"
        }
      }
    };
    if (pref.parseDates) {
      options.categoryAxis.parseDates = true;
    }
    if (pref.color) {
      options.graphs[0].fillColors = [ pref.color ];
    }
    if (pref.labels) {
      options.categoryAxis = {
        labelFunction: function (valueText, serialDataItem, categoryAxis) {
          if (pref.labels[valueText]) {
            return pref.labels[valueText];
          }
          else {
            return valueText;
          }
        }
      };
    }
    if (pref.overlay) {
      options.graphs[1] = {
        "id": "graph2",
        "balloonText": (pref.overlay.label||"") + " [[value]]",
        "bullet": "round",
        "lineThickness": 3,
        "bulletSize": 7,
        "bulletBorderAlpha": 1,
        "bulletColor": "#FFFFFF",
        "useLineColorForBulletBorder": true,
        "bulletBorderThickness": 3,
        "fillAlphas": 0,
        "lineAlpha": 1,
        "title": "Citations",
        "valueField": "value2",
        "valueAxis": "v2",
        "showHandOnHover" : true
      };
      if (pref.overlay.color) {
        options.graphs[1].lineColor = pref.overlay.color;
      }
      return options;
    }
    else {
      return options;
    }
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
      "valueAxes"    : [{
        "minimum": 0
      }],
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
      "creditsPosition": "bottom-right",
      "export": {
        "enabled": true,
        "libs": {
          "path": "/assets/amcharts/plugins/export/libs/"
        }
      }
    };
    if (pref.labels) {
      console.log('labels', pref.labels);
      options.categoryAxis = {
        labelFunction: function (valueText, serialDataItem, categoryAxis) {
          if (pref.labels[valueText]) {
            return pref.labels[valueText];
          }
          else {
            return valueText;
          }
        }
      };
    }
    if (pref.color) {
      options.graphs[0].fillColors = [ pref.color ];
    }
    return options;
  };

  /**
   * Convert an object from the graph operator to an id
   * @param  {Object} node {field: value}
   * @return {String}      identifier usable in cytoscape
   * @see    http://stackoverflow.com/a/22429679/93887
   */
  var node2id = window.node2id = function node2id (node) {
    var str = JSON.stringify(node);
    var i, l;
    var hval = 0x811c9dc5; // seed

    for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }

    return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
  };

  /**
   * Update a network options
   * @param  {Array}    data   result of the graph operator
   * @param  {String}   id     identifier of the network
   * @param  {Object}   pref   preferences for the network
   * @param  {Array}    fields array of fields to display
   * @param  {Function} cb     cb(err, options)
   */
  var updateNetworkOptions = function updateNetworkOptions(data, id, pref, fields, cb) {

    var edges     = [];
    var nodeVal   = {};
    var nodeIds   = {};
    var nodes     = [];
    var maxWeight = -Infinity;
    var minWeight = +Infinity;

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
          source: node2id(e.source),
          target: node2id(e.target)
        }
      });
      // memorize nodes
      var sourceId = node2id(e.source);
      var targetId = node2id(e.target);
      nodeVal[sourceId] = e.source;
      nodeVal[targetId] = e.target;
      nodeIds[sourceId] = nodeIds[sourceId] ? nodeIds[sourceId] + 1 : 1;
      nodeIds[targetId] = nodeIds[targetId] ? nodeIds[targetId] + 1 : 1;
    });

    var domain = [0, fields.length -1];
    var classNb = fields.length < 3 ? 3 : fields.length;
    var scale  = chroma
    .scale(['#a6cce3','#1f78b4','#b2df8a','#33a02c','#fb9a99'].slice(0,classNb))
    .domain(domain, classNb);

    if (pref.centerOn && !pref.nodes) {
      pref.nodes = pref.centerOn.map(function (n) {
        return { "value": n };
      });
    }
    // fill nodes table
    Object.keys(nodeIds).forEach(function (nodeId, i, a) {
      // node = { "field": "field value" }
      var node     = nodeVal[nodeId];
      var fieldKey = Object.keys(node)[0];
      var fieldNb  = fields.indexOf(fieldKey);
      var toPush   = {
        data: {
          id: nodeId,
          name: node[fieldKey],
          field: fieldNb,
          color: scale(fieldNb).toString()
        }
      };
      if (pref.fieldsColor && pref.fieldsColor[fieldKey]) {
        toPush.data.color = pref.fieldsColor[fieldKey];
      }
      var isCurrentNode = function isCurrentNode(n) {
        if (n.field && n.field !== fieldKey)  {
          return false;
        }
        return n.value === node[fieldKey];
      };
      if (pref.nodes && Array.isArray(pref.nodes) && pref.nodes.length) {
        var matchingNodes = pref.nodes.filter(isCurrentNode);
        if (matchingNodes.length) {
          var matchingNode = matchingNodes[0];
          toPush.data.color = matchingNode.color ?
                              matchingNode.color :
                              chroma(toPush.data.color).saturate(50).toString();
        }
      }
      nodes.push(toPush);
    });

    // Override options with configuration values
    if (pref.size) {
      options.size = pref.size;
      bootstrapPosition(id, pref.size);
    }

    var edgeWidth = minWeight !== maxWeight ?
      'mapData(weight, ' + minWeight + ', ' + maxWeight + ', 2, 10)' :
      5;

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
            'content': 'data(name)',
            'text-valign': 'center',
            'color': 'black',
            'background-color': 'data(color)',
            'text-opacity': 1,
            'text-outline-width': 2,
            'text-outline-color': '#888'
          })
        .selector('edge')
          .css({
            'width': edgeWidth,
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
          })
        .selector('.top')
          .css({
            'z-index': 1
          }),

      layout: {
        name: 'cola',
        directed: false,
        padding: 10,
        avoidOverlap: true,
        minNodeSpacing: 20,
        nodeSpacing: function (node) { return 20; },
        maxSimulationTime: 9000
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
            var nodeField = fields[node.data('field')];
            if (nodeField === currentField) {
              filter.$add('main', node.data('name'));
            }
            else {
              filter.$add(nodeField, node.data('name'));
            }
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
            var node = e.cyTarget;
            var nodeField = fields[node.data('field')];
            if (nodeField === currentField) {
              filter.$delete('main');
            }
            else {
              filter.$delete(nodeField);
            }
            cy.nodes(':selected').unselect();
            updateDocumentsTable();
            updateFacets();
          }
        });

        // Highlight nodes to see
        if (pref.nodes) {
          pref.nodes.forEach(function (node) {
            var selector = '[name="'+node.value+'"]';
            if (node.field) {
              selector +=  '[field='+fields.indexOf(node.field)+']';
            }
            cy.nodes(selector).addClass('top');
          });
        }

      }
    };
    cb(null, options);

  };

  /**
   * Export the network as a png image.
   * @param {String} filename Name of the file to export
   */
  var exportNetworkPng = window.exportNetworkPng = function (filename) {
    filename = filename || "network.png";
    $('#charts')
    .append(
      '<a id="exportpng" href="' + network.png() + '"' +
      ' download="' + filename + '"' +
      ' style="display:none" ' +
      '>export</a>');
    $('#exportpng')[0].click();
    $('#exportpng').remove();
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
        enabled: true,
        width: (maxCars - 3) * 5 + 55,
        marginRight: 0,
        equalWidths: true,
        maxColumns: 1,
        right: 0,
        data: legendData,
        backgroundAlpha: 0.5
      },
      "creditsPosition": "bottom-right",
      "export": {
        "enabled": true,
        "libs": {
          "path": "/assets/ammap/plugins/export/libs/"
        }
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

      var map = window.map = AmCharts.makeChart("#" + id, options);

      if (isOnlyChart(id)) {

        // Seems to work only when map.areasSettings.autoZoom or selectable is true!
        map.addListener('clickMapObject', function (event) {
          console.log('event.mapObject', event.mapObject);
          console.log('event.mapObject.title', event.mapObject.title);
          var filterValue = event.mapObject.id;
          if (filter.main !== filterValue) {
            filter.$delete('main');
            var newMain = { code: filterValue, label: event.mapObject.title };
            console.log('newMain', newMain);
            filter.$add('main', newMain);
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

      if (pref.centerOn && pref.centerOn.length) {
        var eles = {};
        pref.centerOn.forEach(function (value) {
          // FIXME identifier should integrate field too
          eles[value] = network.elements('node[name="' + value + '"]').closedNeighborhood();
        });
        var edges = network.edges();
        network.nodes().remove();
        Object.keys(eles).forEach(function (element) {
          eles[element].restore();
        });
        // WARNING: this seemed to be useful
        edges.restore();
        // This restores also edges which nodes are still removed, thus yielding
        // messages in console.
      }

      // Remove the spinning icon
      $('#' + id + ' i').remove();

    });

  };

  var initPie = function(id, pref) {
    var operator = pref.operator ? pref.operator : "distinct";
    var fields   = pref.fields ? pref.fields : [pref.field];
    var flyings  = pref.flying ? pref.flying : [];
    var url      = '/-/v2/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    flyings.forEach(function (flying) {
      url += '&ff=' + flying;
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
    var flyings  = pref.flying ? pref.flying : [];
    var url      = '/-/v2/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    flyings.forEach(function (flying) {
      url += '&ff=' + flying;
    });
    url +=
       '&columns[0][data]=_id&columns[0][orderable]=true' +
       '&order[0][column]=0&order[0][dir]=asc';

    if (pref.overlay && pref.overlay.flying) {
      if (pref.overlay.firstOnly) {
        url += '&firstOnly=true';
      }
      url += '&ff=' + pref.overlay.flying[0];
    }
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
    var flyings  = pref.flying ? pref.flying : [];
    var url      = '/-/v2/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    flyings.forEach(function (flying) {
      url += '&ff=' + flying;
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
    var flyings     = pref.flying ? pref.flying : [];
    var url         = '/-/v2/compute.json?o=' + operator;

    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    flyings.forEach(function (flying) {
      url += '&ff=' + flying;
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
      network.nodes('[id="' + node2id(nodes[0]) + '"]').show();
      network.nodes('[id="' + node2id(nodes[1]) + '"]').show();
    });
    network.fit(network.nodes(':visible'), 10);
  };

  var initNetwork = function(id, pref) {
    var operator = pref.operator ? pref.operator : "graph";
    var maxItems = pref.maxItems ? pref.maxItems : 1000;
    var fields   = pref.fields ? pref.fields : [pref.field];
    var flyings  = pref.flying ? pref.flying : [];
    var url      = '/-/v2/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    flyings.forEach(function (flying) {
      url += '&ff=' + flying;
    });
    url += '&columns[0][data]=value&columns[0][orderable]=true';
    url += '&order[0][column]=0&order[0][dir]=desc';
    url += '&itemsPerPage=' + maxItems;
    if (pref.threshold && typeof pref.threshold === 'number') {
      url += '&query={"$gte":' + pref.threshold + '}';
    }
    if (pref.selector && typeof pref.selector === 'object') {
      url += '&sel=' + encodeURIComponent(JSON.stringify(pref.selector));
    }

    if (pref.title && !$('#' + id).prev().length) {
      var strPanelHeading = '<div class="panel-heading">' +
        '<h2 class="panel-title">' +
        pref.title;
      if (isOnlyChart(id)) {
        strPanelHeading +=
        ' <i id="exportnetworkpng' + id + '" title="Export" class="fa fa-download" style="float:right; cursor:pointer; cursor:hand"></i>';
      }
      strPanelHeading += '</h2></div>';
      $('#' + id)
      .before(strPanelHeading);
      $('#' + id)
      .append('<i class="fa fa-refresh fa-spin"></i>');
      if (isOnlyChart(id)) {
        $('#exportnetworkpng' + id).click(function () {
          exportNetworkPng();
        });
      }
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
   * @param  {Object} pref   preferences of the chart
   */
  var createFacets = function createFacets(id, facets, pref) {
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

      var url = facet2url(facetId, pref);

      var options = {
        ajax: url,
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

          // Initialize chart
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

          // Add documents and facets
          if (isOnlyChart(id)) {
            var addLink = function addLink(data, type, row) {
              return '<a href="/-/v2/display/' + row.wid + '.html">' + data + '</a>';
            };
            var url = "/-/v2/browse.json";
            if (pref.centerOn && pref.centerOn.length) {
              url += '?sel={"' + (pref.field || pref.fields[0]) + '":' +
                     '{"$elemMatch":{"$in":' + JSON.stringify(pref.centerOn) + '}}' +
                     '}';
            }
            else if (pref.selector && typeof pref.selector === 'object') {
              url += '?sel=' + JSON.stringify(pref.selector);
            }
            var options = {
              search: {
                regex: true
              },
              ordering: true,
              serverSide: true,
              lengthMenu: [Config.itemsPerPage||5,10,25,50,100],
              ajax: url,
              dom: "lifrtip"
            };
            var columns = [{
              data: pref.field || pref.fields[1] || pref.fields[0]
            }];
            if (pref.type === 'network') {
              columns = [{
                data: pref.field || pref.fields[0]
              }];
            }
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
            options.language = { search: "Filter" };
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
            createFacets(id, pref.facets, pref);

            // exports
            var vexp = new Vue( {
              el: '#chart-exports',
              data: {
                csv: '/-/v2/browse.csv',
                json: '/-/v2/browse.json',
                rss: '/-/v2/browse.rss',
                atom: '/-/v2/browse.atom'
              },
              ready: function() {
                var self = this;
              },
              filters: {
              }
            });

            var qs = require('qs');

            table.on('xhr', function () {
              var params = '?' + qs.stringify(table.ajax.params());
              vexp.$data.csv = table.ajax.url().replace('.json', '.csv') + params;
              vexp.$data.rss = table.ajax.url().replace('.json', '.rss') + params;
              vexp.$data.atom = table.ajax.url().replace('.json', '.atom') + params;
              vexp.$data.json = table.ajax.url().replace('.json', '.json') + params;
            });

          }

          if (isOnlyChart(id)) {
            $('[data-toggle="tooltip"]').tooltip();
            if (pref.help) {
              $('.specificHelp').append(marked(pref.help));
            }

            var a = $('#jbjlink > a');
            if (a.length) {
              var link = a.attr('href');
              var createUrlForChart = function () {
                if (!options) return;
                if (!(pref.type || options.data || options.data.type || options.data.types)) return;

                var operator = pref.operator ? pref.operator : (pref.type === "network" ? "graph" : "distinct");
                var maxItems = pref.maxItems ? pref.maxItems : (pref.type === "network" ? 1000 : 0);
                var fields   = pref.fields ? pref.fields : [pref.field];
                var flyings  = pref.flying ? pref.flying : [];
                var url      = '/-/v2/compute.json?o=' + operator;
                fields.forEach(function (field) {
                  url += '&f=' + field;
                });
                flyings.forEach(function (flying) {
                  url += '&ff=' + flying;
                });
                if (pref.type === 'horizontalbars' || pref.type === 'pie' || pref.type === 'network') {
                  url += '&columns[0][data]=value&columns[0][orderable]=true';
                  url += '&order[0][column]=0&order[0][dir]=desc';
                }
                if (pref.threshold && typeof pref.threshold === 'number') {
                  url += '&query={"$gte":' + pref.threshold + '}';
                }
                if (pref.selector && typeof pref.selector === 'object') {
                  url += '&sel=' + encodeURIComponent(JSON.stringify(pref.selector));
                }

                url += '&itemsPerPage=' + maxItems;
                return url;
              };

              link += window.location.origin + createUrlForChart();
              a.attr('href', link);
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
