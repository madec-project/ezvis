module.exports = {
  "browserifyModules" : [ 'jquery', 'vue', 'moment', 'qs' ],
  "loaders": [
    {
      "script": "castor-load-csv",
      "pattern": "**/*.csv"
    }
  ]
};
