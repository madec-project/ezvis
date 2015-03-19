/*jshint node:true*/

var conf  = require('./dataset/data2.json');

var nbRecordsPresent = function () {
  var inputs = document.getElementById('input-sm');
  if (inputs.length === 0) {
    return false;
  }
  var input = inputs[0];
  return input.getAttribute('name') === 'dataTables-documents_length';
};

module.exports = {
  "Has data": function (test) {
    test
    .open('http://localhost:'+conf.port+'/documents.html')
    .waitFor(nbRecordsPresent)
    .assert.exists('div#dataTables-documents_info.dataTables_info', '"Showing 1 to 4 of 4 entries"')
    .assert.text('div#dataTables-documents_info.dataTables_info', "Showing 1 to 4 of 4 entries", '"Showing 1 to 4 of 4 entries"')
    .done();
  }
};