/*jshint node:true, laxcomma:true*/
"use strict";

module.exports = function(config, run) {
  config.set('theme', __dirname);
  run();
};

if (!module.parent) {
  require('castor-core')(module.exports);
}
