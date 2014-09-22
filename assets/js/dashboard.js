/*jslint node:true */
/*global $,c3 */
$(document).ready(function () {
  'use strict';
  var request = superagent;
  var self = this;

  var bootstrapPosition = function(id, size) {
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
    .get('/distinct.json?field=' + pref.field)
    .end(function(res) {
      self.years = res.body.items;

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
    .get('/distinct.json?field=' + pref.field)
    .end(function(res) {
      self.themes = res.body.items;

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
    .get('/distinct.json?field=' + pref.field)
    .end(function(res) {
      var keys = res.body.items;

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

      var histogram = c3.generate(options);
    });
  };

  // Get the dashboard preferences
  request
  .get('/index.json')
  .end(function(res) {
    self.dashboard = res.body.config.dashboard;
    var charts = self.dashboard.charts;
    Object.keys(charts, function (id, pref) {
      $('#charts').append('<div class="panel panel-default col-md-12">' +
                          '<div id="' +  id + '" class="panel-body"></div>' +
                          '</div>');

      if (pref.type && pref.field) {

        if (pref.type === 'histogram') {
          generateHistogram(id, pref);
        }
        else if (pref.type === 'horizontalbars') {
          generateHorizontalBars(id, pref);
        }
        else if (pref.type === 'pie') {
          generatePie(id, pref);
        }
      }
      else {
        console.log('Bad preference for "%s" chart :', id);
        console.log(pref);
      }
    });
  });

});
