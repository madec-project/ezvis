/*jshint node:true, laxcomma:true*/
'use strict';

/**
 * Operator count field1 by field2
 *
 * Return the distribution of the values from field1 for each value of
 * field2.
 *
 * Ex: count keywords by year /-/v2/compute.json?o=count_field1_by_field2&f=fields.keyword&f=content.json.year&itemsPerPage=0
 *
 * doc      year       keyword
 * #1       2001        a, b
 * #2       2002        a
 * #3       2002        b
 * #4       2003        b
 * #5       2002        a,c
 * #6       2002        c
 * #7       2003        c
 * #8       2001        a
 * #9       2002        b
 *
 * will produce:
 *
 * {
 *   "2001" : {
 *     "a"  : 2,
 *     "b"  : 1
 *   };
 *   "2002" : {
 *     "a"  : 2,
 *     "b"  : 2,
 *     "c"  : 2
 *   },
 *   "2003" : {
 *     "b"  : 1,
 *     "c"  : 1
 *   }
 * }
 *
 * The actual format is:
 *
 * ...
 * data: [
 * {
 *   _id: "2001",
 *   value: {
 *     a: 2,
 *     b: 1
 *   }
 * },
 * {
 *   _id: "2002",
 *   value: {
 *     a: 2,
 *     b: 2,
 *     c:2
 *   }
 * },
 * {
 *   _id: "2003",
 *   value: {
 *     b: 1,
 *     c: 1
 *   }
 * }
 * ]
 */

/**
 * map each document, emit all pair of values (field1 and field2)
 *
 * Ex (count keywords by year):
 *
 * doc   emit(value2, value1)
 * #1         2001    a
 * #1         2001    b
 * #2         2002    a
 * #3         2002    b
 * #4         2003    b
 * #5         2002    a
 * #5         2002    c
 * #6         2002    c
 * #7         2003    c
 * #8         2001    a
 * #9         2002    b
 */
module.exports.map = function() {
  /* global exp, emit */
  /**
   * access to a prop(erty) of obj
   * @param  {Object} obj  an object
   * @param  {String} prop dot notation for the property
   * @return {?}      property of the object (or undefined)
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
      emit(value2, value1);
    });
  });
};

/**
 * reduce all values by field2, by returning a count by value2
 * @param  {Literal} value2  one value of field2
 * @param  {Array} values1 all values of field1 for field2
 *
 * Ex:
 *
 * value2, values1       reduction
 * 2001, [a,b,a]          { "a": 2, "b": 1 }
 * 2002, [a,b,a,c,c,b]    { "a": 2, "b": 2, "c": 2}
 * 2003, [b,c]            { "b": 1, "c": 1}
 */
module.exports.reduce = function (value2, values1) {
  var result = {};
  var previousResult;
  var mergePreviousInCurrent = function (key) {
    if (!result[key]) {
      result[key] = previousResult[key];
    }
    else {
      result[key] += previousResult[key];
    }
  };

  while (typeof values1[0] === 'object') {
    previousResult = values1.shift();
    // Merge result and previousResult
    Object.keys(previousResult).forEach(mergePreviousInCurrent);
  }

  values1.forEach(function (value1) {
    if (result[value1]) {
      result[value1]++;
    }
    else {
      result[value1] = 1;
    }
  });
  return result;
};


// sort the values2 according to their occurrences
module.exports.finalize = function(items) {
  var result = [];
  items.forEach(function(e) {
    var element = { _id: e._id, unsorted: {}, value: {} };
    var values = [];
    Object.keys(e.value).forEach(function (key) {
      values[e.value[key]] = key;
    });
    values.forEach(function (key, value) {
      element.unsorted[key] = value;
    });
    // sort according to values (most occurring first)
    var revertedKeys = Object.keys(element.unsorted).reverse();
    revertedKeys.forEach(function (key) {
      element.value[key] = element.unsorted[key];
    });
    delete element.unsorted;
    result.push(element);
  });
  return result;
};
