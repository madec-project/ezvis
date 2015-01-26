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

  var verbalize = function verbalize (filter) {
    var verbalized = '';
    Object.keys(filter, function (label, value) {
      verbalized += (label === 'main' ? '' :' ' + label + '=') +
                    '<strong>' + value + '</strong>';
    });
    return verbalized;
  };

  var displayFilter = function displayFilter() {
    $('#filter').html(verbalize(filter));
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
        url += '&sel={"' + currentField + '":"'+filter.main+'"}';
      }
      dtFacets[facetId].ajax.url(url);
      dtFacets[facetId].ajax.reload();
    });
  };

  var updateGraph = function updateGraph() {
    if (!graphOptions) return;
    if (!graphOptions.data) return;
    if (!graphOptions.data.type && !graphOptions.data.types) return;

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
      var type = graphOptions.data.type || graphOptions.data.types.notices;
      switch(type) {
        case 'pie':
          var columns = [];
          res.body.data.each(function(e) {
            columns.push([e._id, e.value]);
          });
          graphChart.unload();
          graphChart.load({
            columns: columns
          });
          break;
        case 'bar': // Both horizontalbars and histogram
          // Create a dictionary: key -> occurrence
          var k = {};
          res.body.data.each(function(e) {
            k[e._id] = e.value;
          });

          var categories = Object.keys(k);
          columns = Object.values(k);
          columns.unshift('notices'); // TODO make it configurable?
          graphOptions.data.columns = [columns];
          // Maybe more proper using graphChart.load, but some bugs...
          graphOptions.axis.x.categories = categories;
          c3.generate(graphOptions);
          break;
        default:
          console.warn('Unknown chart type ' + graphOptions.data.type + '!');
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
  };

  var generateHistogram = function(id, pref) {
    var operator = pref.operator ? pref.operator : "distinct";
    var fields   = pref.fields ? pref.fields : [pref.field];
    var url      = '/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    url += '&itemsPerPage=';

    if (pref.title && !$('#' + id).prev().length) {
      $('#' + id).before('<div class="panel-heading">' +
                         '<h2 class="panel-title">' +
                         pref.title +
                         '</h2></div>');
      $('#' + id)
      .append('<i class="fa fa-refresh fa-spin"></i>');
    }

    request
    .get(url)
    .end(function(res) {
      self.years = res.body.data;

      // Create a dictionary: year -> occurrence
      var y = {};
      self.years.each(function(e) {
        y[e._id] = e.value;
      });

      var categories = Object.keys(y);
      var columns = Object.values(y);
      columns.unshift('notices'); // TODO make it configurable?

      // Default options values
      var options = {
        bindto: '#' + id,
        data: {
          columns: [
            columns
          ],
          types: { notices: 'bar'}
        },
        axis: {
          x: {
            type: 'category',
            categories: categories
          }
        },
        size: {
          height: 'auto'
        }
      };
      // Override options with configuration values
      if (pref.size) {
        options.size = pref.size;
        bootstrapPosition(id, pref.size);
      }
      // Color
      if (pref.color) {
        options.data.colors = { notices : pref.color };
      }
      // Legend
      options.legend = pref.legend || { show: false };

      if (isOnlyChart(id)) {
        options.data.selection = { enabled : true };
        options.data.selection.multiple = false;
        options.data.onselected = function (d, element) {
          var filterValue = categories[d.index];
          filter.$delete('main');
          filter.$add('main', filterValue);
          updateDocumentsTable();
          updateFacets();
        };
        graphOptions = options;
        graphId      = id;
        graphPref    = pref;
      }

      var histogram = c3.generate(options);
      graphChart = histogram;
    });
  };

  var generatePie = function(id, pref) {
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

    var maxItems = pref.maxItems ? pref.maxItems : 100;

    request
    .get(url)
    .end(function(res) {
      self.themes = res.body.data;

      var columns = [];
      self.themes.each(function(e) {
        columns.push([e._id, e.value]);
      });

      // Default options values
      var options = {
        bindto: '#' + id,
        data: {
          columns: columns,
          type: 'pie'
        },
        pie: {
          label: {
            format: function (v, r) { return String(v); }
          }
        },
        legend: {
          position: 'right'
        },
        size: {
          height: "auto"
        },
        tooltip: {
          format: {
            value: function (value, ratio, id) {
              return value;
            }
          }
        }
      };
      // Override options with configuration values
      if (pref.legend) {
        options.legend = pref.legend;
      }
      if (pref.size) {
        options.size = pref.size;
        bootstrapPosition(id, pref.size);
      }
      var colors        = {};
      var i             = 0;
      var orderedValues = {};
      // Reorder by values
      columns.each(function (e) {
        orderedValues[e[1]] = e[0];
      });
      // Colors
      var palette;
      if (pref.colors) {
        palette = pref.colors;
      }
      else if (!options.data.colors) {
        palette = [ '#BB9FF5', '#ff7a85', '#44b2ba', '#ffa65a', '#34cdb8'];
      }
      if (pref.colors || !options.data.colors) {
        Object.keys(orderedValues, function (value, key) {
          colors[key] = palette[i++ % palette.length];
        });
        options.data.colors = colors;
      }

      if (isOnlyChart(id)) {
        options.data.selection          = {enabled:true};
        options.data.selection.multiple = false;
        options.data.onselected = function (d, element) {
          var filterValue = d.id;
          filter.$delete('main');
          filter.$add('main', filterValue);
          updateDocumentsTable();
          updateFacets();
        };
        graphOptions = options;
        graphId      = id;
        graphPref    = pref;
      }

      // Generate the pie.
      var pie = c3.generate(options);
      graphChart = pie;
    });
  };

  var generateHorizontalBars = function(id, pref) {
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

    request
    .get(url)
    .end(function(res) {
      var keys = res.body.data;

      // Create a dictionary: key -> occurrence
      var k = {};
      keys.each(function(e) {
        k[e._id] = e.value;
      });

      var categories = Object.keys(k);
      var columns = Object.values(k);
      columns.unshift('notices'); // TODO make it configurable?

      // Default options values
      var options = {
        bindto: '#' + id,
        data: {
          columns: [
            columns
          ],
          types: { notices: 'bar'}
        },
        axis: {
          rotated: true,
          x: {
            type: 'category',
            categories: categories
          }
        },
        size: {
          height: 'auto'
        },
        legend: {
          show: false
        }
      };
      // Override options with configuration values
      if (pref.size) {
        options.size = pref.size;
        bootstrapPosition(id, pref.size);
      }
      // Color
      if (pref.color) {
        options.data.colors = { notices : pref.color };
      }
      if (pref.legend) {
        options.legend = pref.legend;
      }

      if (isOnlyChart(id)) {
        options.data.selection = {enabled:true};
        options.data.selection.multiple = false;
        options.data.onselected = function (d, element) {
          var filterValue = categories[d.index];
          filter.$delete('main');
          filter.$add('main', filterValue);
          updateDocumentsTable();
          updateFacets();
        };
        graphOptions = options;
        graphId      = id;
        graphPref    = pref;
      }
      var horizontalbars = c3.generate(options);
      graphChart = horizontalbars;
    });
  };

  var generateNetwork = function(id, pref) {
    var operator = pref.operator ? pref.operator : "graph";
    var maxItems = pref.maxItems ? pref.maxItems : 100;
    var fields   = pref.fields ? pref.fields : [pref.field];
    var url      = '/compute.json?o=' + operator;
    fields.forEach(function (field) {
      url += '&f=' + field;
    });
    // url += '&columns[0][data]=weight&columns[0][orderable]=true';
    // url += '&order[0][column]=0&order[0][dir]=desc';
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

    request
    .get(url)
    .end(function(res) {
      var edges   = [];
      var nodeIds = {};
      var nodes   = [];

      res.body.data.forEach(function (e, id) {
        var affEff = JSON.parse(e._id);
        e.source = affEff[0];
        e.target = affEff[1];
        edges.push({
          data: {
            id: '#' + id,
            weight: e.weight,
            source: e.source,
            target: e.target
          }
        });
        // memorize nodeIds
        nodeIds[e.source] = true;
        nodeIds[e.target] = true;
      });

      // fill nodes table
      Object.keys(nodeIds).forEach(function (nodeId, i, a) {
        nodes.push({
          data: {
            id: nodeId
          }
        });
      });

      // Override options with configuration values
      if (pref.size) {
        options.size = pref.size;
        bootstrapPosition(id, pref.size);
      }

      // if (isOnlyChart(id)) {
      //   options.data.selection = {enabled:true};
      //   options.data.selection.multiple = false;
      //   options.data.onselected = function (d, element) {
      //     var filterValue = categories[d.index];
      //     filter.$delete('main');
      //     filter.$add('main', filterValue);
      //     updateDocumentsTable();
      //     updateFacets();
      //   };
      //   graphOptions = options;
      //   graphId      = id;
      //   graphPref    = pref;
      // }
      $('#' + id)
      .addClass('network');
      var network = new cytoscape({
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
              'color': 'white',
              'text-outline-width': 2,
              'text-outline-color': '#888'
            })
          .selector('edge')
            .css({
              'width': 4,
              'line-color': '#ddd',
              // 'content': 'data(weight)'
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
          window.cy = this;

          cy.on('tap', 'node', function (e) {
            var node = e.cyTarget;
            var neighborhood = node.neighborhood().add(node);

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
            if (e.cyTarget === cy) {
              cy.elements().removeClass('faded');
              filter.$delete('main');
              updateDocumentsTable();
              updateFacets();
            }
          });
        }
      });
      // Remove the spinning icon
      $('#' + id + ' i').remove();
    });
  };

  var generateMap = function(id, pref) {
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

    request
    .get(url)
    .end(function(res) {
      var areas = res.body.data
      .filter(function (area) {
        return area._id !== null;
      });
      var domain = [areas[areas.length-1].value, areas[0].value];
      // var scale  = chroma.scale(['lightblue', 'navy']).domain(domain,10,'log');
      // color scales (see http://colorbrewer2.com/):
      // RdYlBu (Red, Yellow Blue), BuGn (light blue, Green), YlOrRd (Yellow, Orange, Red)
      var scale  = chroma.scale('YlOrRd').domain(domain,10,'log');
      areas = areas
      .map(function (area) {
        area.id = area._id;
        area.color = scale(area.value).toString();
        console.log(area.value,'->',area.color);
        return area;
      });

      // Generate the map.
      $('#' + id).height('600px');
      var map = new AmCharts.AmMap();
      map.dataProvider = {
        map: "worldLow",
        areas: areas
      };
      map.pathToImages = "assets/ammap/images/";
      /* create areas settings
       * autoZoom set to true means that the map will zoom-in when clicked on the area
       * selectedColor indicates color of the clicked area.
       */
      map.areasSettings = {
          // autoZoom: true,
          selectable: true,
          selectedColor: "#EEEEEE",
          selectedOutlineColor: "red",
          // color: "#222277",    // Maybe better to use chroma in dataProvider
          // colorSolid:"#0000CC" // idem
      };
      if (isOnlyChart(id)) {
        // options.data.onselected = function (d, element) {
        //   var filterValue = d.id;
        //   filter.$delete('main');
        //   filter.$add('main', filterValue);
        //   updateDocumentsTable();
        //   updateFacets();
        // };
        // graphOptions = options;
        
        // Seems to work only when map.areasSettings.autoZoom or selectable is true!
        map.addListener("selectedObjectChanged", function () {
          // TODO: make it more efficient (DRY)
          if (!map.selectedObject.map) {
            console.log('area selected');
            console.log(map.selectedObject);
            var filterValue = map.selectedObject.id;
            filter.$delete('main');
            filter.$add('main', filterValue);
            updateDocumentsTable();
            updateFacets();
          }
          else {
            filter.$delete('main');
            updateDocumentsTable();
            updateFacets();
          }
        });
        graphId      = id;
        graphPref    = pref;
      }

      map.write(id);
      graphChart = map;
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
        '    <th>Occ</th>' +
        '  </tr>' +
        '  </thead>' +
        '</table>');

      var dtFacet = $('#dtFacets-' + facetId).DataTable({
        ajax: '/compute.json?o=distinct&f=' + facet.path,
        serverSide: true,
        dom: "rtip",
        pagingType: "simple",
        columns: [
          { "data": "_id" },
          { "data": "value" }
        ],
        "order": [[1, "desc"]]
      });
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
            for (var userfield in Config.documentFields) {
              if (Config.documentFields[userfield].visible) {
                columns.push({data: "fields." + userfield});
                allFields.push(fieldNb);
                fieldNb++;
              }
            }
            if (pref.facets) {
              facetsPrefs = pref.facets;
              facetsNb = pref.facets.length;
              // Object.keys(pref.facets, function (facetId, facet) {
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
            generateHistogram(id, pref);
          }
          else if (pref.type === 'horizontalbars') {
            generateHorizontalBars(id, pref);
          }
          else if (pref.type === 'pie') {
            generatePie(id, pref);
          }
          else if (pref.type === 'network') {
            generateNetwork(id, pref);
          }
          else if (pref.type === 'map') {
            generateMap(id, pref);
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
