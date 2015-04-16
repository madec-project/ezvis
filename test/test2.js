/*jshint node:true*/

var conf  = require('./dataset/test2.json');

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
    .assert.text('div#dataTables-documents_info.dataTables_info').is("Showing 1 to 4 of 4 entries", '"Showing 1 to 4 of 4 entries"')
    .assert.text('#dataTables-documents tr:first-child td:first-child a').is('1906','"1906" in first line')
    .assert.text('#dataTables-documents tr:first-child td:nth-child(2) a').is('Kurt Gödel','"Kurt Gödel" in first line')
    .click('#dataTables-documents tr:nth-child(4) td:first:first-child a')
    .assert.title().is('Test 2 - Display document','Correct')
    // .assert.numberOfElements('#documents tbody tr').is(3, '3 fields displayed')
    // .assert.text('#documents tbody tr:first-child td:nth-child(2)').is('Douglas Hofstadter', 'Name is "Douglas Hofstadter"')
    .done();
  },
  "Good display": function (test) {
    test
    .open('http://localhost:'+conf.port+'/display/Z5OAoW.html')
    .assert.title().is('Test 2 - Display document','Correct')
    .assert.numberOfElements('#documents tbody tr').is(3, '3 fields displayed')
    .assert.text('#documents tbody tr:first-child td:nth-child(2)').is('Douglas Hofstadter', 'Name is "Douglas Hofstadter"')
    .done();
  }
};