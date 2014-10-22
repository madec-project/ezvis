/*jslint node:true */
/*global $,c3,pathname,superagent,config,Vue */
'use strict';

$(document).ready(function() {

  var qs = require('qs');

  var addLink = function addLink(data, type, row) {
    return '<a href="/display/' + row.wid + '.html">' + data + '</a>';
  };

  var fieldNb = Object.keys(config.documentFields).reduce(function(p, c) {
    return config.documentFields[c].visible ? p + 1 : p;
  }, 0);

  var allFields = [];
  for (var i = 0; i < fieldNb; i++) {
    allFields.push(i);
  }
  var columns = Object.keys(config.documentFields).map(function(x) {
    return config.documentFields[x].visible ? { data : 'fields.' + x} :  undefined;
  }).filter(function(x) { return (x !== undefined); });

  var vexp = new Vue( {
      el: '#exports',
      data: {
        csv: '/browse.csv',
        json: '/browse.json',
        rss: '/browse.rss',
        atom: '/browse.atom'
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
      "ajax" : "/browse.json",
      "lengthMenu" : [ config.itemsPerPage || 5,10,25,50,100],
      "columns" : columns,
      "columnDefs" : [ {
        "render" : addLink,
        "targets" : allFields
      }],
      "dom": '<"dtTop"<"dtLeft"li><"dtRight"f>><rt><"dtBottom"ip><"clear">'
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
});
