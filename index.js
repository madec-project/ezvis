module.exports = {
  "browserifyModules" : [ 'jquery', 'vue', 'moment', 'qs', 'marked', 'concept-network' ],
  "loaders": [
    {
      "script": "castor-load-csv",
      "pattern": "**/*.csv"
    }
  ],
  "operators": {
    "count_field1_by_field2": "countby.js",
    "sum_field1_by_field2"  : "sumby.js"
  }
};
