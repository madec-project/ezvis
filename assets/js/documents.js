/*jslint node:true */
/*global $,c3,pathname,superagent,config */
'use strict';

$(document).ready(function() {

  var addLink = function addLink(data, type, row) {
    return '<a href="/display/' + row.wid + '.html">' + data + '</a>';
  };

  var fieldNb = Object.keys(config.customFields).reduce(function(p, c) {
    return config.customFields[c].visible ? p + 1 : p;
  }, 0);

  var allFields = [];
  for (var i = 0; i < fieldNb; i++) {
    allFields.push(i);
  }
  var columns = Object.keys(config.customFields).map(function(x) {
    return config.customFields[x].visible ? { data : 'fields.' + x} :  undefined;
  }).filter(function(x) { return (x !== undefined); });

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
      }]
    });
    table.on('xhr', function () {
      console.log('xhr', table.ajax.params());
    } );
  } 
  else {
    $('#dataTables-documents').parent().append('<div  class="alert alert-danger" role="alert">' + 'No field is marked as visible !' + '</div>');
  }
});
