/* global $, document, Primus, Vue, Config */
"use strict";
var request = require('superagent');
var moment = require('moment');
function alerts(ws) {
  var vm = new Vue( {
    el: '#alerts',
    data: {
      alerts: []
    },
    ready: function() {
      var self = this;
    },
    filters: {
      humanize :  function(d) {
        return moment(d).fromNow();
      }
    }
  });
  var primus = Primus.connect(ws);
  primus.on('open', function () {
    console.log('open');
    primus.on('changed', function(doc) {
      vm.$data.alerts.push({
        message: doc.basename + ' changed',
        logo: 'retweet',
        horodateur: doc.dateSynchronised
      });
    });
    primus.on('cancelled', function(doc) {
      console.log('cancelled', doc);
    });
    primus.on('dropped', function(doc) {
      vm.$data.alerts.push({
        message: doc.basename + ' deleted',
        logo: 'trash-o',
        horodateur: doc.dateSynchronised
      });
    });
    primus.on('added', function(doc) {
      vm.$data.alerts.push({
        message: doc.basename + ' added',
        logo: 'upload',
        horodateur: doc.dateSynchronised
      });
    });
  });

}
