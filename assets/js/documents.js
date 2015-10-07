/*jslint node:true */
/*global $,c3,pathname,superagent,Config,Vue */
'use strict';

$(document).ready(function() {

  var qs = require('qs');

  var addLink = function addLink(data, type, row) {
    return '<a href="/-/v2/display/' + row.wid + '.html">' + data + '</a>';
  };

  var fieldNb = Object.keys(Config.documentFields).reduce(function(p, c) {
    return Config.documentFields[c].visible ? p + 1 : p;
  }, 0);

  var allFields = [];
  for (var i = 0; i < fieldNb; i++) {
    allFields.push(i);
  }
  var columns = Object.keys(Config.documentFields).map(function(x) {
    return Config.documentFields[x].visible ? { data : x.replace('$','')} :  undefined;
  }).filter(function(x) { return (x !== undefined); });

  var vexp = new Vue( {
      el: '#exports',
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


  if (fieldNb) {
    var table = $('#dataTables-documents').DataTable({
      "search" : {
        "regex" : true
      },
      "ordering" : true,
      "serverSide" : true,
      "ajax" : "/-/v2/browse.json",
      "lengthMenu" : [ Config.itemsPerPage || 5,10,25,50,100],
      "columns" : columns,
      "columnDefs" : [ {
        "render" : addLink,
        "targets" : allFields
      }],
      "dom": '<"dtTop"<"dtLeft"li><"dtRight"f>><rt><"dtBottom"ip><"clear">',
      "stateSave": true,
      "language": { "search": "Filter" }
    });
    table.on('xhr', function () {
      var params = '?' + qs.stringify(table.ajax.params());
      vexp.$data.csv = table.ajax.url().replace('.json', '.csv') + params;
      vexp.$data.rss = table.ajax.url().replace('.json', '.rss') + params;
      vexp.$data.atom = table.ajax.url().replace('.json', '.atom') + params;
      vexp.$data.json = table.ajax.url().replace('.json', '.json') + params;
    });


  }
  else {
    $('#dataTables-documents').parent().append('<div  class="alert alert-danger" role="alert">' + 'No field is marked as visible !' + '</div>');
  }

  var a = $('#jbjlink > a');
  if (a.length) {
    var link = a.attr('href');
    link += window.location.href.replace('documents.html','-/v2/browse.json');
    a.attr('href', link);
  }

});
