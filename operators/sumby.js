/*jshint node:true, laxcomma:true*/
'use strict';

/**
 * Operator sum field1 by field2
 *
 *
 * Return the sum of the values from field1 for each value of
 * field2.
 *
 * Ex: count citaitons by year /-/v2/compute.json?o=count_field1_by_field2&f=fields.citations&f=content.json.year&itemsPerPage=0
 *
 * doc      year       citations
 * #1       2001        10
 * #2       2002        5
 * #3       2002        2
 * #4       2003        1
 * #5       2002        3
 * #6       2002        1
 * #7       2003        2
 * #8       2001        3
 * #9       2002        1
 *
 * will produce:
 *
 * {
 *   "2001" : 13,
 *   "2002" : 12,
 *   "2003" : 3
 * }
 *
 * The actual format is:
 *
 * ...
 * data: [
 * {
 *   _id: "2001",
 *   value: 13
 * },
 * {
 *   _id: "2002",
 *   value: 12
 * },
 * {
 *   _id: "2003",
 *   value: 3
 * }
 * ]
 */

/**
 * map each document, emit all pair of values (field1 and field2)
 *
 * Ex (citations and year):
 *
 * doc   emit(value2, value1)
 * #1         2001    10
 * #2         2002    5
 * #3         2002    2
 * #4         2003    1
 * #5         2002    3
 * #6         2002    1
 * #7         2003    2
 * #8         2001    3
 * #9         2002    1
 */
module.exports.map = function() {
  /* global exp, emit */
  /**
   * access to a prop(erty) of obj
   * @param  {Object} obj  an object
   * @param  {String} prop dot notation for the property
   */
  var access = function access(obj, prop) {
    var segments = prop.split('.');
    while (segments.length) {
      var key = segments.shift();
      if (obj[key]) {
        obj = obj[key];
      }
      else {
        obj = undefined;
      }
    }
    return obj;
  };

  var doc    = this;
  var fields = exp;

  if (fields.length !== 2) return;
  var field1 = fields[0];
  var field2 = fields[1];

  var values1 = access(doc, field1);
  if (!Array.isArray(values1)) {
    values1 = [values1];
  }

  var values2 = access(doc, field2);
  if (!Array.isArray(values2)) {
    values2 = [values2];
  }

  values2.forEach(function(value2) {
    values1.forEach(function(value1) {
      emit(value2, Number(value1));
    });
  });
};

/**
 * sum all values by field2
 * @param  {Literal} value2  one value of field2
 * @param  {Array} values1 all values of field1 for field2
 *
 * Ex:
 *
 * value2, values1        reduction
 * 2001, [10,3]           13
 * 2002, [5,2,3,1,1]      12
 * 2003, [1,2]            3
 */
module.exports.reduce = function (value2, values1) {
  return Array.sum(values1);
};
