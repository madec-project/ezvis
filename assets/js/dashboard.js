/*jslint node:true */
/*global $,c3,pathname,superagent */
$(document).ready(function () {
  'use strict';
  var table;
  var request = superagent;
  var self = this;

  var isOnlyChart = function isOnlyChart(id) {
    return pathname === '/chart.html' &&
           typeof params !== 'undefined' &&
           params.id === id;
  };

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
    if (pref.title) {
      $('#' + id).before('<div class="panel-heading">' +
                         '<h2 class="panel-title">' +
                         pref.title +
                         '</h2></div>');
    }

    request
    .get('/compute.json?o=distinct&f=' + pref.field + '&itemsPerPage=100')
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
        options.data.selection = {enabled:true};
        options.data.onselected = function (d, element) {
          table.columns(0).search(categories[d.index]).draw();
          $('#filter').text(categories[d.index]);
        };
      }

      var histogram = c3.generate(options);
    });
  };

  var generatePie = function(id, pref) {
    if (pref.title) {
      $('#' + id)
      .before('<div class="panel-heading">' +
              '<h2 class="panel-title">' +
              pref.title +
              '</h2></div>');
    }

    request
    .get('/compute.json?o=distinct&f=' + pref.field + '&itemsPerPage=100')
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
      // Colors
      if (pref.colors) {
        options.data.colors = pref.colors;
      }
      else if (!options.data.colors) {
        // Default colors pattern
        var colors = {};
        var defaultColors =
          [ '#BB9FF5', '#ff7a85', '#44b2ba', '#ffa65a', '#34cdb8'];
        var i = 0;
        // Reorder by values
        var orderedValues = {};
        columns.each(function (e) {
          orderedValues[e[1]] = e[0];
        });
        Object.keys(orderedValues, function (value, key) {
          colors[key] = defaultColors[i++ % defaultColors.length];
        });
        options.data.colors = colors;
      }

      if (isOnlyChart(id)) {
        options.data.selection = {enabled:true};
        options.data.onselected = function (d, element) {
          table.columns(0).search(d.id).draw();
          $('#filter').text(d.id);
        };
      }

      // Generate the pie.
      var pie = c3.generate(options);
    });
  };

  var generateHorizontalBars = function(id, pref) {
    if (pref.title) {
      $('#' + id)
      .before('<div class="panel-heading">' +
        '<h2 class="panel-title">' +
        pref.title +
        '</h2></div>');
    }

    request
    .get('/compute.json?o=distinct&f=' + pref.field + '&itemsPerPage=100')
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

      if (isOnlyChart(id)) {
        // TODO: maximize height
        options.data.selection = {enabled:true};
        options.data.onselected = function (d, element) {
          table.columns(0).search(categories[d.index]).draw();
          $('#filter').text(categories[d.index]);
        };
      }

      var histogram = c3.generate(options);
    });
  };

  var createFacets = function createFacets(id, facets) {
    if (!facets) {
      $('#charts').removeClass('col-md-9').addClass('col-md-12');
      $('#facetsTabs').removeClass('col-md-3').addClass('hidden');
      return;
    }
    var facetNb = 0;
    Object.keys(facets, function (facetId, facet) {

      // Tabs
      $('#facets')
      .append(
        '<li id="facet-' + facetId + '" class="facetLi" role="presentation">' +
        ' <a href="#tabFacet-' + facetId +'">' + facet.label + '</a>' +
        '</li>');

      // Tables
      $('#facets')
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

      var table = $('#dtFacets-' + facetId).DataTable({
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
      });
      if (!facetNb) {
        $('#facet-' + facetId).addClass('active');
      }

      facetNb ++;
    });
  };

  // Get the dashboard preferences
  request
  .get('/config.json')
  .end(function(res) {
    var config = res.body;
    if (config.dashboard && config.dashboard.charts) {
      self.dashboard = config.dashboard;

      Object.keys(self.dashboard.charts, function (id, pref) {

        if (isOnlyChart(id) || pathname !== '/chart.html') {

          $('#charts').append('<div class="panel panel-default col-md-12">' +
            '<div id="' +  id + '" class="panel-body"></div>' +
            '</div>');

          if (pref.type && pref.field) {

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
                lengthMenu: [config.itemsPerPage||5,10,25,50,100],
                ajax: "/browse.json",
                dom: "lifrtip"
              };
              var columns = [{
                data: pref.field
              }];
              var allFields = [];
              var fieldNb   = 1;
              for (var userfield in config.documentFields) {
                if (config.documentFields[userfield].visible) {
                  columns.push({data: "fields." + userfield});
                  allFields.push(fieldNb);
                  fieldNb++;
                }
              }
              options.columns = columns;
              options.columnDefs = [{
                "render": addLink,
                "targets": allFields
              }];
              table = $('#dataTables-documents').DataTable(options);
              table.column(0).visible(false);

              // facets
              var facetNb = 0;
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

            if (!isOnlyChart(id)) {
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
            console.log('Bad preference for "%s" chart :', id);
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

});
