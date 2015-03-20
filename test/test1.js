/*jshint node:true*/

var conf  = require('./dataset/test1.json');

module.exports = {
  'Has a title': function (test) {
    test
    .open('http://localhost:'+conf.port)
    .assert.exists('.navbar-header', 'The navbar-header exists')
    .assert.title('Test 1 -', 'The title is "Test 1 -"')
    .done();
  },
  'Has a navigation sidebar': function (test) {
    test
    .open('http://localhost:'+conf.port)
    .assert.exists('.sidebar-nav', 'The sidebar-nav exists')
    .assert.exists('.nav#side-menu', 'There is a list within sidebar')
    .assert.text('#nav-index .active', 'Dashboard', 'The dashboard is in the menu')
    .assert.text('ul#side-menu.nav li:nth-last-child(2) a', 'Documents', 'The documents page is in the menu')
    .done();
  },
  'Has no chart configured': function (test) {
    test
    .open('http://localhost:'+conf.port)
    .assert.text('div.alert', 'No chart configured !', 'Alert is present')
    .done();
  },
  'Has no documents': function (test) {
    test
    .open('http://localhost:'+conf.port+'/documents.html')
    .assert.text('div.alert', 'No field is marked as visible !', 'Alert on field settings')
    .done();
  }
};