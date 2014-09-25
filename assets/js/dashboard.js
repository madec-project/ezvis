/*jslint node:true */
/*global $,c3 */
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
    .get('/compute.json?o=distinct&f=' + pref.field)
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

      if (isOnlyChart(id)) {
        options.data.selection = {enabled:true};
        options.data.onselected = function (d, element) {
          table.columns(0).search(categories[d.index]).draw();
        }
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
    .get('/compute.json?o=distinct&f=' + pref.field)
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
        }
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
    .get('/compute.json?o=distinct&f=' + pref.field)
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

      if (isOnlyChart(id)) {
        options.data.selection = {enabled:true};
        options.data.onselected = function (d, element) {
          table.columns(0).search(categories[d.index]).draw();
        }
      }

      var histogram = c3.generate(options);
    });
  };

  // Get the dashboard preferences
  request
  .get('/index.json')
  .end(function(res) {
    var config = res.body.config;
    self.dashboard = config.dashboard;
    var charts = self.dashboard.charts;

    Object.keys(charts, function (id, pref) {

      if (isOnlyChart(id) || pathname !== '/chart.html') {

        $('#charts').append('<div class="panel panel-default col-md-12">' +
                            '<div id="' +  id + '" class="panel-body"></div>' +
                            '</div>');

        if (pref.type && pref.field) {

          if(isOnlyChart(id)) {
            var options = {
              ordering: true,
              serverSide: true,
              lengthMenu: [5,10,25,50,100],
              ajax: "/browse.json",
            };
            var columns = [{
              data: pref.field
            }];
            for (var userfield in config.userfields) {
              columns.push({data: config.userfields[userfield]});
            }
            options.columns = columns;
            table = $('#dataTables-documents').DataTable(options);
            table.column(0).visible(false);
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
            $('#' + id).after('<div class="panel-footer">'+
              '<a href="chart.html?id='+ id + '" class="pull-left">View Details</a>'+
              '<span class="pull-right"><i class="fa fa-arrow-circle-right"></i></span>'+
              '<div class="clearfix"></div>'+
            '</div>');
          }
        }
        else {
          console.log('Bad preference for "%s" chart :', id);
          console.log(pref);
        }
      }

      // add chart ID in the left navbar
      $('#charts-list')
      .append('<li>' +
              '     <a href="chart.html?id=' + id + '">' + pref.title + '</a>' +
              '</li>');
    });
  });

});
