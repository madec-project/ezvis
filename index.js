module.exports = {
  "browserifyModules" : [ 'jquery', 'vue', 'moment', 'qs', 'marked' ],
  "loaders": [
    {
      "script": "castor-load-csv",
      "pattern": "**/*.csv"
    }
  ]
};
