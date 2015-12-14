(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

/**
 * Expose `arrayFlatten`.
 */
module.exports = arrayFlatten

/**
 * Recursive flatten function with depth.
 *
 * @param  {Array}  array
 * @param  {Array}  result
 * @param  {Number} depth
 * @return {Array}
 */
function flattenWithDepth (array, result, depth) {
  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (depth > 0 && Array.isArray(value)) {
      flattenWithDepth(value, result, depth - 1)
    } else {
      result.push(value)
    }
  }

  return result
}

/**
 * Recursive flatten function. Omitting depth is slightly faster.
 *
 * @param  {Array} array
 * @param  {Array} result
 * @return {Array}
 */
function flattenForever (array, result) {
  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (Array.isArray(value)) {
      flattenForever(value, result)
    } else {
      result.push(value)
    }
  }

  return result
}

/**
 * Flatten an array, with the ability to define a depth.
 *
 * @param  {Array}  array
 * @param  {Number} depth
 * @return {Array}
 */
function arrayFlatten (array, depth) {
  if (depth == null) {
    return flattenForever(array, [])
  }

  return flattenWithDepth(array, [], depth)
}

},{}],2:[function(require,module,exports){
// Array.prototype.find - MIT License (c) 2013 Paul Miller <http://paulmillr.com>
// For all details and docs: https://github.com/paulmillr/array.prototype.find
// Fixes and tests supplied by Duncan Hall <http://duncanhall.net> 
(function(globals){
  if (Array.prototype.find) return;

  var find = function(predicate) {
    var list = Object(this);
    var length = list.length < 0 ? 0 : list.length >>> 0; // ES.ToUint32;
    if (length === 0) return undefined;
    if (typeof predicate !== 'function' || Object.prototype.toString.call(predicate) !== '[object Function]') {
      throw new TypeError('Array#find: predicate must be a function');
    }
    var thisArg = arguments[1];
    for (var i = 0, value; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) return value;
    }
    return undefined;
  };

  if (Object.defineProperty) {
    try {
      Object.defineProperty(Array.prototype, 'find', {
        value: find, configurable: true, enumerable: false, writable: true
      });
    } catch(e) {}
  }

  if (!Array.prototype.find) {
    Array.prototype.find = find;
  }
})(this);

},{}],3:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":59}],4:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],5:[function(require,module,exports){


module.exports = function(arr,search,comparitor) {
  if(!arr) return -1;
  // as long as it has a length i will try and itterate over it.
  if(arr.length === undefined) return -1;
  
  if(!comparitor) comparitor = module.exports._defaultComparitor();

  return bs(arr,search,comparitor);
}

module.exports.first = function(arr,search,comparitor) {
  return module.exports.closest(arr,search,{exists:true},comparitor);
}

module.exports.last = function(arr,search,comparitor) {
  return module.exports.closest(arr,search,{exists:true,end:true},comparitor);
}

module.exports.closest = function(arr,search,opts,comparitor) {

  if(typeof opts === 'function') {
    comparitor = opts;
    opts = {};
  }

  if(arr.length === 0) return -1;
  if(arr.length === 1) return 0;

  opts = opts||{};
  if(!comparitor) comparitor = this._defaultComparitor();
  
  var closest = bsclosest(arr, search, comparitor, opts.end, opts.exists?false:true);

  if(closest > arr.length-1) closest = arr.length-1;
  else if(closest < 0) closest = 0;

  return closest;
}

// inserts element into the correct sorted spot into the array
module.exports.insert = function(arr,search,opts,comparitor){ 

  if(typeof opts === 'function') {
    comparitor = opts;
    opts = {};
  }

  opts = opts||{};
  if(!comparitor) comparitor = module.exports._defaultComparitor();
  if(!arr.length) {
    arr[0] = search;
    return 0;
  }

  var closest = module.exports.closest(arr,search,comparitor);

  var cmp = comparitor(arr[closest],search);
  if(cmp < 0) {//less
    arr.splice(++closest,0,search);
  } else if(cmp > 0){ 
    arr.splice(closest,0,search);
  } else {
    if(opts.unique){
      arr[closest] = search;
    } else {
      // im equal. this value should be appended to the list of existing same sorted values.
      while(comparitor(arr[closest],search) === 0){
        if(closest >= arr.length-1) break;
        closest++;
      }

      arr.splice(closest,0,search);
    }
  }
  return closest;
}

// this method returns the start and end indicies of a range. [start,end]
module.exports.range = function(arr,from,to,comparitor) {
  if(!comparitor) comparitor = module.exports._defaultComparitor();

  var fromi = module.exports.closest(arr,from,comparitor);

  var toi = module.exports.closest(arr,to,{end:true},comparitor);

  // this is a hack. 
  // i should be able to fix the algorithm and generate a correct range.

  while(fromi <= toi){ 
    if(comparitor(arr[fromi],from) > -1) break;

    fromi++
  }

  while(toi >= fromi){ 
    if(comparitor(arr[toi],to) < 1) break;
    toi--;
  }

  return [fromi,toi];
}

// this method returns the values of a range;
module.exports.rangeValue = function(arr,from,to,comparitor){
  var range = module.exports.range(arr,from,to,comparitor);
  return arr.slice(range[0],range[1]+1);
}

//
module.exports.indexObject = function(o,extractor) {
  var index = [];
  
  Object.keys(o).forEach(function(k){
    index.push({k:k,v:extractor(o[k])});
  });

  return index.sort(function(o1,o2){
    return o1.v - o2.v;
  });
}

module.exports.cmp = function(v1,v2){
  return v1 - v2;
}

module.exports._defaultComparitor = function() {
  var indexMode,indexModeSearch;
  return function(v,search){
    // support the object format of generated indexes
    if(indexMode === undefined){
      if(typeof v === 'object' && v.hasOwnProperty('v')) indexMode = true;
      if(typeof search === 'object' && search.hasOwnProperty('v')) indexModeSearch = true
    }

    if(indexMode) v = v.v;
    if(indexModeSearch) search = search.v;

    return v - search;
  };
};

module.exports._binarySearch = bs;
module.exports._binarySearchClosest = bsclosest;

function bs(arr, search, comparitor) {

  var max = arr.length-1,min = 0,middle,cmp;
  // continue searching while key may exist
  while (max >= min) {
    middle = mid(min, max);

    cmp = comparitor(arr[middle],search,middle);

    if (cmp < 0) {
      min = middle + 1;
    } else if (cmp > 0) {
      max = middle - 1;
    } else {
      return middle;
    }
  }
  // key not found
  return -1;
}

function bsclosest(arr, search, comparitor, invert, closest) {
  var mids = {}
  , min = 0,max = arr.length-1,middle,cmp
  , sanity = arr.length;

  while (min < max) {
    middle = midCareful(min, max,mids); 
    cmp = comparitor(arr[middle],search,middle);
    if(invert){
      if (cmp > 0)max = middle - 1;
      else min = middle;   
    } else {
      if (cmp < 0)min = middle + 1;
      else max = middle;
    }
    if(!--sanity) break;
  }
   
  if (max == min && comparitor(arr[min],search) === 0) return min;
  
  if(closest) {
    var match = comparitor(arr[min],search);
    if(min == arr.length-1 && match < 0) return min;
    if(min == 0 && match > 0) return 0;

    return closest?(invert?min+1:min-1):-1;
  } 
  return -1; 
}

function mid(v1,v2){
  return v1+Math.floor((v2-v1)/2);
}

function midCareful(v1,v2,mids){
  var mid = v1+Math.floor((v2-v1)/2);
  if(mids[mid]) mid = v1+Math.ceil((v2-v1)/2);
  mids[mid] = 1;
  return mid;
}

},{}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":4,"ieee754":29,"isarray":8}],8:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],9:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],10:[function(require,module,exports){
/**
 * Expose `requestAnimationFrame()`.
 */

exports = module.exports = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || fallback;

/**
 * Fallback implementation.
 */

var prev = new Date().getTime();
function fallback(fn) {
  var curr = new Date().getTime();
  var ms = Math.max(0, 16 - (curr - prev));
  var req = setTimeout(fn, ms);
  prev = curr;
  return req;
}

/**
 * Cancel.
 */

var cancel = window.cancelAnimationFrame
  || window.webkitCancelAnimationFrame
  || window.mozCancelAnimationFrame
  || window.clearTimeout;

exports.cancel = function(id){
  cancel.call(window, id);
};

},{}],11:[function(require,module,exports){
(function (Buffer){
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  if (typeof Buffer != 'undefined' && Buffer.isBuffer(val)) return 'buffer';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

}).call(this,require("buffer").Buffer)
},{"buffer":7}],12:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('component-emitter')

/**
 * Expose `scene`.
 */

module.exports = Application

/**
 * Create a new `Application`.
 *
 * @param {Object} element Optional initial element
 */

function Application (element) {
  if (!(this instanceof Application)) return new Application(element)
  this.options = {}
  this.sources = {}
  this.element = element
}

/**
 * Mixin `Emitter`.
 */

Emitter(Application.prototype)

/**
 * Add a plugin
 *
 * @param {Function} plugin
 */

Application.prototype.use = function (plugin) {
  plugin(this)
  return this
}

/**
 * Set an option
 *
 * @param {String} name
 */

Application.prototype.option = function (name, val) {
  this.options[name] = val
  return this
}

/**
 * Set value used somewhere in the IO network.
 */

Application.prototype.set = function (name, data) {
  this.sources[name] = data
  this.emit('source', name, data)
  return this
}

/**
 * Mount a virtual element.
 *
 * @param {VirtualElement} element
 */

Application.prototype.mount = function (element) {
  this.element = element
  this.emit('mount', element)
  return this
}

/**
 * Remove the world. Unmount everything.
 */

Application.prototype.unmount = function () {
  if (!this.element) return
  this.element = null
  this.emit('unmount')
  return this
}

},{"component-emitter":9}],13:[function(require,module,exports){
/**
 * All of the events can bind to
 */

module.exports = {
  onBlur: 'blur',
  onChange: 'change',
  onClick: 'click',
  onContextMenu: 'contextmenu',
  onCopy: 'copy',
  onCut: 'cut',
  onDoubleClick: 'dblclick',
  onDrag: 'drag',
  onDragEnd: 'dragend',
  onDragEnter: 'dragenter',
  onDragExit: 'dragexit',
  onDragLeave: 'dragleave',
  onDragOver: 'dragover',
  onDragStart: 'dragstart',
  onDrop: 'drop',
  onError: 'error',
  onFocus: 'focus',
  onInput: 'input',
  onInvalid: 'invalid',
  onKeyDown: 'keydown',
  onKeyPress: 'keypress',
  onKeyUp: 'keyup',
  onMouseDown: 'mousedown',
  onMouseEnter: 'mouseenter',
  onMouseLeave: 'mouseleave',
  onMouseMove: 'mousemove',
  onMouseOut: 'mouseout',
  onMouseOver: 'mouseover',
  onMouseUp: 'mouseup',
  onPaste: 'paste',
  onReset: 'reset',
  onScroll: 'scroll',
  onSubmit: 'submit',
  onTouchCancel: 'touchcancel',
  onTouchEnd: 'touchend',
  onTouchMove: 'touchmove',
  onTouchStart: 'touchstart',
  onWheel: 'wheel'
}

},{}],14:[function(require,module,exports){
/**
 * Create the application.
 */

exports.tree =
exports.scene =
exports.deku = require('./application')

/**
 * Render scenes to the DOM.
 */

if (typeof document !== 'undefined') {
  exports.render = require('./render')
}

/**
 * Render scenes to a string
 */

exports.renderString = require('./stringify')
},{"./application":12,"./render":16,"./stringify":17}],15:[function(require,module,exports){
var type = require('component-type')

/**
 * Returns the type of a virtual node
 *
 * @param  {Object} node
 * @return {String}
 */

module.exports = function nodeType (node) {
  var v = type(node)
  if (v === 'null' || node === false) return 'empty'
  if (v !== 'object') return 'text'
  if (type(node.type) === 'string') return 'element'
  return 'component'
}

},{"component-type":11}],16:[function(require,module,exports){
/**
 * Dependencies.
 */

var raf = require('component-raf')
var isDom = require('is-dom')
var uid = require('get-uid')
var keypath = require('object-path')
var events = require('./events')
var svg = require('./svg')
var defaults = require('object-defaults')
var forEach = require('fast.js/forEach')
var assign = require('fast.js/object/assign')
var reduce = require('fast.js/reduce')
var nodeType = require('./node-type')

/**
 * Expose `dom`.
 */

module.exports = render

/**
 * Render an app to the DOM
 *
 * @param {Application} app
 * @param {HTMLElement} container
 * @param {Object} opts
 *
 * @return {Object}
 */

function render (app, container, opts) {
  var frameId
  var isRendering
  var rootId = 'root'
  var currentElement
  var currentNativeElement
  var connections = {}
  var components = {}
  var entities = {}
  var handlers = {}
  var mountQueue = []
  var children = {}
  children[rootId] = {}

  if (!isDom(container)) {
    throw new Error('Container element must be a DOM element')
  }

  /**
   * Rendering options. Batching is only ever really disabled
   * when running tests, and pooling can be disabled if the user
   * is doing something stupid with the DOM in their components.
   */

  var options = defaults(assign({}, app.options || {}, opts || {}), {
    batching: true
  })

  /**
   * Listen to DOM events
   */
  var rootElement = getRootElement(container)
  addNativeEventListeners()

  /**
   * Watch for changes to the app so that we can update
   * the DOM as needed.
   */

  app.on('unmount', onunmount)
  app.on('mount', onmount)
  app.on('source', onupdate)

  /**
   * If the app has already mounted an element, we can just
   * render that straight away.
   */

  if (app.element) render()

  /**
   * Teardown the DOM rendering so that it stops
   * rendering and everything can be garbage collected.
   */

  function teardown () {
    removeNativeEventListeners()
    removeNativeElement()
    app.off('unmount', onunmount)
    app.off('mount', onmount)
    app.off('source', onupdate)
  }

  /**
   * Swap the current rendered node with a new one that is rendered
   * from the new virtual element mounted on the app.
   *
   * @param {VirtualElement} element
   */

  function onmount () {
    invalidate()
  }

  /**
   * If the app unmounts an element, we should clear out the current
   * rendered element. This will remove all the entities.
   */

  function onunmount () {
    removeNativeElement()
    currentElement = null
  }

  /**
   * Update all components that are bound to the source
   *
   * @param {String} name
   * @param {*} data
   */

  function onupdate (name, data) {
    if (!connections[name]) return;
    connections[name].forEach(function(update) {
      update(data)
    })
  }

  /**
   * Render and mount a component to the native dom.
   *
   * @param {Entity} entity
   * @return {HTMLElement}
   */

  function mountEntity (entity) {
    register(entity)
    setSources(entity)
    children[entity.id] = {}
    entities[entity.id] = entity

    // commit initial state and props.
    commit(entity)

    // callback before mounting.
    trigger('beforeMount', entity, [entity.context])
    trigger('beforeRender', entity, [entity.context])

    // render virtual element.
    var virtualElement = renderEntity(entity)
    // create native element.
    var nativeElement = toNative(entity.id, '0', virtualElement)

    entity.virtualElement = virtualElement
    entity.nativeElement = nativeElement

    // Fire afterRender and afterMount hooks at the end
    // of the render cycle
    mountQueue.push(entity.id)

    return nativeElement
  }

  /**
   * Remove a component from the native dom.
   *
   * @param {Entity} entity
   */

  function unmountEntity (entityId) {
    var entity = entities[entityId]
    if (!entity) return
    trigger('beforeUnmount', entity, [entity.context, entity.nativeElement])
    unmountChildren(entityId)
    removeAllEvents(entityId)
    var componentEntities = components[entityId].entities;
    delete componentEntities[entityId]
    delete components[entityId]
    delete entities[entityId]
    delete children[entityId]
  }

  /**
   * Render the entity and make sure it returns a node
   *
   * @param {Entity} entity
   *
   * @return {VirtualTree}
   */

  function renderEntity (entity) {
    var component = entity.component
    var fn = typeof component === 'function' ? component : component.render
    if (!fn) throw new Error('Component needs a render function')
    var result = fn(entity.context, setState(entity))
    if (!result) throw new Error('Render function must return an element.')
    return result
  }

  /**
   * Whenever setState or setProps is called, we mark the entity
   * as dirty in the renderer. This lets us optimize the re-rendering
   * and skip components that definitely haven't changed.
   *
   * @param {Entity} entity
   *
   * @return {Function} A curried function for updating the state of an entity
   */

  function setState (entity) {
    return function (nextState) {
      updateEntityState(entity, nextState)
    }
  }

  /**
   * Tell the app it's dirty and needs to re-render. If batching is disabled
   * we can just trigger a render immediately, otherwise we'll wait until
   * the next available frame.
   */

  function invalidate () {
    if (!options.batching) {
      if (!isRendering) render()
    } else {
      if (!frameId) frameId = raf(render)
    }
  }

  /**
   * Update the DOM. If the update fails we stop the loop
   * so we don't get errors on every frame.
   *
   * @api public
   */

  function render () {
    // If this is called synchronously we need to
    // cancel any pending future updates
    clearFrame()

    // If the rendering from the previous frame is still going,
    // we'll just wait until the next frame. Ideally renders should
    // not take over 16ms to stay within a single frame, but this should
    // catch it if it does.
    if (isRendering) {
      frameId = raf(render)
      return
    } else {
      isRendering = true
    }

    // 1. If there isn't a native element rendered for the current mounted element
    // then we need to create it from scratch.
    // 2. If a new element has been mounted, we should diff them.
    // 3. We should update check all child components for changes.
    if (!currentNativeElement) {
      currentElement = app.element
      currentNativeElement = toNative(rootId, '0', currentElement)
      if (container.children.length > 0) {
        console.info('deku: The container element is not empty. These elements will be removed. Read more: http://cl.ly/b0Sr')
      }
      if (container === document.body) {
        console.warn('deku: Using document.body is allowed but it can cause some issues. Read more: http://cl.ly/b0SC')
      }
      removeAllChildren(container)
      container.appendChild(currentNativeElement)
    } else if (currentElement !== app.element) {
      currentNativeElement = patch(rootId, currentElement, app.element, currentNativeElement)
      currentElement = app.element
      updateChildren(rootId)
    } else {
      updateChildren(rootId)
    }

    // Call mount events on all new entities
    flushMountQueue()

    // Allow rendering again.
    isRendering = false

  }

  /**
   * Call hooks for all new entities that have been created in
   * the last render from the bottom up.
   */

  function flushMountQueue () {
    while (mountQueue.length > 0) {
      var entityId = mountQueue.shift()
      var entity = entities[entityId]
      trigger('afterRender', entity, [entity.context, entity.nativeElement])
      trigger('afterMount', entity, [entity.context, entity.nativeElement, setState(entity)])
    }
  }

  /**
   * Clear the current scheduled frame
   */

  function clearFrame () {
    if (!frameId) return
    raf.cancel(frameId)
    frameId = 0
  }

  /**
   * Update a component.
   *
   * The entity is just the data object for a component instance.
   *
   * @param {String} id Component instance id.
   */

  function updateEntity (entityId) {
    var entity = entities[entityId]
    setSources(entity)

    if (!shouldUpdate(entity)) {
      commit(entity)
      return updateChildren(entityId)
    }

    var currentTree = entity.virtualElement
    var nextProps = entity.pendingProps
    var nextState = entity.pendingState
    var previousState = entity.context.state
    var previousProps = entity.context.props

    // hook before rendering. could modify state just before the render occurs.
    trigger('beforeUpdate', entity, [entity.context, nextProps, nextState])
    trigger('beforeRender', entity, [entity.context])

    // commit state and props.
    commit(entity)

    // re-render.
    var nextTree = renderEntity(entity)

    // if the tree is the same we can just skip this component
    // but we should still check the children to see if they're dirty.
    // This allows us to memoize the render function of components.
    if (nextTree === currentTree) return updateChildren(entityId)

    // apply new virtual tree to native dom.
    entity.nativeElement = patch(entityId, currentTree, nextTree, entity.nativeElement)
    entity.virtualElement = nextTree
    updateChildren(entityId)

    // trigger render hook
    trigger('afterRender', entity, [entity.context, entity.nativeElement])

    // trigger afterUpdate after all children have updated.
    trigger('afterUpdate', entity, [entity.context, previousProps, previousState, setState(entity)])
  }

  /**
   * Update all the children of an entity.
   *
   * @param {String} id Component instance id.
   */

  function updateChildren (entityId) {
    forEach(children[entityId], function (childId) {
      updateEntity(childId)
    })
  }

  /**
   * Remove all of the child entities of an entity
   *
   * @param {Entity} entity
   */

  function unmountChildren (entityId) {
    forEach(children[entityId], function (childId) {
      unmountEntity(childId)
    })
  }

  /**
   * Remove the root element. If this is called synchronously we need to
   * cancel any pending future updates.
   */

  function removeNativeElement () {
    clearFrame()
    removeElement(rootId, '0', currentNativeElement)
    currentNativeElement = null
  }

  /**
   * Create a native element from a virtual element.
   *
   * @param {String} entityId
   * @param {String} path
   * @param {Object} vnode
   *
   * @return {HTMLDocumentFragment}
   */

  function toNative (entityId, path, vnode) {
    switch (nodeType(vnode)) {
      case 'text': return toNativeText(vnode)
      case 'empty': return toNativeEmptyElement(entityId, path)
      case 'element': return toNativeElement(entityId, path, vnode)
      case 'component': return toNativeComponent(entityId, path, vnode)
    }
  }

  /**
   * Create a native text element from a virtual element.
   *
   * @param {Object} vnode
   */

  function toNativeText (text) {
    return document.createTextNode(text)
  }

  /**
   * Create a native element from a virtual element.
   */

  function toNativeElement (entityId, path, vnode) {
    var el
    var attributes = vnode.attributes
    var tagName = vnode.type
    var childNodes = vnode.children

    // create element either from pool or fresh.
    if (svg.isElement(tagName)) {
      el = document.createElementNS(svg.namespace, tagName)
    } else {
      el = document.createElement(tagName)
    }

    // set attributes.
    forEach(attributes, function (value, name) {
      setAttribute(entityId, path, el, name, value)
    })

    // add children.
    forEach(childNodes, function (child, i) {
      var childEl = toNative(entityId, path + '.' + i, child)
      if (!childEl.parentNode) el.appendChild(childEl)
    })

    // store keys on the native element for fast event handling.
    el.__entity__ = entityId
    el.__path__ = path

    return el
  }

  /**
   * Create a native element from a virtual element.
   */

  function toNativeEmptyElement (entityId, path) {
    var el = document.createElement('noscript')
    el.__entity__ = entityId
    el.__path__ = path
    return el
  }

  /**
   * Create a native element from a component.
   */

  function toNativeComponent (entityId, path, vnode) {
    var child = new Entity(vnode.type, assign({ children: vnode.children }, vnode.attributes), entityId)
    children[entityId][path] = child.id
    return mountEntity(child)
  }

  /**
   * Patch an element with the diff from two trees.
   */

  function patch (entityId, prev, next, el) {
    return diffNode('0', entityId, prev, next, el)
  }

  /**
   * Create a diff between two trees of nodes.
   */

  function diffNode (path, entityId, prev, next, el) {
    var leftType = nodeType(prev)
    var rightType = nodeType(next)

    // Type changed. This could be from element->text, text->ComponentA,
    // ComponentA->ComponentB etc. But NOT div->span. These are the same type
    // (ElementNode) but different tag name.
    if (leftType !== rightType) return replaceElement(entityId, path, el, next)

    switch (rightType) {
      case 'text': return diffText(prev, next, el)
      case 'empty': return el
      case 'element': return diffElement(path, entityId, prev, next, el)
      case 'component': return diffComponent(path, entityId, prev, next, el)
    }
  }

  /**
   * Diff two text nodes and update the element.
   */

  function diffText (previous, current, el) {
    if (current !== previous) el.data = current
    return el
  }

  /**
   * Diff the children of an ElementNode.
   */

  function diffChildren (path, entityId, prev, next, el) {
    var positions = []
    var hasKeys = false
    var childNodes = Array.prototype.slice.apply(el.childNodes)
    var leftKeys = reduce(prev.children, keyMapReducer, {})
    var rightKeys = reduce(next.children, keyMapReducer, {})
    var currentChildren = assign({}, children[entityId])

    function keyMapReducer (acc, child, i) {
      if (child && child.attributes && child.attributes.key != null) {
        acc[child.attributes.key] = {
          element: child,
          index: i
        }
        hasKeys = true
      }
      return acc
    }

    // Diff all of the nodes that have keys. This lets us re-used elements
    // instead of overriding them and lets us move them around.
    if (hasKeys) {

      // Removals
      forEach(leftKeys, function (leftNode, key) {
        if (rightKeys[key] == null) {
          var leftPath = path + '.' + leftNode.index
          removeElement(
            entityId,
            leftPath,
            childNodes[leftNode.index]
          )
        }
      })

      // Update nodes
      forEach(rightKeys, function (rightNode, key) {
        var leftNode = leftKeys[key]

        // We only want updates for now
        if (leftNode == null) return

        var leftPath = path + '.' + leftNode.index

        // Updated
        positions[rightNode.index] = diffNode(
          leftPath,
          entityId,
          leftNode.element,
          rightNode.element,
          childNodes[leftNode.index]
        )
      })

      // Update the positions of all child components and event handlers
      forEach(rightKeys, function (rightNode, key) {
        var leftNode = leftKeys[key]

        // We just want elements that have moved around
        if (leftNode == null || leftNode.index === rightNode.index) return

        var rightPath = path + '.' + rightNode.index
        var leftPath = path + '.' + leftNode.index

        // Update all the child component path positions to match
        // the latest positions if they've changed. This is a bit hacky.
        forEach(currentChildren, function (childId, childPath) {
          if (leftPath === childPath) {
            delete children[entityId][childPath]
            children[entityId][rightPath] = childId
          }
        })
      })

      // Now add all of the new nodes last in case their path
      // would have conflicted with one of the previous paths.
      forEach(rightKeys, function (rightNode, key) {
        var rightPath = path + '.' + rightNode.index
        if (leftKeys[key] == null) {
          positions[rightNode.index] = toNative(
            entityId,
            rightPath,
            rightNode.element
          )
        }
      })

    } else {
      var maxLength = Math.max(prev.children.length, next.children.length)

      // Now diff all of the nodes that don't have keys
      for (var i = 0; i < maxLength; i++) {
        var leftNode = prev.children[i]
        var rightNode = next.children[i]

        // Removals
        if (rightNode === undefined) {
          removeElement(
            entityId,
            path + '.' + i,
            childNodes[i]
          )
          continue
        }

        // New Node
        if (leftNode === undefined) {
          positions[i] = toNative(
            entityId,
            path + '.' + i,
            rightNode
          )
          continue
        }

        // Updated
        positions[i] = diffNode(
          path + '.' + i,
          entityId,
          leftNode,
          rightNode,
          childNodes[i]
        )
      }
    }

    // Reposition all the elements
    forEach(positions, function (childEl, newPosition) {
      var target = el.childNodes[newPosition]
      if (childEl && childEl !== target) {
        if (target) {
          el.insertBefore(childEl, target)
        } else {
          el.appendChild(childEl)
        }
      }
    })
  }

  /**
   * Diff the attributes and add/remove them.
   */

  function diffAttributes (prev, next, el, entityId, path) {
    var nextAttrs = next.attributes
    var prevAttrs = prev.attributes

    // add new attrs
    forEach(nextAttrs, function (value, name) {
      if (events[name] || !(name in prevAttrs) || prevAttrs[name] !== value) {
        setAttribute(entityId, path, el, name, value)
      }
    })

    // remove old attrs
    forEach(prevAttrs, function (value, name) {
      if (!(name in nextAttrs)) {
        removeAttribute(entityId, path, el, name)
      }
    })
  }

  /**
   * Update a component with the props from the next node. If
   * the component type has changed, we'll just remove the old one
   * and replace it with the new component.
   */

  function diffComponent (path, entityId, prev, next, el) {
    if (next.type !== prev.type) {
      return replaceElement(entityId, path, el, next)
    } else {
      var targetId = children[entityId][path]

      // This is a hack for now
      if (targetId) {
        updateEntityProps(targetId, assign({ children: next.children }, next.attributes))
      }

      return el
    }
  }

  /**
   * Diff two element nodes.
   */

  function diffElement (path, entityId, prev, next, el) {
    if (next.type !== prev.type) return replaceElement(entityId, path, el, next)
    diffAttributes(prev, next, el, entityId, path)
    diffChildren(path, entityId, prev, next, el)
    return el
  }

  /**
   * Removes an element from the DOM and unmounts and components
   * that are within that branch
   *
   * side effects:
   *   - removes element from the DOM
   *   - removes internal references
   *
   * @param {String} entityId
   * @param {String} path
   * @param {HTMLElement} el
   */

  function removeElement (entityId, path, el) {
    var childrenByPath = children[entityId]
    var childId = childrenByPath[path]
    var entityHandlers = handlers[entityId] || {}
    var removals = []

    // If the path points to a component we should use that
    // components element instead, because it might have moved it.
    if (childId) {
      var child = entities[childId]
      el = child.nativeElement
      unmountEntity(childId)
      removals.push(path)
    } else {

      // Just remove the text node
      if (!isElement(el)) return el && el.parentNode.removeChild(el)

      // Then we need to find any components within this
      // branch and unmount them.
      forEach(childrenByPath, function (childId, childPath) {
        if (childPath === path || isWithinPath(path, childPath)) {
          unmountEntity(childId)
          removals.push(childPath)
        }
      })

      // Remove all events at this path or below it
      forEach(entityHandlers, function (fn, handlerPath) {
        if (handlerPath === path || isWithinPath(path, handlerPath)) {
          removeEvent(entityId, handlerPath)
        }
      })
    }

    // Remove the paths from the object without touching the
    // old object. This keeps the object using fast properties.
    forEach(removals, function (path) {
      delete children[entityId][path]
    })

    // Remove it from the DOM
    el.parentNode.removeChild(el)
  }

  /**
   * Replace an element in the DOM. Removing all components
   * within that element and re-rendering the new virtual node.
   *
   * @param {Entity} entity
   * @param {String} path
   * @param {HTMLElement} el
   * @param {Object} vnode
   *
   * @return {void}
   */

  function replaceElement (entityId, path, el, vnode) {
    var parent = el.parentNode
    var index = Array.prototype.indexOf.call(parent.childNodes, el)

    // remove the previous element and all nested components. This
    // needs to happen before we create the new element so we don't
    // get clashes on the component paths.
    removeElement(entityId, path, el)

    // then add the new element in there
    var newEl = toNative(entityId, path, vnode)
    var target = parent.childNodes[index]

    if (target) {
      parent.insertBefore(newEl, target)
    } else {
      parent.appendChild(newEl)
    }

    // walk up the tree and update all `entity.nativeElement` references.
    if (entityId !== 'root' && path === '0') {
      updateNativeElement(entityId, newEl)
    }

    return newEl
  }

  /**
   * Update all entities in a branch that have the same nativeElement. This
   * happens when a component has another component as it's root node.
   *
   * @param {String} entityId
   * @param {HTMLElement} newEl
   *
   * @return {void}
   */

  function updateNativeElement (entityId, newEl) {
    var target = entities[entityId]
    if (target.ownerId === 'root') return
    if (children[target.ownerId]['0'] === entityId) {
      entities[target.ownerId].nativeElement = newEl
      updateNativeElement(target.ownerId, newEl)
    }
  }

  /**
   * Set the attribute of an element, performing additional transformations
   * dependning on the attribute name
   *
   * @param {HTMLElement} el
   * @param {String} name
   * @param {String} value
   */

  function setAttribute (entityId, path, el, name, value) {
    if (!value) {
      removeAttribute(entityId, path, el, name)
      return
    }
    if (events[name]) {
      addEvent(entityId, path, events[name], value)
      return
    }
    switch (name) {
      case 'checked':
      case 'disabled':
      case 'selected':
        el[name] = true
        break
      case 'innerHTML':
        el.innerHTML = value
        break
      case 'value':
        setElementValue(el, value)
        break
      case svg.isAttribute(name):
        el.setAttributeNS(svg.namespace, name, value)
        break
      default:
        el.setAttribute(name, value)
        break
    }
  }

  /**
   * Remove an attribute, performing additional transformations
   * dependning on the attribute name
   *
   * @param {HTMLElement} el
   * @param {String} name
   */

  function removeAttribute (entityId, path, el, name) {
    if (events[name]) {
      removeEvent(entityId, path, events[name])
      return
    }
    switch (name) {
      case 'checked':
      case 'disabled':
      case 'selected':
        el[name] = false
        break
      case 'innerHTML':
        el.innerHTML = ''
      case 'value':
        setElementValue(el, null)
        break
      default:
        el.removeAttribute(name)
        break
    }
  }

  /**
   * Checks to see if one tree path is within
   * another tree path. Example:
   *
   * 0.1 vs 0.1.1 = true
   * 0.2 vs 0.3.5 = false
   *
   * @param {String} target
   * @param {String} path
   *
   * @return {Boolean}
   */

  function isWithinPath (target, path) {
    return path.indexOf(target + '.') === 0
  }

  /**
   * Is the DOM node an element node
   *
   * @param {HTMLElement} el
   *
   * @return {Boolean}
   */

  function isElement (el) {
    return !!(el && el.tagName)
  }

  /**
   * Remove all the child nodes from an element
   *
   * @param {HTMLElement} el
   */

  function removeAllChildren (el) {
    while (el.firstChild) el.removeChild(el.firstChild)
  }

  /**
   * Trigger a hook on a component.
   *
   * @param {String} name Name of hook.
   * @param {Entity} entity The component instance.
   * @param {Array} args To pass along to hook.
   */

  function trigger (name, entity, args) {
    if (typeof entity.component[name] !== 'function') return
    return entity.component[name].apply(null, args)
  }

  /**
   * Update an entity to match the latest rendered vode. We always
   * replace the props on the component when composing them. This
   * will trigger a re-render on all children below this point.
   *
   * @param {Entity} entity
   * @param {String} path
   * @param {Object} vnode
   *
   * @return {void}
   */

  function updateEntityProps (entityId, nextProps) {
    var entity = entities[entityId]
    entity.pendingProps = defaults({}, nextProps, entity.component.defaultProps || {})
    entity.dirty = true
    invalidate()
  }

  /**
   * Update component instance state.
   */

  function updateEntityState (entity, nextState) {
    entity.pendingState = assign(entity.pendingState, nextState)
    entity.dirty = true
    invalidate()
  }

  /**
   * Commit props and state changes to an entity.
   */

  function commit (entity) {
    entity.context = {
      state: entity.pendingState,
      props: entity.pendingProps,
      id: entity.id
    }
    entity.pendingState = assign({}, entity.context.state)
    entity.pendingProps = assign({}, entity.context.props)
    entity.dirty = false
    if (typeof entity.component.validate === 'function') {
      entity.component.validate(entity.context)
    }
  }

  /**
   * Try to avoid creating new virtual dom if possible.
   *
   * Later we may expose this so you can override, but not there yet.
   */

  function shouldUpdate (entity) {
    if (!entity.dirty) return false
    if (!entity.component.shouldUpdate) return true
    var nextProps = entity.pendingProps
    var nextState = entity.pendingState
    var bool = entity.component.shouldUpdate(entity.context, nextProps, nextState)
    return bool
  }

  /**
   * Register an entity.
   *
   * This is mostly to pre-preprocess component properties and values chains.
   *
   * The end result is for every component that gets mounted,
   * you create a set of IO nodes in the network from the `value` definitions.
   *
   * @param {Component} component
   */

  function register (entity) {
    registerEntity(entity)
    var component = entity.component
    if (component.registered) return

    // initialize sources once for a component type.
    registerSources(entity)
    component.registered = true
  }

  /**
   * Add entity to data-structures related to components/entities.
   *
   * @param {Entity} entity
   */

  function registerEntity(entity) {
    var component = entity.component
    // all entities for this component type.
    var entities = component.entities = component.entities || {}
    // add entity to component list
    entities[entity.id] = entity
    // map to component so you can remove later.
    components[entity.id] = component
  }

  /**
   * Initialize sources for a component by type.
   *
   * @param {Entity} entity
   */

  function registerSources(entity) {
    var component = components[entity.id]
    // get 'class-level' sources.
    // if we've already hooked it up, then we're good.
    var sources = component.sources
    if (sources) return
    var entities = component.entities

    // hook up sources.
    var map = component.sourceToPropertyName = {}
    component.sources = sources = []
    var propTypes = component.propTypes
    for (var name in propTypes) {
      var data = propTypes[name]
      if (!data) continue
      if (!data.source) continue
      sources.push(data.source)
      map[data.source] = name
    }

    // send value updates to all component instances.
    sources.forEach(function (source) {
      connections[source] = connections[source] || []
      connections[source].push(update)

      function update (data) {
        var prop = map[source]
        for (var entityId in entities) {
          var entity = entities[entityId]
          var changes = {}
          changes[prop] = data
          updateEntityProps(entityId, assign(entity.pendingProps, changes))
        }
      }
    })
  }

  /**
   * Set the initial source value on the entity
   *
   * @param {Entity} entity
   */

  function setSources (entity) {
    var component = entity.component
    var map = component.sourceToPropertyName
    var sources = component.sources
    sources.forEach(function (source) {
      var name = map[source]
      if (entity.pendingProps[name] != null) return
      entity.pendingProps[name] = app.sources[source] // get latest value plugged into global store
    })
  }

  /**
   * Add all of the DOM event listeners
   */

  function addNativeEventListeners () {
    forEach(events, function (eventType) {
      rootElement.addEventListener(eventType, handleEvent, true)
    })
  }

  /**
   * Add all of the DOM event listeners
   */

  function removeNativeEventListeners () {
    forEach(events, function (eventType) {
      rootElement.removeEventListener(eventType, handleEvent, true)
    })
  }

  /**
   * Handle an event that has occured within the container
   *
   * @param {Event} event
   */

  function handleEvent (event) {
    var target = event.target
    var eventType = event.type

    // Walk up the DOM tree and see if there is a handler
    // for this event type higher up.
    while (target) {
      var fn = keypath.get(handlers, [target.__entity__, target.__path__, eventType])
      if (fn) {
        event.delegateTarget = target
        if (fn(event) === false) break
      }
      target = target.parentNode
    }
  }

  /**
   * Bind events for an element, and all it's rendered child elements.
   *
   * @param {String} path
   * @param {String} event
   * @param {Function} fn
   */

  function addEvent (entityId, path, eventType, fn) {
    keypath.set(handlers, [entityId, path, eventType], function (e) {
      var entity = entities[entityId]
      if (entity) {
        return fn.call(null, e, entity.context, setState(entity))
      } else {
        return fn.call(null, e)
      }
    })
  }

  /**
   * Unbind events for a entityId
   *
   * @param {String} entityId
   */

  function removeEvent (entityId, path, eventType) {
    var args = [entityId]
    if (path) args.push(path)
    if (eventType) args.push(eventType)
    keypath.del(handlers, args)
  }

  /**
   * Unbind all events from an entity
   *
   * @param {Entity} entity
   */

  function removeAllEvents (entityId) {
    keypath.del(handlers, [entityId])
  }

  /**
   * Used for debugging to inspect the current state without
   * us needing to explicitly manage storing/updating references.
   *
   * @return {Object}
   */

  function inspect () {
    return {
      entities: entities,
      handlers: handlers,
      connections: connections,
      currentElement: currentElement,
      options: options,
      app: app,
      container: container,
      children: children
    }
  }

  /**
   * Return an object that lets us completely remove the automatic
   * DOM rendering and export debugging tools.
   */

  return {
    remove: teardown,
    inspect: inspect
  }
}

/**
 * A rendered component instance.
 *
 * This manages the lifecycle, props and state of the component.
 * It's basically just a data object for more straightfoward lookup.
 *
 * @param {Component} component
 * @param {Object} props
 */

function Entity (component, props, ownerId) {
  this.id = uid()
  this.ownerId = ownerId
  this.component = component
  this.propTypes = component.propTypes || {}
  this.context = {}
  this.context.id = this.id
  this.context.props = defaults(props || {}, component.defaultProps || {})
  this.context.state = this.component.initialState ? this.component.initialState(this.context.props) : {}
  this.pendingProps = assign({}, this.context.props)
  this.pendingState = assign({}, this.context.state)
  this.dirty = false
  this.virtualElement = null
  this.nativeElement = null
  this.displayName = component.name || 'Component'
}

/**
 * Retrieve the nearest 'body' ancestor of the given element or else the root
 * element of the document in which stands the given element.
 *
 * This is necessary if you want to attach the events handler to the correct
 * element and be able to dispatch events in document fragments such as
 * Shadow DOM.
 *
 * @param  {HTMLElement} el The element on which we will render an app.
 * @return {HTMLElement}    The root element on which we will attach the events
 *                          handler.
 */

function getRootElement (el) {
  while (el.parentElement) {
    if (el.tagName === 'BODY' || !el.parentElement) {
      return el
    }
    el = el.parentElement
  }
  return el
}

/**
 * Set the value property of an element and keep the text selection
 * for input fields.
 *
 * @param {HTMLElement} el
 * @param {String} value
 */

function setElementValue (el, value) {
  if (el === document.activeElement && canSelectText(el)) {
    var start = el.selectionStart
    var end = el.selectionEnd
    el.value = value
    el.setSelectionRange(start, end)
  } else {
    el.value = value
  }
}

/**
 * For some reason only certain types of inputs can set the selection range.
 *
 * @param {HTMLElement} el
 *
 * @return {Boolean}
 */

function canSelectText (el) {
  return el.tagName === 'INPUT' && ['text','search','password','tel','url'].indexOf(el.type) > -1
}

},{"./events":13,"./node-type":15,"./svg":18,"component-raf":10,"fast.js/forEach":21,"fast.js/object/assign":24,"fast.js/reduce":27,"get-uid":28,"is-dom":31,"object-defaults":51,"object-path":52}],17:[function(require,module,exports){
var defaults = require('object-defaults')
var nodeType = require('./node-type')
var type = require('component-type')

/**
 * Expose `stringify`.
 */

module.exports = function (app) {
  if (!app.element) {
    throw new Error('No element mounted')
  }

  /**
   * Render to string.
   *
   * @param {Component} component
   * @param {Object} [props]
   * @return {String}
   */

  function stringify (component, optProps, children) {
    var propTypes = component.propTypes || {}
    var props = defaults(optProps || {}, component.defaultProps || {})
    var state = component.initialState ? component.initialState(props) : {}
    props.children = children;

    for (var name in propTypes) {
      var options = propTypes[name]
      if (options.source) {
        props[name] = app.sources[options.source]
      }
    }

    if (component.beforeMount) component.beforeMount({ props: props, state: state })
    if (component.beforeRender) component.beforeRender({ props: props, state: state })
    var node = component.render({ props: props, state: state })
    return stringifyNode(node, '0')
  }

  /**
   * Render a node to a string
   *
   * @param {Node} node
   * @param {Tree} tree
   *
   * @return {String}
   */

  function stringifyNode (node, path) {
    switch (nodeType(node)) {
      case 'empty': return '<noscript />'
      case 'text': return node
      case 'element':
        var children = node.children
        var attributes = node.attributes
        var tagName = node.type
        var innerHTML = attributes.innerHTML
        var str = '<' + tagName + attrs(attributes) + '>'

        if (innerHTML) {
          str += innerHTML
        } else {
          for (var i = 0, n = children.length; i < n; i++) {
            str += stringifyNode(children[i], path + '.' + i)
          }
        }

        str += '</' + tagName + '>'
        return str
      case 'component': return stringify(node.type, node.attributes, node.children)
    }

    throw new Error('Invalid type')
  }

  return stringifyNode(app.element, '0')
}

/**
 * HTML attributes to string.
 *
 * @param {Object} attributes
 * @return {String}
 * @api private
 */

function attrs (attributes) {
  var str = ''
  for (var key in attributes) {
    var value = attributes[key]
    if (key === 'innerHTML') continue
    if (isValidAttributeValue(value)) str += attr(key, attributes[key])
  }
  return str
}

/**
 * HTML attribute to string.
 *
 * @param {String} key
 * @param {String} val
 * @return {String}
 * @api private
 */

function attr (key, val) {
  return ' ' + key + '="' + val + '"'
}

/**
 * Is a value able to be set a an attribute value?
 *
 * @param {Any} value
 *
 * @return {Boolean}
 */

function isValidAttributeValue (value) {
  var valueType = type(value)
  switch (valueType) {
  case 'string':
  case 'number':
    return true;

  case 'boolean':
    return value;

  default:
    return false;
  }
}

},{"./node-type":15,"component-type":11,"object-defaults":51}],18:[function(require,module,exports){
module.exports = {
  isElement: require('is-svg-element').isElement,
  isAttribute: require('is-svg-attribute'),
  namespace: 'http://www.w3.org/2000/svg'
}

},{"is-svg-attribute":32,"is-svg-element":33}],19:[function(require,module,exports){
'use strict';

var bindInternal3 = require('../function/bindInternal3');

/**
 * # For Each
 *
 * A fast `.forEach()` implementation.
 *
 * @param  {Array}    subject     The array (or array-like) to iterate over.
 * @param  {Function} fn          The visitor function.
 * @param  {Object}   thisContext The context for the visitor.
 */
module.exports = function fastForEach (subject, fn, thisContext) {
  var length = subject.length,
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      i;
  for (i = 0; i < length; i++) {
    iterator(subject[i], i, subject);
  }
};

},{"../function/bindInternal3":22}],20:[function(require,module,exports){
'use strict';

var bindInternal4 = require('../function/bindInternal4');

/**
 * # Reduce
 *
 * A fast `.reduce()` implementation.
 *
 * @param  {Array}    subject      The array (or array-like) to reduce.
 * @param  {Function} fn           The reducer function.
 * @param  {mixed}    initialValue The initial value for the reducer, defaults to subject[0].
 * @param  {Object}   thisContext  The context for the reducer.
 * @return {mixed}                 The final result.
 */
module.exports = function fastReduce (subject, fn, initialValue, thisContext) {
  var length = subject.length,
      iterator = thisContext !== undefined ? bindInternal4(fn, thisContext) : fn,
      i, result;

  if (initialValue === undefined) {
    i = 1;
    result = subject[0];
  }
  else {
    i = 0;
    result = initialValue;
  }

  for (; i < length; i++) {
    result = iterator(result, subject[i], i, subject);
  }

  return result;
};

},{"../function/bindInternal4":23}],21:[function(require,module,exports){
'use strict';

var forEachArray = require('./array/forEach'),
    forEachObject = require('./object/forEach');

/**
 * # ForEach
 *
 * A fast `.forEach()` implementation.
 *
 * @param  {Array|Object} subject     The array or object to iterate over.
 * @param  {Function}     fn          The visitor function.
 * @param  {Object}       thisContext The context for the visitor.
 */
module.exports = function fastForEach (subject, fn, thisContext) {
  if (subject instanceof Array) {
    return forEachArray(subject, fn, thisContext);
  }
  else {
    return forEachObject(subject, fn, thisContext);
  }
};
},{"./array/forEach":19,"./object/forEach":25}],22:[function(require,module,exports){
'use strict';

/**
 * Internal helper to bind a function known to have 3 arguments
 * to a given context.
 */
module.exports = function bindInternal3 (func, thisContext) {
  return function (a, b, c) {
    return func.call(thisContext, a, b, c);
  };
};

},{}],23:[function(require,module,exports){
'use strict';

/**
 * Internal helper to bind a function known to have 4 arguments
 * to a given context.
 */
module.exports = function bindInternal4 (func, thisContext) {
  return function (a, b, c, d) {
    return func.call(thisContext, a, b, c, d);
  };
};

},{}],24:[function(require,module,exports){
'use strict';

/**
 * Analogue of Object.assign().
 * Copies properties from one or more source objects to
 * a target object. Existing keys on the target object will be overwritten.
 *
 * > Note: This differs from spec in some important ways:
 * > 1. Will throw if passed non-objects, including `undefined` or `null` values.
 * > 2. Does not support the curious Exception handling behavior, exceptions are thrown immediately.
 * > For more details, see:
 * > https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 *
 *
 *
 * @param  {Object} target      The target object to copy properties to.
 * @param  {Object} source, ... The source(s) to copy properties from.
 * @return {Object}             The updated target object.
 */
module.exports = function fastAssign (target) {
  var totalArgs = arguments.length,
      source, i, totalKeys, keys, key, j;

  for (i = 1; i < totalArgs; i++) {
    source = arguments[i];
    keys = Object.keys(source);
    totalKeys = keys.length;
    for (j = 0; j < totalKeys; j++) {
      key = keys[j];
      target[key] = source[key];
    }
  }
  return target;
};

},{}],25:[function(require,module,exports){
'use strict';

var bindInternal3 = require('../function/bindInternal3');

/**
 * # For Each
 *
 * A fast object `.forEach()` implementation.
 *
 * @param  {Object}   subject     The object to iterate over.
 * @param  {Function} fn          The visitor function.
 * @param  {Object}   thisContext The context for the visitor.
 */
module.exports = function fastForEachObject (subject, fn, thisContext) {
  var keys = Object.keys(subject),
      length = keys.length,
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      key, i;
  for (i = 0; i < length; i++) {
    key = keys[i];
    iterator(subject[key], key, subject);
  }
};

},{"../function/bindInternal3":22}],26:[function(require,module,exports){
'use strict';

var bindInternal4 = require('../function/bindInternal4');

/**
 * # Reduce
 *
 * A fast object `.reduce()` implementation.
 *
 * @param  {Object}   subject      The object to reduce over.
 * @param  {Function} fn           The reducer function.
 * @param  {mixed}    initialValue The initial value for the reducer, defaults to subject[0].
 * @param  {Object}   thisContext  The context for the reducer.
 * @return {mixed}                 The final result.
 */
module.exports = function fastReduceObject (subject, fn, initialValue, thisContext) {
  var keys = Object.keys(subject),
      length = keys.length,
      iterator = thisContext !== undefined ? bindInternal4(fn, thisContext) : fn,
      i, key, result;

  if (initialValue === undefined) {
    i = 1;
    result = subject[keys[0]];
  }
  else {
    i = 0;
    result = initialValue;
  }

  for (; i < length; i++) {
    key = keys[i];
    result = iterator(result, subject[key], key, subject);
  }

  return result;
};

},{"../function/bindInternal4":23}],27:[function(require,module,exports){
'use strict';

var reduceArray = require('./array/reduce'),
    reduceObject = require('./object/reduce');

/**
 * # Reduce
 *
 * A fast `.reduce()` implementation.
 *
 * @param  {Array|Object} subject      The array or object to reduce over.
 * @param  {Function}     fn           The reducer function.
 * @param  {mixed}        initialValue The initial value for the reducer, defaults to subject[0].
 * @param  {Object}       thisContext  The context for the reducer.
 * @return {Array|Object}              The array or object containing the results.
 */
module.exports = function fastReduce (subject, fn, initialValue, thisContext) {
  if (subject instanceof Array) {
    return reduceArray(subject, fn, initialValue, thisContext);
  }
  else {
    return reduceObject(subject, fn, initialValue, thisContext);
  }
};
},{"./array/reduce":20,"./object/reduce":26}],28:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],29:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],30:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],31:[function(require,module,exports){
/*global window*/

/**
 * Check if object is dom node.
 *
 * @param {Object} val
 * @return {Boolean}
 * @api public
 */

module.exports = function isNode(val){
  if (!val || typeof val !== 'object') return false;
  if (window && 'object' == typeof window.Node) return val instanceof window.Node;
  return 'number' == typeof val.nodeType && 'string' == typeof val.nodeName;
}

},{}],32:[function(require,module,exports){
/**
 * Supported SVG attributes
 */

exports.attributes = {
  'cx': true,
  'cy': true,
  'd': true,
  'dx': true,
  'dy': true,
  'fill': true,
  'fillOpacity': true,
  'fontFamily': true,
  'fontSize': true,
  'fx': true,
  'fy': true,
  'gradientTransform': true,
  'gradientUnits': true,
  'markerEnd': true,
  'markerMid': true,
  'markerStart': true,
  'offset': true,
  'opacity': true,
  'patternContentUnits': true,
  'patternUnits': true,
  'points': true,
  'preserveAspectRatio': true,
  'r': true,
  'rx': true,
  'ry': true,
  'spreadMethod': true,
  'stopColor': true,
  'stopOpacity': true,
  'stroke': true,
  'strokeDasharray': true,
  'strokeLinecap': true,
  'strokeOpacity': true,
  'strokeWidth': true,
  'textAnchor': true,
  'transform': true,
  'version': true,
  'viewBox': true,
  'x1': true,
  'x2': true,
  'x': true,
  'y1': true,
  'y2': true,
  'y': true
}

/**
 * Are element's attributes SVG?
 *
 * @param {String} attr
 */

module.exports = function (attr) {
  return attr in exports.attributes
}

},{}],33:[function(require,module,exports){
/**
 * Supported SVG elements
 *
 * @type {Array}
 */

exports.elements = {
  'animate': true,
  'circle': true,
  'defs': true,
  'ellipse': true,
  'g': true,
  'line': true,
  'linearGradient': true,
  'mask': true,
  'path': true,
  'pattern': true,
  'polygon': true,
  'polyline': true,
  'radialGradient': true,
  'rect': true,
  'stop': true,
  'svg': true,
  'text': true,
  'tspan': true
}

/**
 * Is element's namespace SVG?
 *
 * @param {String} name
 */

exports.isElement = function (name) {
  return name in exports.elements
}

},{}],34:[function(require,module,exports){
},{}],35:[function(require,module,exports){
module.exports=[{"title":"2011-01-16のJS: JSer.info初投稿の記事","url":"http://jser.info/post/2774561807","date":"2011-01-16T17:08:26+09:00","content":"JSer.infoとして初投稿になりますが今後ともよろしくお願いします。このサイトについての詳...","category":"JSer","tags":["JavaScript","URL","design","Java","Game","books"]},{"title":"CommonJSに基づいたモジュール管理ローダーSeaJS","url":"http://jser.info/post/2807412128","date":"2011-01-18T14:36:00+09:00","content":"打造最出色的模块加载框架：SeaJS Module Loader v0.3.0 预览版 - 岁...","category":"","tags":["JavaScript","CommonJS","module","YUI"]},{"title":"2011-01-18のJS:CommonJS, Firefox4, モダンJSのベストプラクティス","url":"http://jser.info/post/2810111581","date":"2011-01-18T20:53:04+09:00","content":"少しペースが早いですが、2回目の紹介記事です。最近はCommonJS,modulesというワー...","category":"JSer","tags":["JavaScript","node.js","CommonJS","jQuery"]},{"title":"2010年に人気のあったオライリー本TOP25が60%オフセール中","url":"http://jser.info/post/2824211314","date":"2011-01-19T17:10:00+09:00","content":"O&amp;#8217;Reilly Media - Best of Ebook Deal/Day -...","category":"","tags":["HTML5","books","javascript","jquery","css"]},{"title":"jQueryのソースコードから学ぶ11の事(movie)","url":"http://jser.info/post/2840863615","date":"2011-01-20T20:36:00+09:00","content":"11 More Things I Learned from the jQuery Source...","category":"","tags":["jquery","javascript","movie","presentation"]},{"title":"2011-01-20のJS : IDEの変化、miのWindows版、Node.js製CMSの登場","url":"http://jser.info/post/2841621230","date":"2011-01-20T22:20:00+09:00","content":"今回は直接JavaScriptについてではなく、ブラウザやエディタと言った少し回りの事に関して...","category":"JSer","tags":["javascript","module","Css","IDE","Editor","books"]},{"title":"WebkitベースのJavaScriptコマンドラインツール「PhantomJS」","url":"http://jser.info/post/2888913234","date":"2011-01-23T17:37:00+09:00","content":"don&amp;#8217;t code today what you can&amp;#8217;t deb...","category":"","tags":["javascript","test","webkit"]},{"title":"2011-01-25のJS : 最近のHTML5/JSプロジェクト、テストツール、未来のJavaScript","url":"http://jser.info/post/2924951560","date":"2011-01-26T00:05:00+09:00","content":"JavaScriptのテスト関する話題が多め。特にPhantomJSは面白いツールだと思います...","category":"JSer","tags":["javascript","html5","test","books","jquery","ide"]},{"title":"2011-01-31のJS : 疑似要素、勉強会スライド、strict mode","url":"http://jser.info/post/3030392484","date":"2011-01-31T22:34:00+09:00","content":"今回は勉強会などのスライド資料が多めです。またFirefoxやChromeにstrict mo...","category":"JSer","tags":["javascript","Canvas","slide","ECMA","Firefox","jquery","UI"]},{"title":"2011-02-07のJS: jQuery 1.5リリース、ChromeでWebGLがデフォルト有効へ","url":"http://jser.info/post/3161961410","date":"2011-02-07T19:16:00+09:00","content":"jQuery 1.5が正式リリースされ、新機能の中のDeferred Objectを扱った内容...","category":"JSer","tags":["jquery","javascript","security","chrome","WebGL","test","Css"]},{"title":"2011-02-13のJS: JavaScript Garden、Sass、Node.js 0.4リリース","url":"http://jser.info/post/3270425526","date":"2011-02-13T20:36:00+09:00","content":"今週はCSSフレームワークすごい的な話からSass(SCSS)についての話題が多くなった気がし...","category":"JSer","tags":["javascript","css","CommonJS","IE","node.js","security"]},{"title":"jQueryの.bind(), .live(), .delegate()の違い","url":"http://jser.info/post/3307464125","date":"2011-02-15T19:19:00+09:00","content":"The Difference Between jQuery’s .bind(), .live(...","category":"","tags":["jquery"]},{"title":"WebフォントをWindowsでも綺麗に表示するためには","url":"http://jser.info/post/3307807580","date":"2011-02-15T20:08:00+09:00","content":"Webfont 사용하기 | FRENDS.KRhttp://frends.kr/topics...","category":"","tags":["css","fonts","canvas"]},{"title":"2011-02-15のJS: IE9の変更点、デバッグツール、パフォーマンス測定","url":"http://jser.info/post/3308007227","date":"2011-02-15T20:36:00+09:00","content":"パフォーマンス測定関係についてのおもしろい話がまとまって出てきた感じがしたのでちょっとペースが...","category":"JSer","tags":["javascript","HTML5","jquery","IE","debug"]},{"title":"Mac向けGUIなgitクライアント「Tower」の10%offクーポンが発行中","url":"http://jser.info/post/3342190337","date":"2011-02-17T17:46:00+09:00","content":"10% off Tower for Mac - GitHubhttps://github.co...","category":"","tags":["git","Mac"]},{"title":"2011-02-21のJS: Firebug Tips、JSHint、Node.jsのお話","url":"http://jser.info/post/3421635039","date":"2011-02-21T18:49:00+09:00","content":"今週はNode.js関係でちょっとNode.js自体がどうなんだという感じの話が出たりしました...","category":"JSer","tags":["Node.js","books","firebug","coding"]},{"title":"Tumblrをブログとして利用する-実践編-","url":"http://jser.info/post/3461724032","date":"2011-02-23T18:45:00+09:00","content":"以前書いたTumblrをブログとして使うためにやるべき事 | Web scratchの焼き直し...","category":"","tags":["javascript","tumblr","css"]},{"title":"2011-02-28のJS: APIドキュメント生成、JSHint、Git","url":"http://jser.info/post/3563828253","date":"2011-02-28T23:14:00+09:00","content":"今週はJSHintのフォークした理由についての記事がコメントも併せて興味深かった気がします。後...","category":"JSer","tags":["node.js","javascript","documents","git","event"]},{"title":"2011-03-08のJS: ローダー系ライブラリのまとめ、JavaScriptの歴史、WebGL1.0","url":"http://jser.info/post/3720129918","date":"2011-03-08T19:00:00+09:00","content":"JavaScriptの歴史はネタになりやすいので、いろいろなところで話されていますが、JS h...","category":"JSer","tags":["history","Sass","jquery","IE","webgl"]},{"title":"2011-03-19のJS: IE9正式版リリース、大規模JavaScriptへの対処、ブラウザのデフォルトCSS","url":"http://jser.info/post/3957135221","date":"2011-03-19T17:55:00+09:00","content":"今週はいろいろとあった気がしますがIE9の正式リリースとFirefox4のリリース日(22日)...","category":"JSer","tags":["IE","git","chrome","Node.js"]},{"title":"O&#39;Reilly(Japanも)が全ての電子書籍を半額で&amp;売上を日本赤十字社に寄付","url":"http://jser.info/post/4025509933","date":"2011-03-23T01:33:00+09:00","content":"O&amp;#8217;Reilly Media - Free to Choose Deal: Sup...","category":"","tags":["books"]},{"title":"2011-03-24のJS: Firefox4,Firebug1.7.0リリース、デバッグツール、SassとLESSの比較","url":"http://jser.info/post/4080429411","date":"2011-03-25T16:00:00+09:00","content":"Firefox4の正式リリースがあったのでそれ関連の記事が多めです。またデバッグ関係のツールの...","category":"JSer","tags":["debug","Android","Css","chrome","firefox","sass"]},{"title":"演算子にもstrict modeを &quot;use restrict&quot;; ","url":"http://jser.info/post/4160215988","date":"2011-03-29T00:18:00+09:00","content":"Restrict Modehttp://restrictmode.org/JavaScript...","category":"","tags":["javascript","tools"]},{"title":"2011-04-08のJS: Backbone.jsとMVC、Ender.js、ECMAScript 5","url":"http://jser.info/post/4437775271","date":"2011-04-08T18:21:00+09:00","content":"Backbone.jsとは何かというのを詳細に解説したエントリが興味深かった。 ダグラス様のE...","category":"JSer","tags":["node.js","ES5","firebug","IE9"]},{"title":"2011-04-23のJS: jQuery1.6、IE10、モダンJavaScriptとは","url":"http://jser.info/post/4852073996","date":"2011-04-23T10:19:00+09:00","content":"今週は結構盛りだくさん(更新遅れたのもあるけど)ノンプログラマーのためのjQuery入門はスラ...","category":"JSer","tags":["jquery","coffeescript","perl","webkit","webgl","test","event"]},{"title":"2011-05-04のJS: jQuery1.6リリース、モジュール管理、Aptana3","url":"http://jser.info/post/5186960940","date":"2011-05-04T19:50:58+09:00","content":"今週はJSConf 2011やNodeConf 2011などEventsがいろいろあるためか、...","category":"JSer","tags":["jquery","debug","html5","Css","sass","ie9"]},{"title":"2011-05-10のJS: Browser.next、スケーラブルなJS、○○だけど質問ある?","url":"http://jser.info/post/5357697532","date":"2011-05-10T19:22:00+09:00","content":"現在、大体どのブラウザにもStable,Beta,Alpha,Nightlyとそれぞれビルドが...","category":"JSer","tags":["javascript","opera","node.js","jquery","test","browser"]},{"title":"2011-05-17のJS: jQuery 1.6.1リリース、new 演算子への理解、altJS","url":"http://jser.info/post/5567252835","date":"2011-05-17T12:58:00+09:00","content":"JSer.info #18 - jQuery 1.6で大きく変わったattr()と.prop(...","category":"JSer","tags":["jquery","memory","json","chrome","Firefox"]},{"title":"2011-05-25のJS: Firefox5ベータ版リリース、jQuery1.6移行時の注意点、Jasmine×Sinon","url":"http://jser.info/post/5826793874","date":"2011-05-25T15:35:00+09:00","content":"JSer.info #19 - Firefoxのリリースサイクルが変更されたため、次のバージョ...","category":"JSer","tags":["jquery","IE","firefox","test","books"]},{"title":"2011-06-02のJS: Firefox5～の変更点、JS卒論、Processing.js v1.2リリース","url":"http://jser.info/post/6105230415","date":"2011-06-02T21:04:00+09:00","content":"JSer.info #20 - ちょっと今週はFirefox関係が多めで、Firefox5と6...","category":"JSer","tags":["Firefox","javascript","test","chrome","IE","library"]},{"title":"O&#39;Reilly MediaがJavaScript関係の電子書籍とビデオを半額で販売中","url":"http://jser.info/post/6290733471","date":"2011-06-08T03:43:00+09:00","content":"O&amp;#8217;Reilly Media - Save 50% on Select JavaS...","category":"","tags":["javascript","books"]},{"title":"2011-06-09のJS: CSS2.1勧告、Modernizr 2リリース、O&#39;Reilly本半額","url":"http://jser.info/post/6347977553","date":"2011-06-09T17:04:00+09:00","content":"JSer.info #21 - 今週は、やたらとチュートリアルなものが多いです。(載せてないの...","category":"JSer","tags":["css","chrome","iOS","git","HTML5","Silverlight.","books"]},{"title":"2011-06-17のJS: IE9.0.1、Firefox5、Chrome13、YSlow for Mobile","url":"http://jser.info/post/6621321277","date":"2011-06-17T23:27:00+09:00","content":"JSer.info #22 - 今回から大雑把な区分を設けてみましたので、何かあったら言ってく...","category":"JSer","tags":["books","browser","chrome","test","webkit","IE"]},{"title":"2011-06-24のJS:高速リリースが始まったFirefox5、jQuery Mobile β1、Closure Library","url":"http://jser.info/post/6863638956","date":"2011-06-24T22:12:00+09:00","content":"JSer.info #23 - 今週はFirefoxの高速リリースサイクルが目に見えて動き出し...","category":"JSer","tags":["git","javascript","正規表現","tes","test","jquery"]},{"title":"2011-07-01のJS: IE10pp2、Opera 11.50、High Performance JavaScript","url":"http://jser.info/post/7114486162","date":"2011-07-01T17:26:00+09:00","content":"JSer.info #24 - IE10pp2とOpera 11.50がリリースされて、少しず...","category":"JSer","tags":["IE","opera","node.js"]},{"title":"2011-07-08のJS: IE10はレガシーな機能と決別、Firefox7のメモリ、Node 0.5.0","url":"http://jser.info/post/7381241575","date":"2011-07-08T22:04:00+09:00","content":"JSer.info #25 -今週は非常にあっさりとしてますが、IE10pp2でいろいろな挙動...","category":"JSer","tags":["IE10","ecma","node.js","chrome"]},{"title":"2011-07-16のJS: Node.js for windows、git.js、CSS Media Query","url":"http://jser.info/post/7679184409","date":"2011-07-16T14:34:00+09:00","content":"JSer.info #26 - 今週は結構いろいろありますが、Node で使える ECMA S...","category":"JSer","tags":["node.js",".css","jquery"]},{"title":"2011-07-24のJS: JavaScriptはどう学ぶ?、HiveJS、melonJS","url":"http://jser.info/post/7997466057","date":"2011-07-24T19:03:41+09:00","content":"JSer.info #27 -  今週はちょっと少なめ。What&amp;#8217;s a Clos...","category":"JSer","tags":["event"]},{"title":"2011-07-30のJS: ECMA-262第5版の和訳、Firebug1.8.0、JSテスティングフレームワーク","url":"http://jser.info/post/8253646288","date":"2011-07-30T19:24:00+09:00","content":"JSer.info #28 - ECMA-262第5版の日本語訳をやり始めた方がいるみたいです...","category":"JSer","tags":["es5","firebug","opera"]},{"title":"John Resig: Secrets of the JavaScript Ninja本が50%オフ","url":"http://jser.info/post/8257131693","date":"2011-07-30T23:04:00+09:00","content":"まだ先行販売の状態(MEAP)ですが、jQuery作者として知られるJohn Resigの書籍...","category":"","tags":["jquery","books"]},{"title":"2011-08-06のJS: jQuery Mobile β2リリース、migemojs、JavaScript Bibliography","url":"http://jser.info/post/8553074604","date":"2011-08-06T19:10:42+09:00","content":"JSer.info #29 - Chromeがやっとキャッシュ無効にするオプションをサポートす...","category":"JSer","tags":["jquery","firebug","slide"]},{"title":"2011-08-14のJS: typeof JS、HTML5 Boilerplate v2.0、JavaScript blast","url":"http://jser.info/post/8903788835","date":"2011-08-14T20:01:20+09:00","content":"JSer.info #30 -今週はJavaScript blastやFixing the J...","category":"JSer","tags":["node.js","ecma","html5"]},{"title":"2011-08-21のJS: YUI3.4.0、Firefox6リリース、HTML5 Weekly","url":"http://jser.info/post/9203508431","date":"2011-08-21T19:31:00+09:00","content":"Jser.info #31 - Firefox6が正式リリースされました。(続けてFirefo...","category":"JSer","tags":["Firefox"]},{"title":"2011-08-28のJS: How Browsers Work、XHRのテスト、Node.js in Action","url":"http://jser.info/post/9497025183","date":"2011-08-28T19:36:00+09:00","content":"JSer.info #32 - 今週は、何か濃い記事が多かった気がします。個人的にはAvoid...","category":"JSer","tags":["browser","debug","Css","security"]},{"title":"ebook: JavaScript Web AppsとThird-party JavaScriptが50%オフ","url":"http://jser.info/post/9656429651","date":"2011-09-01T13:33:00+09:00","content":"JavaScript Web Applications - O&amp;#8217;Reilly Me...","category":"","tags":["books","javascript"]},{"title":"2011-09-04のJS: jQuery 1.6.3リリース、ウェブ技術の歴史、RequireJS","url":"http://jser.info/post/9784004842","date":"2011-09-04T18:43:00+09:00","content":"JSer.info #33 - jQuery 1.6.3リリースされましたが、新しい機能などは...","category":"JSer","tags":["jquery","chrome"]},{"title":"2011-09-11のJS: jQuery Mobileβ3、MooTools 1.4.0リリース、pjaxとは","url":"http://jser.info/post/10077541175","date":"2011-09-11T20:21:00+09:00","content":"JSer.info #34 - &amp;#8220;How Browsers Work&quot;はやっぱり人...","category":"JSer","tags":["canvas","CSS","CoffeeScript"]},{"title":"O’Reilly Mediaで全てのebookとVideoが半額で、28日まで","url":"http://jser.info/post/10260022356","date":"2011-09-16T09:53:49+09:00","content":"O’Reilly MediaがBack to School Special - *Free t...","category":"","tags":["oreilly","books"]},{"title":"2011-09-18のJS: Node.js 0.4.12、IE10pp3、ECMAScript Support Matrix","url":"http://jser.info/post/10355725749","date":"2011-09-18T21:32:00+09:00","content":"JSer.info #35 - Windows 8開発者向けプレビュー版がリリースされ、その中...","category":"JSer","tags":["javascript","node.js","jquery","ie10"]},{"title":"2011-09-25のJS: setImmediate、WebStorm3.0 EAP","url":"http://jser.info/post/10636897479","date":"2011-09-25T19:07:00+09:00","content":"JSer.info #36 - 今週は少なめ。パーフェクトJavaScriptが発売されたりし...","category":"JSer","tags":["music","ecma","ide"]},{"title":"2011-10-02のJS: jQuery Mobile1.0RC、jQuery1.7β、CSS4セレクタ","url":"http://jser.info/post/10930860395","date":"2011-10-02T21:11:40+09:00","content":"JSer.info #37 - jQuery Mobile1.0RC1やjQuery 1.7β...","category":"JSer","tags":["Css","jquery","firefox","ecma","security"]},{"title":"2011-10-09のJS: WeakMap、デザインパターン、CSSアニメーション","url":"http://jser.info/post/11220208044","date":"2011-10-09T17:53:00+09:00","content":"JSer.info #38 - WeakMapやCSSアニメーションの使い方やXHR2のcro...","category":"JSer","tags":["jquery","ecma","firefox","design","w3c"]},{"title":"2011-10-16のJS: Dart言語、Deferredライブラリ、CSS Lint 0.7.0","url":"http://jser.info/post/11518711080","date":"2011-10-16T19:08:19+09:00","content":"JSer.info #39 - GoogleによりDart言語が公開されました。また、なぜか今...","category":"JSer","tags":["opera","WAI-ARIA","Dart","CSS"]},{"title":"2011-10-23のJS: RequireJS 1.0、$.Callbacks、MVC","url":"http://jser.info/post/11812454810","date":"2011-10-23T19:06:00+09:00","content":"JSer.info #40 - モジュールローダーのRequireJSが1.0になったりその他...","category":"JSer","tags":["javascript","jquery","firebug","MVC"]},{"title":"2011-10-31のJS: WebStorm半額、jQuery Standards Team、Project Silk","url":"http://jser.info/post/12160303191","date":"2011-10-31T23:18:26+09:00","content":"JSer.info #41 - HTML,CSS,JavaScript IDEとして優秀なWe...","category":"JSer","tags":["jquery","ide","ecma","svg"]},{"title":"2011-11-06のJS: jQuery 1.7リリース、AMD&amp;モジュール化、Chrome Developer Tools","url":"http://jser.info/post/12412054655","date":"2011-11-06T19:05:47+09:00","content":"JSer.info #42 -jQuery1.7がリリースされました。1.7ではイベントAPI...","category":"JSer","tags":["jquery","chrome","security","module"]},{"title":"2011-11-13のJS: node.js 0.6.0、Firefox8、CoffeeScript 1.1.3 リリース","url":"http://jser.info/post/12732710417","date":"2011-11-13T19:32:00+09:00","content":"JSer.info #43 - そろそろAdvent Calendarの季節ですが今年もいろい...","category":"JSer","tags":["css","oreilly","node.js"]},{"title":"2011-11-20のJS: jQuery Mobile 1.0、JavaScript Garden和訳、Sinon.JS","url":"http://jser.info/post/13055544324","date":"2011-11-20T19:14:42+09:00","content":"JSer.info #44 - jQuery Mobile 1.0がやっと正式リリースされまし...","category":"JSer","tags":[]},{"title":"Pragmatic Bookshelfの書籍が全て40%OFF","url":"http://jser.info/post/13300772554","date":"2011-11-26T00:42:40+09:00","content":"2011/11/25&amp;#160;00:01PST から 23:59PSTの間、表題の通りのキャ...","category":"","tags":["books"]},{"title":"2011-11-27のJS: Node v0.6.3、JavaScripture、Fullscreen API ","url":"http://jser.info/post/13398937895","date":"2011-11-27T22:45:00+09:00","content":"JSer.info #45 - jQuery1.7.1がリリースされていますが、次のjQuer...","category":"JSer","tags":["node.js","library","jquery","firefox"]},{"title":"Apress 全ての書籍が$15、O&#39;Reilly 一部書籍が60%オフ","url":"http://jser.info/post/13447659794","date":"2011-11-28T17:59:34+09:00","content":"O&amp;#8217;Reilly MediaとApressがそれぞれ本日限定のセールをやっています...","category":"","tags":[]},{"title":"2011-12-04のJS: JavaScript開発者アンケート、MooTools, Dojo アップデート、Firefoxの開発者ツールまとめ","url":"http://jser.info/post/13721219759","date":"2011-12-04T18:02:00+09:00","content":"JSer.info #46 - JavaScript Advent Calendar 2011...","category":"JSer","tags":["library","イベント","mvc","html5"]},{"title":"2011-12-11のJS: IE10pp4、Opera 11.60、テストフレームワークBuster.JS","url":"http://jser.info/post/14060819847","date":"2011-12-11T20:33:00+09:00","content":"JSer.info #47 - IE10pp4が公開されて、Typed arrayなどがサポー...","category":"JSer","tags":["ie10","opera","mobile"]},{"title":"2011-12-18のJS: Dartium公開、JS開発者アンケートの結果発表、Polyfilling The HTML5","url":"http://jser.info/post/14399524720","date":"2011-12-18T20:59:00+09:00","content":"JSer.info #48 -DartVMをサポートしたChromium(       Dar...","category":"JSer","tags":[]},{"title":"2011-12-25のJS: Knockout 2.0.0、Firefox11の変更点、WebStorm3.0リリース","url":"http://jser.info/post/14762879105","date":"2011-12-25T20:05:00+09:00","content":"JSer.info #49 - FIrefox 11(Aurora 11なので実際には少し入る...","category":"JSer","tags":["twitter","CSS","javascript","wai-aria","test"]},{"title":"2012-01-01のJS: Google Documentの仕組み、impress.js、YSlow for Command Line","url":"http://jser.info/post/15125294102","date":"2012-01-01T22:45:00+09:00","content":"JSer.info #50 - 今週は年末だったからか振り返り系の記事が多かったので、新しい記...","category":"JSer","tags":[]},{"title":"2012-01-09のJS: Node 0.6.7、Firebug1.9.0リリース、MVCライブラリ","url":"http://jser.info/post/15563719242","date":"2012-01-09T21:19:00+09:00","content":"JSer.info #51 -  Firebug 1.9.0がリリースされました。Firebu...","category":"JSer","tags":["firebug","node"]},{"title":"オフライン勉強会でJSer.info一周年について発表してきた","url":"http://jser.info/post/15883533195","date":"2012-01-15T22:42:00+09:00","content":"オフラインJavaScript勉強会 で発表してきた内容についてのまとめです。去年の1月16日...","category":"","tags":["イベント","javascript"]},{"title":"2012-01-15のJS: PhantomJS 1.4リリース、JSTestDriverの導入、Device APIs","url":"http://jser.info/post/15884909384","date":"2012-01-15T23:33:00+09:00","content":"JSer.info #52 - 今年に入ってから、JavaScriptのいわゆるMVCフレーム...","category":"JSer","tags":["javascript","coffeescript","mobile"]},{"title":"2012-01-22のJS: WebRTC、Node 0.7.0リリース、slimit","url":"http://jser.info/post/16285455811","date":"2012-01-22T21:56:52+09:00","content":"JSer.info #53 - Chromeのdev channelでWebRTCが利用できる...","category":"JSer","tags":["node.js","tools"]},{"title":"2012-01-29のJS: jQuery Mobile 1.0.1、Firebug 1.10a2リリース、XHR2の同期通信について","url":"http://jser.info/post/16692607671","date":"2012-01-29T21:34:28+09:00","content":"JSer.info #54 - jQuery MobileやRequireJSなどいろいろアッ...","category":"JSer","tags":[]},{"title":"2012-02-05のJS: Backbone.js 0.9.1、The little book on CoffeeScript、Sassチュートリアル","url":"http://jser.info/post/17086939482","date":"2012-02-05T20:40:02+09:00","content":"JSer.info #55 - Backbone.jsの0.9.0がリリースされて、すぐ後に0...","category":"JSer","tags":["Css","mobile","LESS","node.js"]},{"title":"2012-02-12のJS: HTML5 Boilerplate 3.0、Nodeチュートリアル、Pot.js 1.13","url":"http://jser.info/post/17484921080","date":"2012-02-12T22:20:40+09:00","content":"JSer.info #56 - HTML5 Boilerplate 3.0がリリースされました...","category":"JSer","tags":["jquery","html5"]},{"title":"2012-02-20のJS: Web Appsフィールドガイド、大規模JS開発、小さなテストフレームワーク","url":"http://jser.info/post/17928816205","date":"2012-02-20T13:31:00+09:00","content":"JSer.info #57 - JavaScriptのデザインパターンについて書かれたEsse...","category":"JSer","tags":["design","event"]},{"title":"2012-02-27のJS: Pot.jsリファレンス、WebStorm紹介、grunt","url":"http://jser.info/post/18317558076","date":"2012-02-27T00:56:28+09:00","content":"JSer.info #58 - &amp;#8220;ループ処理における CPU 負荷を抑え、UI に...","category":"JSer","tags":["library","WebStorm"]},{"title":"2012-03-04のJS: Buster.JS、IE 10 Consumer Preview、QUnitでのテスト","url":"http://jser.info/post/18719289543","date":"2012-03-04T18:50:00+09:00","content":"JSer.info #59 - Test-Driven JavaScript Developm...","category":"JSer","tags":["ie10","test"]},{"title":"2012-03-12のJS: Sencha Touch 2.0、IEの自動アップグレード、Visual Studio 11 ","url":"http://jser.info/post/19179024872","date":"2012-03-12T23:09:21+09:00","content":"JSer.info #60 - モバイルアプリケーション向けのフレームワークのSencha T...","category":"JSer","tags":["javascript","ide"]},{"title":"2012-03-18のJS: Firefox11リリース、Web Workers、オブジェクト指向JavaScript","url":"http://jser.info/post/19507539234","date":"2012-03-18T20:47:07+09:00","content":"JSer.info #61 - Firefox11がリリースされました。開発者ツールにスタイル...","category":"JSer","tags":["firefox"]},{"title":"2012-03-25のJS: jQuery1.7.2、PhantomJS 1.5、JavaScript「再」紹介","url":"http://jser.info/post/19892092053","date":"2012-03-25T23:14:23+09:00","content":"JSer.info #62 - A re-introduction to JavaScript...","category":"JSer","tags":["jquery","webkit","node.js"]},{"title":"2012-04-01のJS: Mocha 1.0、Opera 11.62、Webkit1 と WebKit2","url":"http://jser.info/post/20280249810","date":"2012-04-01T19:46:00+09:00","content":"JSer.info #63 - JavaScriptテストフレームワークであるMochaの1....","category":"JSer","tags":["commonjs","webkit","test"]},{"title":"2012-04-08のJS: はてな教科書(JavaScript によるイベントドリブン)、CodeGrid、Qatrix ","url":"http://jser.info/post/20712606758","date":"2012-04-08T23:03:00+09:00","content":"JSer.info #64 - はてな研修用教科書というものが公開されて、その中でJavaSc...","category":"JSer","tags":["jquery","ecma","html5"]},{"title":"2012-04-15のJS: jQuery Mobile 1.1.0、CoffeeScript 1.3.1、YUI 3.5.0 リリース","url":"http://jser.info/post/21139931818","date":"2012-04-15T19:39:00+09:00","content":"JSer.info #65 - jQuery MobileとかCoffeeScriptとかPh...","category":"JSer","tags":["jquery","coffeescript"]},{"title":"2012-04-23のJS: JavaScript Enlightenment、WebStorm 4.0、mag.js ","url":"http://jser.info/post/21644435501","date":"2012-04-23T22:06:44+09:00","content":"JSer.info #66 - &amp;#8220;A book to turn a JavaScr...","category":"JSer","tags":["node.js","test","jquery","webstorm","IE","firefox"]},{"title":"2012-04-29のJS: Ext JS 4.1、Moobile 0.1リリース、lodash","url":"http://jser.info/post/22046177789","date":"2012-04-29T22:37:00+09:00","content":"JSer.info #67 - MooToolsからモバイルWebアプリケーションフレームワー...","category":"JSer","tags":["coffeescript","library","Css","firefox"]},{"title":"2012-05-07のJS: Node.js 0.6.17、JavaScriptスタイルガイド、js3-mode","url":"http://jser.info/post/22585773615","date":"2012-05-07T22:29:00+09:00","content":"JSer.info #68 - HTML5ROCKSが他言語化されたので、一部記事などが翻訳さ...","category":"JSer","tags":["editor","node","security"]},{"title":"2012-05-13のJS: YUIDoc 0.3.0、document.writeを使うべきではない理由、ECMAScriptの現在/未来","url":"http://jser.info/post/22967498990","date":"2012-05-13T22:21:03+09:00","content":"JSer.info #69 - JavaScriptのコメントからAPIドキュメントを生成する...","category":"JSer","tags":["javascript","ecma","Yui"]},{"title":"2012-05-20のJS: HTML5 Video、AMD API、JavaScript Design Patterns ","url":"http://jser.info/post/23409442733","date":"2012-05-20T21:30:00+09:00","content":"JSer.info #70 - HTML5 Videoのブラウザの対応してる機能などを細かくま...","category":"JSer","tags":["node","jquery","backbone.js","AMD","html5"]},{"title":"2012-05-27のJS:XRegExp v2.0.0、SinonJS+JsTestDriver、ステートフルJavaScript","url":"http://jser.info/post/23856474655","date":"2012-05-27T20:33:45+09:00","content":"JSer.info #71 - @kyo_agoさんがJsTestDriverとSinon.J...","category":"JSer","tags":["test","sinon.js"]},{"title":"2012-06-04のJS: IE10 pp6、RequireJS 2.0、Fluent 2012、HTML5devconf","url":"http://jser.info/post/24400726739","date":"2012-06-04T22:15:00+09:00","content":"JSer.info #72 - AMDローダとして有名なRequireJS 2.0がリリースさ...","category":"JSer","tags":["AMD","Esprima"]},{"title":"2012-06-10のJS: Jasmine 1.2、Bunyip、JavaScriptのテストを書く7つの理由","url":"http://jser.info/post/24805047685","date":"2012-06-10T18:48:00+09:00","content":"JSer.info #73 - タイトルが全部JavaScriptテスト関係だったりしますが、...","category":"JSer","tags":["test"]},{"title":"2012-06-15のJS: Sentimental Version","url":"http://jser.info/post/25286638502","date":"2012-06-15T20:29:00+09:00","content":"JSer.info #75 - いわゆる幻のバージョン","category":"JSer","tags":["Opera","ide"]},{"title":"2012-06-17のJS: Opera 12、AngularJS 1.0、JavaScript IDE","url":"http://jser.info/post/25286638506","date":"2012-06-17T20:29:00+09:00","content":"JSer.info #74 - いわゆるテンプレートエンジンライブラリの一種のAngularJ...","category":"JSer","tags":["Opera","ide"]},{"title":"2012-06-24のJS: jQuery 1.8 β1、PhantomJS 1.6、パッケージマネージャーJam","url":"http://jser.info/post/25777657024","date":"2012-06-24T21:16:00+09:00","content":"JSer.info #76 - jQuery 1.8 β1がリリースされました。最近言われてた...","category":"JSer","tags":["AMD","jquery"]},{"title":"インタラクティブなJavaScriptテストフレームワークTestem","url":"http://jser.info/post/26266683374","date":"2012-07-01T17:47:00+09:00","content":"インタラクティブにテストを実行できるの目的として上げてるテスティングフレームワークのteste...","category":"","tags":["test","node.js"]},{"title":"2012-07-01のJS: Node v0.8.0、jQuery1.9のロードマップ、SVG入門","url":"http://jser.info/post/26270762728","date":"2012-07-01T20:41:13+09:00","content":"JSer.info #77 - Node.jsの安定版0.8.xがリリースされてました。JQC...","category":"JSer","tags":["node.js","jquery","SVG"]},{"title":"2012-07-08のJS: &quot;use strict&quot;;、ES5.1和訳、CoffeeScript入門","url":"http://jser.info/post/26759415982","date":"2012-07-08T21:40:19+09:00","content":"JSer.info #78 - JavaScriptでstrict modeの宣言を行う&amp;#8...","category":"JSer","tags":["ecma","coffeescript"]},{"title":"2012-07-18のJS: Sinon.JS 1.4.0、Firebug 1.10、Testacular","url":"http://jser.info/post/27409971975","date":"2012-07-18T00:21:00+09:00","content":"JSer.info #79 - stub/mock/spy テストライブラリの Sinon.J...","category":"JSer","tags":["test","firebug","node.js"]},{"title":"2012-07-22のJS: Enyo 2、Typed Arraysチュートリアル、MockライブラリDexter JS","url":"http://jser.info/post/27757077993","date":"2012-07-22T19:32:54+09:00","content":"JSer.info #80 - ウェブアプリケーションフレームワークのEnyo 2リリースされ...","category":"JSer","tags":["test"]},{"title":"2012-07-30のJS: MVC系フレームワークのまとめ、リファクタリングjQuery、サイ本第6版","url":"http://jser.info/post/28336147599","date":"2012-07-30T23:14:00+09:00","content":"JSer.info #81 - JavaScriptのMVC系(サバクラ両方で動く JavaS...","category":"JSer","tags":["jquery","mvc","books"]},{"title":"2012-08-06のJS: YUI 3.6.0、Processing.js 1.4.0、Testing with CoffeeScript","url":"http://jser.info/post/28836462847","date":"2012-08-06T23:26:25+09:00","content":"JSer.info #82 - YUI 3.6.0がリリースされました。なんとなく、YUI T...","category":"JSer","tags":["Yui","coffeescript","test"]},{"title":"2012-08-13のJS: jQuery 1.8、Prototype.js 1.7.1、JavaScriptの過去/現在/ES.next","url":"http://jser.info/post/29335611140/2012-08-13-js-jquery-1-8-prototype-js","date":"2012-08-14T09:31:42+09:00","content":"JSer.info #83 - jQuery 1.8がリリースされました。また、 Protot...","category":"JSer","tags":["ECMAScript","JavaScript","jQuery"]},{"title":"2012-08-19のJS: Benchmark.js 1.0.0、Dojo 1.8、Sass 3.2.0 リリース","url":"http://jser.info/post/29757737771/2012-08-19-js-benchmark-js-1-0-0-dojo-1-8-sass-3-2-0","date":"2012-08-19T23:22:22+09:00","content":"JSer.info #84 - JavaScriptのコードスニペットのベンチマークを取ったり...","category":"JSer","tags":["benchmark"]},{"title":"2012-08-26のJS: Lo-Dash v0.5、Twitter Bootstrap 2.1.0、Web Inspectorでメモリ管理デバッグ","url":"http://jser.info/post/30234300631","date":"2012-08-26T19:09:33+09:00","content":"JSer.info #85 - underscore.jsの互換ライブラリのLo-Dash v...","category":"JSer","tags":["library","css","debug"]},{"title":"2012-09-02のJS: Firefox 15.0、HTML5 Boilerplate 4.0、Javascript Scope Quiz","url":"http://jser.info/post/30721107732","date":"2012-09-02T21:29:14+09:00","content":"JSer.info #86 - Firefox 15.0がリリースされました。キーイベント関係...","category":"JSer","tags":["Firefox","HTML5","Quiz"]},{"title":"2012-09-10のJS: WebStorm、コールバックなコーディングガイド、Source Maps","url":"http://jser.info/post/31270435672","date":"2012-09-10T23:20:16+09:00","content":"JSer.info #87 - WebStorm等のJetBrains製IDEはBack To...","category":"JSer","tags":["webstorm","node.js","sourcemaps"]},{"title":"2012-09-16のJS:フロントエンドのワークフローツールYeomanリリース、CSS Lint v0.9.9","url":"http://jser.info/post/31650273373","date":"2012-09-16T19:46:00+09:00","content":"JSer.info #88 - 以前から話されていたフロントエンドのツールやライブラリでの開発...","category":"JSer","tags":["tools","Css"]},{"title":"2012-09-24のJS: ACE Editor 1.0、jQuery 1.8.2、DOM Enlightenment Book β公開","url":"http://jser.info/post/32195784626","date":"2012-09-24T22:38:00+09:00","content":"JSer.info #89 - Mozilla Skywriter (Bespin)の後継でも...","category":"JSer","tags":["IDE","HTML5","W3C","books","DOM"]},{"title":"2012-09-30のJS: Underscore.js 1.4.0、PhantomJS 1.7、部分適用とカリー化","url":"http://jser.info/post/32584928708","date":"2012-09-30T19:01:00+09:00","content":"JSer.info #90 - Underscore.js が久々にアップデートされて、幾つか...","category":"JSer","tags":["library","webkit","javascript"]},{"title":"2012-10-08のJS: TypeScript、jQuery Mobile 1.2.0、NetBeans 7.3","url":"http://jser.info/post/33157092650","date":"2012-10-08T22:20:00+09:00","content":"JSer.info #91 - MicrosoftからTypeScriptというJavaScr...","category":"JSer","tags":["TypeScript","jquery","ide"]},{"title":"2012-10-14のJS: Web Platform Docs 、jQuery UI 1.9.0、Firefox 16","url":"http://jser.info/post/33562219916","date":"2012-10-14T21:44:00+09:00","content":"JSer.info #92 - Web Platform Docs(WPD) がアナウンスされ...","category":"JSer","tags":["w3c","jquery","firefox","chrome"]},{"title":"2012-10-21のJS: Meteor 0.5.0 、AngularJSがTestacularに移行、alt属性のベストプラクティス","url":"http://jser.info/post/34024677162","date":"2012-10-21T22:17:00+09:00","content":"JSer.info #93 - Webアプリケーション用フレームワークのMeteor 0.5....","category":"JSer","tags":["test","mvc","debug"]},{"title":"2012-10-29のJS: JavaScriptパーサ Esprima 1.0.0、Orion 1.0、大規模CoffeeScript","url":"http://jser.info/post/34565313418","date":"2012-10-29T23:36:00+09:00","content":"JSer.info #94 - 既にいろいろなツールで使われていますが、JavaScriptパ...","category":"JSer","tags":["javascript","coffeescript"]},{"title":"2012-11-06のJS:Yeti 0.2.13、Knockout 2.2.0、jQuery deprecated API","url":"http://jser.info/post/35124613102/2012-11-06-js-yeti-0-2-13-knockout-2-2-0-jquery","date":"2012-11-06T22:29:06+09:00","content":"JSer.info #95 - Yeti 0.2.13がリリースされました。QUnitのサポー...","category":"JSer","tags":["jQuery","testing"]},{"title":"2012-11-12のJS: Sencha Touch 2.1、JavaScriptコーディングスタイル、WebStorm LiveEdit","url":"http://jser.info/post/35565193068","date":"2012-11-13T00:35:20+09:00","content":"JSer.info #96 - Sencha Touch 2.1、Sencha Cmd 3.0...","category":"JSer","tags":["WebStorm","Sencha"]},{"title":"2012-11-18のJS: Opera 12.10、jQuery 1.8.3、TypeScript 0.8.1","url":"http://jser.info/post/35980297909","date":"2012-11-18T20:40:13+09:00","content":"JSer.info #97 - Opera 12.10リリースされ、SPDY、Fullscre...","category":"JSer","tags":["opera","jquery","typescript"]},{"title":"2012-11-26のJS: RequireJS 2.1.2、CSS@supports、JSLint/JSHint 解説","url":"http://jser.info/post/36591986101","date":"2012-11-26T23:40:00+09:00","content":"JSer.info #98 - JavaScriptのAMDモジュールローダのRequireJ...","category":"JSer","tags":["AMD","CSS","Opera"]},{"title":"2012-12-03のJS: enchant.js v0.6.0、Graphical Timeline、Async JavaScript","url":"http://jser.info/post/37110877175","date":"2012-12-03T22:50:00+09:00","content":"JSer.info #99 - enchant.js v0.6.0がリリースされ、デフォルトが...","category":"JSer","tags":["canvas","firefox","books"]},{"title":"2012-12-10のJS: Firebug 1.11.0、Heap Profilerでのメモリリーク調査、CSS testing tools","url":"http://jser.info/post/37638024456","date":"2012-12-10T23:43:00+09:00","content":"JSer.info #100 - Firebug 1.11.0がリリースされました。Fireb...","category":"JSer","tags":["firebug","chrome","debug","Css","testing"]},{"title":"2012-12-18のJS:ブラウザバグ報告手順、jQuery Deferred、DOM Compatibility Tables","url":"http://jser.info/post/38149485673","date":"2012-12-18T00:38:00+09:00","content":"JSer.info #101 - ブラウザのバグを見つけた場合にどのように報告するかについてま...","category":"JSer","tags":["jquery","browser","debug","dom"]},{"title":"WebStormがマヤセール中","url":"http://jser.info/post/38385083557","date":"2012-12-21T00:13:49+09:00","content":"WebStormの場合、新規個人ライセンスが $12 で、珍しくアップグレードにもセールが適応...","category":"","tags":[]},{"title":"2012-12-23のJS: jQuery1.9での変更点まとめ、Back-Forwad Cache、Chrome Devloper Tools解説","url":"http://jser.info/post/38627451843","date":"2012-12-24T00:00:00+09:00","content":"JSer.info #102 - 先週jQuery 1.9 Beta 1が公開されましたが、以...","category":"JSer","tags":["jquery","chrome","debug","browser"]},{"title":"2012-12-31のJS: PhantomJS 1.8、CasperJS 1.0リリース、Unit Testing JavaScript","url":"http://jser.info/post/39300263537","date":"2012-12-31T20:55:00+09:00","content":"JSer.info #103 - PhantomJS 1.8がリリースされました。大きな点とし...","category":"JSer","tags":["testing","backbone.js","altJS","github"]},{"title":"2013-01-08のJS: Secrets of the JavaScript Ninja、Effective JavaScript、 ES5でのJavaScript category: JSer Objects","url":"http://jser.info/post/39934331924","date":"2013-01-08T01:27:00+09:00","content":"JSer.info #104 - 書き始めてから4年ぐらい経ったと思われますが、ついにSecr...","category":"","tags":["javascript","books"]},{"title":"2013-01-14のJS: jQuery 1.9RC1、HTML5 Bones、JavaScriptリファレンス","url":"http://jser.info/post/40517175879","date":"2013-01-14T22:49:00+09:00","content":"JSer.info #105 - jQuery 1.9のRC1がリリースされました。jQuer...","category":"JSer","tags":["jquery","html5","javascript"]},{"title":"2013-01-21のJS: jQuery 1.9、Testing jQuery Plugins、JavaScript testing boilerplate","url":"http://jser.info/post/41104670903","date":"2013-01-22T00:07:00+09:00","content":"JSer.info #106 - jQuery 1.9やjQuery UI 1.10.0がリリ...","category":"JSer","tags":["jquery","testing"]},{"title":"2013-01-29のJS: QUnit 1.11、アンチパターンでみるTestable JavaScript、jQueryのDeferredとPromise","url":"http://jser.info/post/41782477547","date":"2013-01-29T22:42:00+09:00","content":"Jser.info #107 - QUnitが久々がアップデートがでてQUnit 1.11がリ...","category":"JSer","tags":["testing","jquery"]},{"title":"2013-02-03のJS: jQuery Migrate 1.1.0、Testling-CI、Effective JavaScript日本語版","url":"http://jser.info/post/42182271353","date":"2013-02-03T21:40:00+09:00","content":"JSer.info #108 - jquery-migrate 1.1.0がリリースされました...","category":"JSer","tags":["jquery","books","testing"]},{"title":"2013-02-11のJS: jQuery 1.9.1 、video／audio要素のQ&amp;A、解説Chrome Dev Tools","url":"http://jser.info/post/42835565455","date":"2013-02-11T20:24:00+09:00","content":"JSer.info #109 - jQuery 1.9.1 リリースされました。主にbugfi...","category":"JSer","tags":["jquery","chrome","html5"]},{"title":"2013-02-18のJS: OperaがWebkitへ移行、TodoMVC 1.1 、Lo-Dash 1.0.0リリース","url":"http://jser.info/post/43400440609","date":"2013-02-18T23:58:00+09:00","content":"JSer.info #110 - Opera DesktopがレンダリングエンジンとしてPre...","category":"JSer","tags":["jquery","mvc","library"]},{"title":"2013-02-26のJS: jQuery Mobile 1.3.0、 testacular 0.6.0、Grunt 0.4","url":"http://jser.info/post/44059391525","date":"2013-02-26T21:57:53+09:00","content":"JSer.info #111 - jQuery Mobile 1.3.0リリースされました。J...","category":"JSer","tags":[]},{"title":"2013-03-04のJS: JSHint 1.0.0、NetBeans 7.3リリース、開発者のための WebKit","url":"http://jser.info/post/44539128842","date":"2013-03-04T22:33:00+09:00","content":"JSer.info #112 - JSHint 1.0.0がリリースされました。大部分の更新内...","category":"JSer","tags":["tools","webkit","ide"]},{"title":"2013-03-11のJS: Zepto.js 1.0 、WebStorm 6.0、Tern/Aulx/Scripted","url":"http://jser.info/post/45109695078","date":"2013-03-11T23:23:00+09:00","content":"JSer.info #113 - jQuery-compatibleなライブラリのZepto....","category":"JSer","tags":["AST","javascript","jquery"]},{"title":"2013-03-18のJS: Node v0.10.0、setIntervalで非同期処理を回すコードのリファクタリング、CSSフレームワークのまとめ","url":"http://jser.info/post/45671679801","date":"2013-03-18T22:47:00+09:00","content":"JSer.info #114 - Node v0.10.0のメジャーアップデートが公開されまし...","category":"JSer","tags":["node","Css"]},{"title":"2013-03-24のJS: Backbone 1.0、CI as a Service 、DOMイベント基礎からLv4","url":"http://jser.info/post/46157633733","date":"2013-03-24T22:39:48+09:00","content":"JSer.info #115 - Backbone.js 1.0がリリースされました。test...","category":"JSer","tags":["MVC","testing","dom"]},{"title":"2013-04-01のJS: PhantomJS 1.9、Same-Origin Policy、JITコンパイル","url":"http://jser.info/post/46842509372","date":"2013-04-01T21:27:57+09:00","content":"JSer.info #116 - PhantomJS 1.9がリリースされました。外部プロセス...","category":"JSer","tags":["webkit","JIT","Security"]},{"title":"Chrome Blink よくある質問の翻訳まとめ","url":"http://jser.info/post/47339713468","date":"2013-04-07T13:41:41+09:00","content":"GoogleがWebkitをフォークして新しいレンダリングエンジンとしてBlinkを発表しまし...","category":"","tags":["Google","Chrome","Webkit","翻訳"]},{"title":"2013-04-08のJS: Chrome Blink、Firefox 20.0、EPUB 3 仕様書和訳","url":"http://jser.info/post/47454955299","date":"2013-04-08T22:32:32+09:00","content":"JSer.info #117 - GoogleはChromiumプロジェクトのレンダリングエン...","category":"JSer","tags":["chrome","Webkit","firefox","epub"]},{"title":"2013-04-15のJS: jQuery 2.0 Beta 3、実践メモリプロファイリング、WebStorm&amp;AngularJS","url":"http://jser.info/post/48040853605","date":"2013-04-15T23:15:00+09:00","content":"JSer.info #118 - jQuery 2.0 Beta 3がリリースされました。No...","category":"JSer","tags":["jquery","chrome","webstorm","movie"]},{"title":"2013-04-21のJS: jQuery 2.0 、Sencha Touch 2.2、Grunt日本語リファレンス","url":"http://jser.info/post/48526589776","date":"2013-04-21T23:50:00+09:00","content":"JSer.info #119 - jQuery 2.0がリリースされました。以前発表されたロー...","category":"JSer","tags":["jquery","webkit","sencha"]},{"title":"2013-04-29のJS: TypeScript 0.9α、Jade入門、JavaScript Ninja","url":"http://jser.info/post/49173192636","date":"2013-04-29T20:58:00+09:00","content":"JSer.info #120 - TypeScript 0.9.0 Alphaが公開されました...","category":"JSer","tags":["TypeScript","Node","Books"]},{"title":"2013-05-07のJS: Sinon.JS 1.7.1、The Politics of JavaScript、Intern(Test)","url":"http://jser.info/post/49854959525","date":"2013-05-07T23:11:30+09:00","content":"JSer.info #121 - Sinon.JS 1.7.1 リリース。$.ajax or ...","category":"JSer","tags":["testing","slide"]},{"title":"2013-05-13のJS:  JSHint 2.0.0、JSDoc 3移行ガイド、ES6 generator","url":"http://jser.info/post/50341060452","date":"2013-05-13T22:50:00+09:00","content":"JSer.info #122 - JSHint 2.0.0リリース。JSHint 1.0.0が...","category":"JSer","tags":["tool","JSDoc"]},{"title":"2013-05-20のJS: Web Components、Firefox 21.0、Regular Expression Enlightenment","url":"http://jser.info/post/50905119483","date":"2013-05-20T22:22:00+09:00","content":"JSer.info #123 - PolymerというWeb Componentsのpolyf...","category":"JSer","tags":["Firefox","RexExp","Book"]},{"title":"2013-05-27のJS: JSHint 2.1.0 、jQuery 1.10.0 、Writing Testable JavaScript ","url":"http://jser.info/post/51471360040","date":"2013-05-27T22:23:00+09:00","content":"JSer.info #124 - rapid releaseを採用したJSHintですが早速2...","category":"JSer","tags":["jQuery","testing"]},{"title":"2013-06-03のJS: WebStorm 7 EAP、Seleniumとは何か、ECMAScript 6 Overview、","url":"http://jser.info/post/52055156113","date":"2013-06-03T22:34:00+09:00","content":"JSer.info #125 - WebStorm 7 EAP(いわゆるα版)がリリースされま...","category":"JSer","tags":["WebStorm","ecmascript"]},{"title":"2013-06-10のJS: Bower入門、描画パフォーマンスとGPU、JavaScript refresh","url":"http://jser.info/post/52625615075","date":"2013-06-10T22:44:48+09:00","content":"JSer.info #126 - Bower入門(基礎編) - from scratchという...","category":"JSer","tags":["tool","Chrome","debug","javascript"]},{"title":"2013-06-17のJS: Gmailでのメモリ管理、requestAnimationFrame、DOM Future と DOM の将来","url":"http://jser.info/post/53196035548","date":"2013-06-17T23:26:41+09:00","content":"JSer.info #127 - Google I/Oの発表されたGmailでのメモリ管理につ...","category":"JSer","tags":["DOM","memory"]},{"title":"2013-06-24のJS: TypeScript 0.9、Dart βリリース、CSP1.0","url":"http://jser.info/post/53755615195","date":"2013-06-24T22:29:00+09:00","content":"JSer.info #128 - TypeScript 0.9が正式リリースされました。ジェネ...","category":"JSer","tags":["TypeScript","Dart","CSP","Security"]},{"title":"2013-07-02のJS:  Firefox 22、ES6 Module 、Generators*、SlimerJS","url":"http://jser.info/post/54348875825","date":"2013-07-02T00:57:00+09:00","content":"JSer.info #129 - Firefox 22.0がリリースされました。WebRTCが...","category":"JSer","tags":["Firefox","ES6"]},{"title":"2013-07-08のJS: Opera 15、JavaScriptのオブジェクト指向、 SpiderMonkey Parser API","url":"http://jser.info/post/54913696698","date":"2013-07-08T22:54:32+09:00","content":"JSer.info #130 - ChromiumベースとなったOpera 15がリリースされ...","category":"JSer","tags":["opera","javascript"]},{"title":"2013-07-16のJS: Jasmineとモック、Chrome Dev Tools新機能まとめ、ESLint","url":"http://jser.info/post/55601042473","date":"2013-07-16T22:44:00+09:00","content":"JSer.info #131 - JavaScriptでテストのためのspyやmock,stu...","category":"JSer","tags":["jasmine","Chrome","ecmascript","tools"]},{"title":"2013-07-23のJS: jQuery Mobile 1.3.2、Bower 1.0.0、Test Private Functions","url":"http://jser.info/post/56242966779","date":"2013-07-24T00:04:00+09:00","content":"JSer.info #132 - jQuery Mobile 1.3.2がリリースされました。...","category":"JSer","tags":["jquery","ECMSCript","module"]},{"title":"High-Quality JavaScript Code ツールまとめ","url":"http://jser.info/post/56525802407/high-quality-javascript-code","date":"2013-07-27T01:34:32+09:00","content":"  High-Quality JavaScript Code  from Den Odellと...","category":"","tags":["JavaScript","スライド","まとめ"]},{"title":"2013-07-29のJS: IE11 DP on Windows7、ES6 modulesの使い方、JS オブジェクト指向","url":"http://jser.info/post/56695943944/2013-07-29-js-ie11-dp-on-windows7-es6-modules-js","date":"2013-07-29T00:48:00+09:00","content":"JSer.info #133 - Windows7向けにIE11 Developer Prev...","category":"JSer","tags":["JavaScript","Windows","IE11","ES6"]},{"title":"2013-08-05のJS: JSHint 2.1.6、Web Tracing Framework、Handlebars","url":"http://jser.info/post/57425671735","date":"2013-08-05T22:49:00+09:00","content":"JSer.info #134 - JSHint 2.1.6がリリースされています。ES6のyi...","category":"JSer","tags":["JavaScript","DOM","library"]},{"title":"2013-08-12のJS: Firefox 23.0、W3C Highlights@2013、DalekJS","url":"http://jser.info/post/58058890591","date":"2013-08-12T23:15:00+09:00","content":"JSer.info #135 - Firefox 23.0がリリースされました。Firefox...","category":"JSer","tags":["Firefox","W3C","Selemium","DalekJS"]},{"title":"2013-08-19のJS: Bootstrap 3 RC2、Firefox25 開発ツール、ES6の新しい文法とES5","url":"http://jser.info/post/58698279190/2013-08-19-js-bootstrap-3-rc2-firefox25","date":"2013-08-19T23:25:00+09:00","content":"JSer.info #136 - Bootstrap 3 RC2(aka. Twitter B...","category":"JSer","tags":["CSS","Firefox","Debug","ES6"]},{"title":"2013-08-26のJS: Yeoman 1.0、Meta-Weekly、Power Assert in JavaScript","url":"http://jser.info/post/59394147051/2013-08-26-js-yeoman-1-0-meta-weekly-power-assert-in","date":"2013-08-26T22:48:06+09:00","content":"JSer.info #137 - Yeoman 1.0がリリースされました。yo コマンドの分...","category":"JSer","tags":["JavaScript","testing","website"]},{"title":"2013-09-02のJS: Ember.js 1.0、ECMAScript i18n API、メンテナブルCSS","url":"http://jser.info/post/60073198740/2013-09-02-js-ember-js-1-0-ecmascript-i18n","date":"2013-09-02T22:22:04+09:00","content":"JSer.info #138 - 長いRCがおわりEmber.js 1.0とEmber Dat...","category":"JSer","tags":["EmberJS","ECMAScript","i18n","CSS"]},{"title":"2013-09-09のJS:WebStorm 7.0β、@@ iterator、Enterprise Web Development","url":"http://jser.info/post/60753350918/2013-09-09-js-webstorm-7-0-iterator-enterprise-web","date":"2013-09-09T23:21:15+09:00","content":"JSer.info #139 - WebStorm 7.0 Betaがリリースされました。EJ...","category":"JSer","tags":["WebStorm","ES6","book"]},{"title":"2013-09-16のJS: Lo-Dash 2.0、CSS Flexbox、regexp.js","url":"http://jser.info/post/61403252910/2013-09-16-js-lo-dash-2-0-flexbox-regexp-js","date":"2013-09-16T22:06:54+09:00","content":"JSer.info #140 - lodash v2.0.0がリリースされました。変更の詳細は...","category":"JSer","tags":["JavaScript","Underscore.js","CSS","RegExp"]},{"title":"2013-09-24のJS: jQuery2.1 β1、Buster.JS v0.7.4、Tableタグガイド","url":"http://jser.info/post/62154098795/2013-09-24-js-jquery2-1-1-buster-js-v0-7-4-table","date":"2013-09-24T23:39:43+09:00","content":"JSer.info #141 - jQuery 1.11 and 2.1 Beta 1 がリリ...","category":"JSer","tags":["jQuery","Buster.JS","HTML"]},{"title":"2013-09-29のJS: WebStorm 7.0、WebGL 2.0、AngularJSデバッグ&amp;テスト","url":"http://jser.info/post/62619483902/2013-09-29-js-webstorm-7-0-webgl-2-0-angularjs","date":"2013-09-29T23:48:48+09:00","content":"JSer.info #142 - WebGL 2 Specificationのfirst ed...","category":"JSer","tags":["WebGL","WebStorm","AngularJS","Testing","Debug"]},{"title":"2013-10-07のJS: なぜテストをするのか、console API、PromisesライブラリBluebird","url":"http://jser.info/post/63373114717/2013-10-07-js-console","date":"2013-10-07T23:17:06+09:00","content":"JSer.info #143 - Testable &amp;amp; Tested Client-s...","category":"JSer","tags":["JavaScript","testing","debug","library"]},{"title":"2013-10-15のJS: Backbone.js 1.1.0、MV*データバインディング、Knockout 3.0RC","url":"http://jser.info/post/64115054116/2013-10-15-js-backbone-js-1-1-0-mv-knockout","date":"2013-10-15T23:16:15+09:00","content":"JSer.info #144 - Backbone.js 1.1.0 がリリースされました。1...","category":"JSer","tags":["MVC"]},{"title":"Packt Publishingの書籍が全て50%オフのセール中","url":"http://jser.info/post/64570955675/packt-publishing-50","date":"2013-10-20T21:50:46+09:00","content":"Packt Publishingの全ての書籍がクーポンコード COL50 で半額で買えるように...","category":"","tags":["book","JavaScript"]},{"title":"2013-10-21のJS: JSHint 2.3.0、Node v0.10.21、Promises and Generators","url":"http://jser.info/post/64677530544/2013-10-21-js-jshint-2-3-0-node-v0-10-21-promises-and","date":"2013-10-21T22:30:16+09:00","content":"JSer.info #145 - JavaScriptのLintツールJSHint 2.3.0...","category":"JSer","tags":["JSHint","Node.js","Promises","Generators"]},{"title":"2013-10-29のJS: iv / lv5 1.0.0、Knockout.js 3.0、Snap.svg","url":"http://jser.info/post/65340412002/2013-10-29-js-iv-lv5-1-0-0-knockout-js-3-0-snap-svg","date":"2013-10-29T00:23:07+09:00","content":"JSer.info #146 -  ECMA262&amp;#160;5.1仕様準拠のECMAScri...","category":"JSer","tags":["ECMAScript","JavaScript","MVC","SVG"]},{"title":"2013-11-06のJS: WebStormのMochaサポート、ESLint 0.1.0、ヘッドレスIE","url":"http://jser.info/post/66177916780/2013-11-06-js-webstorm-mocha-eslint-0-1-0-ie","date":"2013-11-06T20:23:13+09:00","content":"JSer.info #147 - WebStorm 7.0.2 RCがリリースされ、Karma...","category":"JSer","tags":["WebStorm","ECMAScript","Tools","IE"]},{"title":"2013-11-11のJS: AngularJS 1.2.0、ブラウザ間を超えたRemoteDebug protocol","url":"http://jser.info/post/66677981011/2013-11-11-js-angularjs-1-2-0-remotedebug","date":"2013-11-11T23:57:56+09:00","content":"JSer.info #148 - AngularJS 1.2.0がリリースされました。Anim...","category":"JSer","tags":["AngularJS","Debug","Browser"]},{"title":"2013-11-18のJS: Dart 1.0、jQuery 2.1.0 Beta 2、60fpsのスクロール","url":"http://jser.info/post/67363001788","date":"2013-11-18T22:12:02+09:00","content":"JSer.info #149 - Dartが発表されてから約2年、 Dart SDK 1.0が...","category":"JSer","tags":["Dart","jQuery","performance"]},{"title":"2013-11-25のJS: Grunt 0.4.2、IE6-11の互換性機能、AngularJSとEmber.js","url":"http://jser.info/post/68059706431/2013-11-25-js-grunt","date":"2013-11-25T22:31:00+09:00","content":"JSer.info #150 - Grunt 0.4.2 がリリースされました。grunt.f...","category":"JSer","tags":["Grunt","IE","AngularJS","EmberJS"]},{"title":"Pragmatic Bookshelfの書籍等が全て半額のセール中","url":"http://jser.info/post/68062359944/pragmatic-bookshelf","date":"2013-11-25T23:26:03+09:00","content":"Rubyを中心にOreillyと並んで技術書のebookに強いThe Pragmatic Bo...","category":"","tags":["Books"]},{"title":"ManningのJavaScript書籍が全て半額のセール中","url":"http://jser.info/post/68115394733","date":"2013-11-26T10:00:14+09:00","content":"Manning PublicationsAction本等で知られるManning Public...","category":"","tags":["JavaScript","book"]},{"title":"2013-12-03のJS:YUI 3.14.0、JavaScript開発者アンケート、JavaScript Test Runner比較","url":"http://jser.info/post/68881229249/2013-12-03-js-yui-3-14-0-javascript-javascript","date":"2013-12-04T00:03:26+09:00","content":"JSer.info #151 - YUI 3.14.0がリリースされました。ちょっと面白い感じ...","category":"JSer","tags":["YUI","アンケート","ES6","Promises","Testing"]},{"title":"2013-12-09のJS: browserify v3.0、TypeScript 0.9.5、power-doctest","url":"http://jser.info/post/69487144209/2013-12-09-js-browserify-v3-0-typescript","date":"2013-12-09T23:59:58+09:00","content":"JSer.info #152 - node.js向けのスタイルで書かれたものをブラウザで動くよ...","category":"JSer","tags":["node.js","TypeScript","testing"]},{"title":"2013-12-16のJS: Firefox 26、JavaScript開発者アンケート結果、MV*ライブラリとセキュリティ","url":"http://jser.info/post/70188909334/2013-12-16-js-firefox","date":"2013-12-16T22:59:46+09:00","content":"JSer.info #153 - Firefox 26がリリースされました。主な変更点や追加機...","category":"JSer","tags":["Firefox","JavaScript","MVC","Security"]},{"title":"2013-12-23のJS: Jasmine 2.0、Promises x Generator、Koa、ストリーミングビルドシステムgulp","url":"http://jser.info/post/70888873447/2013-12-23-js-jasmine-2-0-promises-x","date":"2013-12-23T21:05:55+09:00","content":"JSer.info #154 - JavaScripttテストフレームワークのJasmine2...","category":"JSer","tags":["jasmine","testing","promises","generator","node.js"]},{"title":"2013-12-31のJS: JSHint 2.4.0、koaチュートリアル、Selenium Builder","url":"http://jser.info/post/71734160602/2013-12-31-js-jshint-2-4-0-koa-selenium-builder","date":"2013-12-31T17:38:51+09:00","content":"JSer.info #155 - JSHint 2.4.0 がリリースされました。bugfix...","category":"JSer","tags":["JSHInt","Node.js","Selenium"]},{"title":"2014-01-06のJS:Koa 0.2.0、jQuery Mobile 1.4.0、Functional JavaScript","url":"http://jser.info/post/72442862507/2014-01-06-js-koa-0-2-0-jquery-mobile-1-4-0-functional","date":"2014-01-06T23:57:02+09:00","content":"JSer.info #156 - NodeのWebフレームワークであるKoa 0.2.0(0....","category":"JSer","tags":["node.js","jQuery","mobile","FP"]},{"title":"Graspを使ったJavaScriptのリファクタリング","url":"http://jser.info/post/73202282881/grasp-javascript","date":"2014-01-13T22:23:32+09:00","content":"Refactoring your JavaScript code with Grasp | G...","category":"","tags":["JavaScript","AST","Console","Tools"]},{"title":"2014-01-13のJS: sweet.js 0.4.0、Generatorチュートリアル、同期的に書ける結合テストフレームワークTestium","url":"http://jser.info/post/73206411885/2014-01-13-js-sweet-js","date":"2014-01-13T23:41:46+09:00","content":"JSer.info #157 - JavaScriptをマクロを使って展開出来るSweet.j...","category":"JSer","tags":["macro","generator","debug","testing","node.js"]},{"title":"third anniversary","url":"http://jser.info/post/73484514668/third-anniversary","date":"2014-01-16T13:48:00+09:00","content":"今日で JSer.info を初めてから丸3年が経ちました。2011-01-16のJavaSc...","category":"","tags":["JavaScript"]},{"title":"2014-01-21のJS: jQuery 2.1.0 RC1リリース、browserify入門、ECMAScript 6 @ 2013","url":"http://jser.info/post/73953487267/2014-01-21-js-jquery-2-1-0","date":"2014-01-21T00:59:20+09:00","content":"JSer.info #158 - jQuery 1.11.0 RC1 と 2.1.0 RC1が...","category":"JSer","tags":["jquery","browserify","ES6"]},{"title":"2014-01-27のJS:ESLint 0.3.0、jQuery 2.1リリース、Backbone.Marionette","url":"http://jser.info/post/74722015170/2014-01-27-js-eslint-0-3-0-jquery","date":"2014-01-27T22:57:01+09:00","content":"JSer.info #159 - JS ASTをベースとしてJavaScriptのLintツー...","category":"JSer","tags":["ECMAScript","Lint","jQuery","Backbone.js"]},{"title":"JSer.infoに紹介してもらいたい記事のPull Requestが出来るようになりました","url":"http://jser.info/post/75446735069/jser-info-pull-request","date":"2014-02-03T13:09:16+09:00","content":"JSer.info Pull Request Form というサイトを作りました。どういうサイ...","category":"","tags":["github","AngularJS","browserify"]},{"title":"2014-02-03のJS: Bootstrap 3.1.0、CoffeeScript1.7.0、アクセシブルなアイコンフォント","url":"http://jser.info/post/75477390938/2014-02-03-js-bootstrap","date":"2014-02-03T22:15:57+09:00","content":"JSer.info #160 - Bootstrap 3.1.0がリリースされました。ドキュメ...","category":"JSer","tags":["CSS","Bootstrap","CoffeeScript","Fonts"]},{"title":"2014-02-10のJS: Firefox 27、Promisesガイドライン、Sweet.js チュートリアル","url":"http://jser.info/post/76223855511/2014-02-10-js-firefox-27-promises-sweet-js","date":"2014-02-11T00:03:27+09:00","content":"JSer.info #161 - Firefox 27がリリースされました。CSSのall:u...","category":"JSer","tags":["Firefox","Promises","Sweet.js"]},{"title":"2014-02-17のJS: ESLint 0.4.0、Underscore 1.6.0、Gruntとgulp","url":"http://jser.info/post/76953562122/2014-02-17-js-eslint-0-4-0-underscore-1-6-0-grunt-gulp","date":"2014-02-17T22:50:01+09:00","content":"JSer.info #162 - plugableなJavaScript LintツールのES...","category":"JSer","tags":["ECMAScript","AST","Grunt","gulp"]},{"title":"あなたが読むべきJavaScript Promises","url":"http://jser.info/post/77696682011/es6-promises","date":"2014-02-24T21:36:44+09:00","content":"はじめにこの記事は、 JavaScript/ES6 promisesについてを理解するために読...","category":"","tags":["ECMAScript","Promises","JavaScript"]},{"title":"2014-02-24のJS: Gruntfileのメンテナンス、Promisesアンチパターン、ES6 Fiddle","url":"http://jser.info/post/77704000553/2014-02-24-js-gruntfile-promises-es6","date":"2014-02-25T00:00:56+09:00","content":"JSer.info #163 - Maintainable Gruntfile.js - fr...","category":"JSer","tags":["Grunt","Promises","ES6"]},{"title":"2014-03-03のJS : TypeScript 1.0RC、Rewriting With ES6、Webアプリのセキュリティ入門","url":"http://jser.info/post/78438562725/2014-03-03-js-typescript-1-0rc-rewriting-with","date":"2014-03-03T23:04:45+09:00","content":"JSer.info #164 - TypeScript 1.0RCがリリースされました。元々は...","category":"JSer","tags":["TypeScript","ES6","Security"]},{"title":"2014-03-10のJS: Sass 3.3、Orion 5.0.0、Speaking JavaScript","url":"http://jser.info/post/79162569101/2014-03-10-js-sass-3-3-orion-5-0-0-speaking-javascript","date":"2014-03-10T22:39:23+09:00","content":"JSer.info #165 - Sass 3.3.0がリリースされました。新しいデータタイプ...","category":"JSer","tags":["Sass","book"]},{"title":"2014-03-17のJS: Karma 0.12.0、mocha 1.18.0、Promisesエラーハンドリング、実践Browserify","url":"http://jser.info/post/79869632329/2014-03-17-js-karma-0-12-0-mocha","date":"2014-03-17T23:33:59+09:00","content":"JSer.info #166 - JavaScript test runnerのKarma v...","category":"JSer","tags":["testing","node.js","promises","browserify"]},{"title":"2014-03-24のJS: AngularJS 2.0、JavaScript Lintツールの現状と未来","url":"http://jser.info/post/80570556661/2014-03-24-js-angularjs-2-0-javascript-lint","date":"2014-03-24T21:44:28+09:00","content":"JSer.info #167 - 以前からちょこちょこDesign docsが公開されていまし...","category":"JSer","tags":["AngularJS","Lint","Tools","JavaScript"]},{"title":"2014-03-31のJS: Esprima 1.1.1、WebStorm 8.0、JavaScriptとメモリリーク","url":"http://jser.info/post/81291650500/2014-03-31-js-esprima-1-1-1-webstorm","date":"2014-03-31T23:38:10+09:00","content":"JSer.info #168 - JavaScriptパーサーのEsprima 1.1.1がリ...","category":"JSer","tags":["JavaScript","AST","WebStorm","node.js"]},{"title":"2014-04-07のJS: TypeScript 1.0、JSHint 2.5.0、Chromeの非同期処理デバッグ","url":"http://jser.info/post/81989727221/2014-04-07-js-typescript-1-0-jshint","date":"2014-04-07T22:37:11+09:00","content":"JSer.info #169 - MSによるJavaScriptのスーパーセット実装であるTy...","category":"JSer","tags":["TypeScript","JavaScript","Tools","Chrome","Debug"]},{"title":"2014-04-14のJS: Chrome35β、JavaScript非同期処理、spy-js","url":"http://jser.info/post/82675654535/2014-04-14-js-chrome35-javascript-spy-js","date":"2014-04-14T19:01:38+09:00","content":"JSer.info #170 - Chrome 35 Betaがリリースされました。Stabl...","category":"JSer","tags":["Chrome","JavaScript","Async","WebStorm"]},{"title":"2014-04-21のJS: Kendo UI、JS Recipes、square/esnext ","url":"http://jser.info/post/83405640735/2014-04-21-js-kendo-ui-js-recipes-square-esnext","date":"2014-04-21T21:39:31+09:00","content":"JSer.info #171 - Telerikが開発してるKendo UI Coreがオープ...","category":"JSer","tags":["JavaScript","UI","ECMAScript","Tools"]},{"title":"2014-04-29のJS: Firefox29、Promises、ES6へ向けて","url":"http://jser.info/post/84230597159/2014-04-29-js-firefox29-promises-es6","date":"2014-04-30T00:50:19+09:00","content":"JSer.info #172 - Firefox 29がリリースされました。UI的にも大きな変...","category":"JSer","tags":["Firefox","Promises","ECMAScript"]},{"title":"2014-05-06のJS: Node 0.11.13、ECMAScript 6入門、JS Testing Recipes","url":"http://jser.info/post/84910244174/2014-05-06-js-node-0-11-13-ecmascript-6-js-testing","date":"2014-05-06T18:17:30+09:00","content":"JSer.info #173 - Node v0.11.13 (Unstable)がリリースさ...","category":"JSer","tags":["Node.js","ECMAScript","JavaScript","Testing","book"]},{"title":"2014-05-12のJS: browserify 4.0.0、JSテスト環境の移行、ES6-Learning","url":"http://jser.info/post/85527368079/2014-05-12-js-browserify-4-0-0-js-es6-learning","date":"2014-05-12T23:42:56+09:00","content":"JSer.info #174 - browserify 4.0.0がリリースされました。(もう...","category":"JSer","tags":["browserify","JavaScript","testing","ES6"]},{"title":"2014-05-20のJS: ESLint 0.6.0、browserifyハンドブック、HTML Imports","url":"http://jser.info/post/86306165694/2014-05-20-js-eslint-0-6-0-browserify-html","date":"2014-05-20T22:23:02+09:00","content":"JSer.info #175 - JavaScript LintツールのESLint 0.6....","category":"JSer","tags":["ECMAScript","JavaScript","Tools","browserify","HTML"]},{"title":"2014-05-26のJS: Chrome35-36、Object.observe、React.jsチュートリアル","url":"http://jser.info/post/86894902744/2014-05-26-js","date":"2014-05-26T22:56:19+09:00","content":"JSer.info #176 - Chrome 35のstableがリリースされました。以前紹...","category":"JSer","tags":["Chrome","ECMAScript","React.js"]},{"title":"2014-06-02のJS: gulp3.7、Socket.IO1.0、JSConf US 2014","url":"http://jser.info/post/87594529109/2014-06-02-js-gulp3-7-socket-io1-0-jsconf-us-2014","date":"2014-06-02T22:48:33+09:00","content":"JSer.info #177 - ビルドツールであるgulpの3.7.0がリリースされました。...","category":"JSer","tags":["JavaScript","tools","node.js","イベント"]},{"title":"2014-06-09のJS: Bluebird 2.0.0、ES6のリリーススケジュール、Nodeで作るコマンドラインツール","url":"http://jser.info/post/88276341744/2014-06-09-js-bluebird","date":"2014-06-09T23:37:42+09:00","content":"JSer.info #178 - JavaScriptのPromise実装ライブラリであるBl...","category":"JSer","tags":["promises","ECMAScript","ES6","Node.js"]},{"title":"2014-06-17のJS: Firefox30.0、Firebug 2.0、IE Developer Channel","url":"http://jser.info/post/89057149744/2014-06-17-js-firefox30-0-firebug-2-0-ie-developer","date":"2014-06-17T22:48:08+09:00","content":"JSer.info #179 - Firefox 30がリリースされました。XHRなどDOMの...","category":"JSer","tags":["Firefox","Firebug","IE","browser"]},{"title":"2014-06-23のJS: Backbone.Marionette 2.0.0、Orion 6.0、JavaScript Promise","url":"http://jser.info/post/89652992559/2014-06-23-js-backbone-marionette-2-0-0-orion","date":"2014-06-23T22:21:58+09:00","content":"JSer.info #180 - Backbone.Marionetteがメジャーアップデート...","category":"JSer","tags":["backbone","IDE","editor","JavaScript","Promises"]},{"title":"2014-06-30のJS: jQuery UI 1.11.0、ビルドツールWebPack、QuickStart、Firefox DevTools","url":"http://jser.info/post/90349855204/2014-06-30-js-jquery-ui","date":"2014-06-30T22:10:23+09:00","content":"JSer.info #181 - jQuery UI 1.11.0がリリースされました。AMD...","category":"JSer","tags":["jquery","JavaScript","browser","browserify","Firefox","debug"]},{"title":"2014-07-07のJS: Dart 1st Edition、Intern 2.0、7 Patterns to Refactor","url":"http://jser.info/post/91041422669/2014-07-07-js-dart-1st-edition-intern-2-0-7-patterns","date":"2014-07-07T21:24:00+09:00","content":"JSer.info #182 - Googleが主に開発してるDart言語のEcma標準仕様と...","category":"JSer","tags":["Dart","JavaScript","testing"]},{"title":"2014-07-15のJS: ESLint 0.7.1、Ember 1.6.0、初めてのJavaScriptデバッグ","url":"http://jser.info/post/91847418764/2014-07-15-js-eslint-0-7-1-ember","date":"2014-07-15T22:52:01+09:00","content":"JSer.info #183 - ESLint 0.7.1がリリースされました。設定ファイル周...","category":"JSer","tags":["JavaScript","ECMAScript","Ember","Debug"]},{"title":"2014-07-22のJS: Chrome36、Web ComponentsとPolyfillとCustom Element","url":"http://jser.info/post/92530743429/2014-07-22-js-chrome36-web-components-polyfill-custom","date":"2014-07-22T22:25:47+09:00","content":"JSer.info #184 - Chrome 36.0がリリースされました。同じくChrom...","category":"JSer","tags":["Chrome","Opera","WebComponents","Polymer","library"]},{"title":"2014-07-28のJS: Browserify 5.0.0リリース、AngularJSとセキュリティ","url":"http://jser.info/post/93108308634/2014-07-28-js-browserify-5-0-0-angularjs","date":"2014-07-28T22:02:22+09:00","content":"JSer.info #185 - Node.jsスタイルで書いモジュールをブラウザでも動かせる...","category":"JSer","tags":["browser","browserify","angularjs","security"]},{"title":"JSer.infoをTumblrからGitHub Pagesに移行しました","url":"http://jser.info/2014/08/03/renewal/","date":"2014-08-03T00:00:00+09:00","content":"JSer.info を Tumblr から Jekyllベースのブログへと移行しました。ドメイ...","category":"雑記","tags":["Jekyll","GitHub"]},{"title":"2014-08-04のJS: traceur-compiler入門、Eloquent JavaScript第二版","url":"http://jser.info/2014/08/04/traceur-eloquentjavascript/","date":"2014-08-04T00:00:00+09:00","content":"JSer.info #186 - traceur-compiler 入門 - from scr...","category":"JSer","tags":["ES6","traceur","book","JSer.info"]},{"title":"2014-08-11のJS: WebStorm 9 EAP、Server Sent Events、IEのサポートサイクル","url":"http://jser.info/2014/08/11/WebStorm9EAP-SSE-IE/","date":"2014-08-11T00:00:00+09:00","content":"JSer.info #187 - WebStorm 9 EAP(Early Access Pr...","category":"JSer","tags":["JavaScript","WebStorm","SSE","IE","Windows"]},{"title":"2014-08-19のJS: Sass 3.4、Compass 1.0、IE11/F12開発者ツール","url":"http://jser.info/2014/08/19/sass-compass-ie11/","date":"2014-08-19T00:00:00+09:00","content":"JSer.info #188 - Sass 3.4がリリースされました。parent sele...","category":"JSer","tags":["JavaScript","Sass","Compass","IE","debug"]},{"title":"2014-08-25のJS: Autoprefixer 3.0、JavaScriptのオブジェクト、Next Component","url":"http://jser.info/2014/08/25/autoprefixer-js-object/","date":"2014-08-25T22:09:00+09:00","content":"JSer.info #189 - CSSファイルに対してvendor prefixを付加できる...","category":"JSer","tags":["CSS","JavaScript","パッケージ管理","Components"]},{"title":"2014-09-01のJS: Underscore 1.7.0、Browserify入門、Gravit","url":"http://jser.info/2014/09/01/underscore-browserify-Gravit/","date":"2014-09-01T08:19:00+09:00","content":"JSer.info #190 - Underscore 1.7.0がリリースされました。破壊的...","category":"JSer","tags":["JavaScript","Broserify","Design","software","node-webkit"]},{"title":"2014-09-08のJS: Chrome 37/Opera 24、Firefox 32、ESLint 0.8.0","url":"http://jser.info/2014/09/08/chrome-opera-firefox-eslint/","date":"2014-09-08T21:38:00+09:00","content":"JSer.info #191 - Chrome 37とOpera 24(Chromium 37...","category":"JSer","tags":["Chrome","Opera","Firefox","AST","ECMAScript"]},{"title":"2014-09-15のJS: JavaScriptエンジンの最適化、ビルドツールBroccoli","url":"http://jser.info/2014/09/15/v8-react-broccoli/","date":"2014-09-15T21:24:00+09:00","content":"JSer.info #192 - 今週はnodeconfeuがあったのと、自分でも最適化につい...","category":"JSer","tags":["JavaScript","V8","ビルド","Tools","イベント","Performance"]},{"title":"2014-09-23のJS: npm 2.0.0、iOS8 WKWebView、Node.jsとPromise","url":"http://jser.info/2014/09/23/npm2-ios8-promises/","date":"2014-09-23T16:58:00+09:00","content":"JSer.info #193 - Node.jsのパッケージ管理ツールであるnpm 2.0.0...","category":"JSer","tags":["node.js","npm","iOS","Promises"]},{"title":"2014-09-30のJS: Gruntの現在と未来、React.js、The Mobile Web Handbook","url":"http://jser.info/2014/09/30/grunt-react-mobile/","date":"2014-09-30T22:36:00+09:00","content":"JSer.info #194 - The State of Gruntというスライドでは、Gr...","category":"JSer","tags":["JavaScript","Grunt","React","Flux"]},{"title":"JSer.info 200回記念イベントを11月1日に行います","url":"http://jser.info/events/jser200","date":"2014-10-06T12:00:00+09:00","content":"JSer.info 大体200回目を記念した11月1日(土)にイベントを行います。JSer.i...","category":"","tags":["JavaScript","イベント"]},{"title":"2014-10-06のJS: localForage 1.0.0、Promises API、FluxとReactとBackbone.js","url":"http://jser.info/2014/10/06/promise-flux-react-backbone/","date":"2014-10-06T19:59:00+09:00","content":"JSer.info #195 - IndexedDBやWebSQLやlocalStorage等...","category":"JSer","tags":["JavaScript","Promise","localstorage","Flux","React","Backbone.js"]},{"title":"2014-10-14のJS: Chrome 38リリース、ES6をES5へお手軽に変換","url":"http://jser.info/2014/10/14/chrome38-es6to5/","date":"2014-10-14T19:40:00+09:00","content":"JSer.info #196 - Chrome 38のStable版がリリースされました。Ch...","category":"JSer","tags":["Chrome","ECMAScript","Tools"]},{"title":"2014-10-20のJS: Firefox 33、Reactとは何か、FormatJS","url":"http://jser.info/2014/10/19/firefox33-react-formatjs/","date":"2014-10-19T23:31:00+09:00","content":"JSer.info #197 - Firefox 33.0がリリースされました。Chromeや...","category":"JSer","tags":["Firefox","React","i18n","library"]},{"title":"2014-10-27のJS: WebStorm 9、ESLint 0.9.0、AngularJS 2.0とAtScript","url":"http://jser.info/2014/10/27/webstorm9-eslint-atscript/","date":"2014-10-27T19:41:00+09:00","content":"JSer.info #198 - WebStorm 9がリリースされました。新たにMeteor...","category":"JSer","tags":["WebStorm","IDE","Lint","Tools","TypeScript","AngularJS"]},{"title":"2014-11-02のJS: Bootstrap 3.3.0、CSP Lv.2、Object.observe()の未来","url":"http://jser.info/2014/11/02/bootstrap3.3.0-csplv2-object.observe/","date":"2014-11-02T17:35:00+09:00","content":"JSer.info #199 - Bootstrap 3.3.0がリリースされました。tran...","category":"JSer","tags":["CSS","CSP","セキュリティ","JavaScript","MVC","React"]},{"title":"JSer.info 200回記念イベントを開催しました","url":"http://jser.info/2014/11/02/jser200/","date":"2014-11-02T19:26:00+09:00","content":"JSer.info #200 - 11月1日に大体200回目の投稿を記念するという名目でJSe...","category":"JSer","tags":["JSer","JavaScript","イベント"]},{"title":"2014-11-10のJS: Less 2.0、Vue.js 0.11、Model-View-Intent","url":"http://jser.info/2014/11/10/less2-vue-mvi/","date":"2014-11-10T20:46:00+09:00","content":"JSer.info #201 - CSSプリプロセッサであるLess 2.0がリリースされまし...","category":"JSer","tags":["Less","CSS","Vue.js","VirtualDOM"]},{"title":"2014-11-17のJS: IEプレビュー版のES6サポート、Jasmine 2.1.0、TypeScript 1.3","url":"http://jser.info/2014/11/17/ie11-es6-jasmine/","date":"2014-11-17T21:17:00+09:00","content":"JSer.info #202 - Windows 10の新しいプレビュー版が公開されたため、I...","category":"JSer","tags":["IE","ES6","Testing"]},{"title":"2014-11-25のJS: Chrome 39、デバッグTips、Facebook Flow","url":"http://jser.info/2014/11/25/chrome39-debug-flowtype/","date":"2014-11-25T08:12:00+09:00","content":"JSer.info #203 - Chrome 39がリリースされました。実装された機能などに...","category":"JSer","tags":["Chrome","debug","Flow","Type"]},{"title":"2014-12-02のJS: JavaScript開発者アンケート、フレームワーク or ライブラリ、関数型プログラミング","url":"http://jser.info/2014/12/02/survey-framework-library-functional-js/","date":"2014-12-02T09:47:00+09:00","content":"JSer.info #204 - 今年もDailyJSによるJavaScript開発者向けアン...","category":"JSer","tags":["アンケート","Angular","JavaScript","library"]},{"title":"2014-12-08のJS: Firefox 34、QUnit 1.16、ES7 Async Generator","url":"http://jser.info/2014/12/08/firefox-qunit-es7-async/","date":"2014-12-08T19:47:00+09:00","content":"JSer.info #205 - Firefo 34.0がリリースされました。Firefox開...","category":"JSer","tags":["Firefox","testing","webpack","ES7","非同期"]},{"title":"2014-12-16のJS: ES6 Proxy、Web Components、Service Worker","url":"http://jser.info/2014/12/16/es6proxy-serviceworker/","date":"2014-12-16T22:00:00+09:00","content":"JSer.info #206 - Meta programming with ECMAScri...","category":"JSer","tags":["ES6","WebComponents","ServiceWorker"]},{"title":"2014-12-23のJS: 開発者アンケート結果、Protractorの仕組み、パフォーマンスチューニング","url":"http://jser.info/2014/12/23/survey2014-protractor-performance/","date":"2014-12-23T18:26:00+09:00","content":"JSer.info #207 - DailyJSが毎年この時期にやっているアンケートであるJa...","category":"JSer","tags":["アンケート","E2E","Performance","JavaScript","Angular"]},{"title":"2014-12-30のJS: jsdom 2.0.0、6to5 2.0.0、HTMLBars","url":"http://jser.info/2014/12/30/jsdom-6to5-htmlbars/","date":"2014-12-30T22:54:00+09:00","content":"JSer.info #208 - DOMのJavaScript実装(Node.jsでも動くDO...","category":"JSer","tags":["JavaScript","DOM","ECMAScript","テンプレート"]},{"title":"2015-01-06のJS: ESLint 0.11.0、Browserifyとwebpack、TypeScriptの本","url":"http://jser.info/2015/01/06/eslint0.11-browserify-webpack-typescript/","date":"2015-01-06T22:24:00+09:00","content":"JSer.info #209 - JavaScript LintツールであるESLint 0....","category":"JSer","tags":["JavaScript","Lint","tools","Browserify","webpack","TypeScript"]},{"title":"2015-01-13のJS: 6to5、ES6とjspm、リファクタリングJavaScript","url":"http://jser.info/2015/01/13/6to5-jspm-refactoring-javascript/","date":"2015-01-13T21:44:00+09:00","content":"JSer.info #210 - ES6+のコードをES5に変換するツールである6to5の公式...","category":"JSer","tags":["ES6","リファクタリング","JavaScript","modules"]},{"title":"JSer.info 4周年","url":"http://jser.info/2015/01/16/4-years/","date":"2015-01-16T07:35:00+09:00","content":"今日でJSer.infoは4周年です。この一年の間に、Ju U-YeongさんによるJSer....","category":"雑記","tags":["JavaScript"]},{"title":"2015-01-20のJS: TypeScript 1.4、io.js 1.0、bluebird 2.7のglobal rejection events","url":"http://jser.info/2015/01/20/typescript1.4-iojs-bluebird2.7/","date":"2015-01-20T22:24:00+09:00","content":"JSer.info #211 - TypeScript 1.4がリリースされました。以前Typ...","category":"JSer","tags":["TypeScript","Node.js","io.js","Promise","library"]},{"title":"2015-01-28のJS: Vivaldi、lodash 3.0.0、JavaScriptテスト概要","url":"http://jser.info/2015/01/28/vivaldi-lodash3-js-tests/","date":"2015-01-28T00:14:00+09:00","content":"JSer.info #212 - 元OperaのCEOによるChromiumベースのブラウザで...","category":"JSer","tags":["Browser","Opera","library","Testing"]},{"title":"2015-02-02のJS: 6to5 Ver3.0、CoffeeScript 1.9.0、PhantomJS 2.0","url":"http://jser.info/2015/02/02/6to5-coffeescript-phantomjs/","date":"2015-02-02T20:09:00+09:00","content":"JSer.info #213 - ES6+αのコードをES5へ変換するツールである6to5のV...","category":"JSer","tags":["ES6","CoffeeScript","webkit"]},{"title":"2015-02-09のJS: Node v0.12.0、Esprima 2.0、CSS Reference","url":"http://jser.info/2015/02/09/nodejs-0.12-esprima2.0-css-reference/","date":"2015-02-09T19:38:00+09:00","content":"JSer.info #214 - ついにNode v0.12.0がリリースされました。最近では...","category":"JSer","tags":["Node.js","AST","JavaScript","CSS","リファレンス"]},{"title":"2015-02-17のJS: Babel(6to5)、BrowserSync 2.0、Flux実装比較","url":"http://jser.info/2015/02/17/6to5-to-babel-browsersync-flux/","date":"2015-02-17T00:00:00+09:00","content":"JSer.info #215 - ES6+のコードをES5に変換するツールである6to5がBa...","category":"JSer","tags":["Tools","ES6","Flux","library"]},{"title":"2015-02-23のJS: Underscore.js 1.8.0、CodeMirror 5.0、Web Audio入門","url":"http://jser.info/2015/02/23/underscore1.8-codemirror5.0-web-audio-api/","date":"2015-02-23T22:21:00+09:00","content":"JSer.info #216 - Underscore.js 1.8.0がリリースされています...","category":"JSer","tags":["JavaScript","library","Editor","WebAudio"]},{"title":"2015-03-02のJS: Firefox 36.0、ASTのコミュニティ標準、Service Worker","url":"http://jser.info/2015/03/02/firefox36-ast-serviceworker/","date":"2015-03-02T22:32:00+09:00","content":"JSer.info #217 - Firefox 36.0がリリースされました。CSSの機能追...","category":"JSer","tags":["JavaScript","Firefox","AST","ServiceWorker"]},{"title":"2015-03-09のJS: ESLint 0.16.0、AtScript is TypeScript","url":"http://jser.info/2015/03/09/eslint0.16-atscript-is-typescript/","date":"2015-03-09T20:58:00+09:00","content":"JSer.info #218 - ESLint 0.16.0がリリースされました。ESLint...","category":"JSer","tags":["ECMAScript","AtScript","TypeScript"]},{"title":"2015-03-16のJS: React v0.13、Chrome 42β、モダンJavaScriptの歴史","url":"http://jser.info/2015/03/16/react0.13-chrome42beta-modern-js-hisotory/","date":"2015-03-16T22:31:00+09:00","content":"JSer.info #219 - React v0.13がリリースされました。React.Co...","category":"JSer","tags":["React","Chrome","history"]},{"title":"2015-03-23のJS: IEのアップデート、RxJS入門、Chrome DevToolsの新機能と計測の仕方","url":"http://jser.info/2015/03/23/ie-rxjs-chrome-devtools/","date":"2015-03-23T22:49:00+09:00","content":"JSer.info #220 - Windows 10 Technical Previewがア...","category":"JSer","tags":["IE","Chrome","debug","performance"]},{"title":"2015-03-31のJS: Dart to JS、ES6 Generator、Reactでシングルページアプリケーション作成","url":"http://jser.info/2015/03/31/dart-generator-react-tutorial/","date":"2015-03-31T22:04:00+09:00","content":"JSer.info #221 - DartをChromeに載せることは諦めて、DartをJav...","category":"JSer","tags":["Dart","ES6","React","tutorial"]},{"title":"2015-04-06のJS: Babel 5.0.0と次期ECMAScript、Bower 1.4.0、JSCSと自動整形","url":"http://jser.info/2015/04/06/babel5-bower-jscs/","date":"2015-04-06T22:53:00+09:00","content":"JSer.info #222 - ES6+のコードをES5相当に変換するツールであるBabel...","category":"JSer","tags":["JavaScript","ECMAScript","Bower","tool"]},{"title":"2015-04-14のJS: 初代jQueryをコードリーディング、npmのエコシステムとプロトタイピング","url":"http://jser.info/2015/04/14/jQuery-origin/","date":"2015-04-14T23:06:00+09:00","content":"JSer.info #223 - John Resig - Annotated Version...","category":"JSer","tags":["jQuery","コードリーディング","npm","GitHub"]},{"title":"2015-04-20のJS: ECMAScript6最終ドラフト、JavaScriptトレーニング","url":"http://jser.info/2015/04/20/es6-final-draft-js-traning/","date":"2015-04-20T22:12:00+09:00","content":"JSer.info #224 - 次期ECMAScriptであるES6 Rev 38 Fina...","category":"JSer","tags":["ECMAScript","JavaScript","tutorial"]},{"title":"2015-04-29のJS: Globalize 1.0、Flux実装、Code Smellsの検出","url":"http://jser.info/2015/04/29/globalize-flux-code-smells/","date":"2015-04-29T23:17:00+09:00","content":"JSer.info #225 - CLDRベースの国際化対応ライブラリであるjquery/gl...","category":"JSer","tags":["i18n","Flux","JavaScript"]},{"title":"2015-05-06のJS: io.js 2.0.0、Microsoft Edge、Isomorphic","url":"http://jser.info/2015/05/06/iojs2.0.0-msedge-isomorphic/","date":"2015-05-06T22:09:00+09:00","content":"JSer.info #226 - Node.jsのforkであるio.js 2.0.0がリリー...","category":"JSer","tags":["Node.js","io.js","ECMAScript","MS","IE"]},{"title":"2015-05-12のJS: ECMAScript 2015(ES6)入門、最近のnpmの変更点を見る","url":"http://jser.info/2015/05/12/ecmascript2015-npm/","date":"2015-05-12T19:21:00+09:00","content":"JSer.info #227 - Rubyist Magazine - 2015 年の Jav...","category":"JSer","tags":["ES6","ECMAScript","npm","Node.js"]},{"title":"2015-05-19のJS: Firefox 38、Backbone.js 1.2.0、マイクロベンチマークの問題","url":"http://jser.info/2015/05/19/firefox38-babel-bench/","date":"2015-05-19T23:03:00+09:00","content":"JSer.info #228 - Firefox 38.0がリリースされました。タブやウィンド...","category":"JSer","tags":["Firefox","Backbone","MVC","V8","ベンチマーク"]},{"title":"2015-05-27のJS: Promiseのありがちな間違い、AngularJS 2に向けて、Plain JS","url":"http://jser.info/2015/05/27/promise-angular2/","date":"2015-05-27T22:12:00+09:00","content":"JSer.info #229 - We have a problem with promise...","category":"JSer","tags":["Promise","AngularJS","DOM","jQuery"]},{"title":"2015-06-02のJS: AngularJS 1.4.0、Polymer 1.0リリース、今後のJSの流れ","url":"http://jser.info/2015/06/02/Angular1.4.0-Polymer1.0/","date":"2015-06-02T19:32:00+09:00","content":"JSer.info #230 - AngularJS 1.4.0がリリースされました。ngAn...","category":"JSer","tags":["Angular","WebComponents"]},{"title":"JSer.infoについて","url":"http://jser.info/about/","date":"2015-06-10T00:00:00+09:00","content":"このサイトについて。JSer.infoは世界中言語問わずJavaScriptの情報を紹介してい...","category":"meta","tags":[]},{"title":"2015-06-10のJS: ブラウザとES6の状況、Web Audio APIチュートリアル","url":"http://jser.info/2015/06/10/es6-status-webaudio/","date":"2015-06-10T12:45:00+09:00","content":"JSer.info #231 - Safari 9.0の変更点が公開されています。JavaSc...","category":"JSer","tags":["WebAudio","ES6","Safari","Chrome","MSEdge"]},{"title":"2015-06-16のJS: Vue.js 0.12、Exploring ES6、2015年のJavaScriptの流れ","url":"http://jser.info/2015/06/16/vue0.12-exploring-es6-2015/","date":"2015-06-16T22:00:00+09:00","content":"JSer.info #232 - MVVMライブラリであるVue.js 0.12がリリースされ...","category":"JSer","tags":["ES6","book","JSer","Vue","MVVM"]},{"title":"2015-06-23のJS: ECMAScript 6公開、SVGガイド、JSConf US 2015","url":"http://jser.info/2015/06/23/es6-svg-jsconfus/","date":"2015-06-23T21:06:00+09:00","content":"JSer.info #233 - ECMAScript 2015(aka. ES6)がEcma...","category":"JSer","tags":["ES6","Promise","SVG","動画"]},{"title":"2015-06-30のJS: Ember Data Stableリリース、JavaScriptアンケート","url":"http://jser.info/2015/06/30/ember-data-survey/","date":"2015-06-30T20:28:00+09:00","content":"JSer.info #234 - Ember DataがついにStableリリースされました。...","category":"JSer","tags":["Ember","アンケート","JavaScript","ECMAScript"]},{"title":"2015-07-06のJS: React v0.14 Beta 1、Firefox 39、ES6アンケート結果","url":"http://jser.info/2015/07/06/react-0.14-firefox39-es6/","date":"2015-07-06T22:23:00+09:00","content":"JSer.info #235 - React v0.14 Beta 1がリリースされました。大...","category":"JSer","tags":["React","Firefox","JSer.info"]},{"title":"JSHint: A Formal Commitment to New Language Features","url":"http://jser.info/2015/07/11/jshint-new-lang-features/","date":"2015-07-11T14:53:00+09:00","content":"A Formal Commitment to New Language FeaturesJSH...","category":"JavaScript","tags":["JSHint","ECMAScript","ES.next","community"]},{"title":"2015-07-14のJS: jQuery 3.0αリリース、JSHintとES.next","url":"http://jser.info/2015/07/14/jquery3.0-jshint-esnext/","date":"2015-07-14T22:40:00+09:00","content":"JSer.info #236 - jQuery 3.0αがリリースされました。jQuery 3...","category":"JSer","tags":["jQuery","ECMAScript","JSHint","Lint"]},{"title":"2015-07-21のJS: TypeScript 1.5、Web Components概要、ブラウザの情報源","url":"http://jser.info/2015/07/21/typescript1.5-webcomponents-browser/","date":"2015-07-21T22:54:00+09:00","content":"JSer.info #237 -  TypeScript 1.5がリリースされました。Anno...","category":"JSer","tags":["TypeScript","WebCompoents","Browser"]},{"title":"2015-07-28のJS: Chrome 45β、ES6チュートリアル、Chrome開発者ツール本","url":"http://jser.info/2015/07/28/chrome45-es6-devtools/","date":"2015-07-28T23:11:00+09:00","content":"JSer.info #238 - Chrome 45 Betaがリリースされました。Chrom...","category":"JSer","tags":["Chrome","ES6","debug"]},{"title":"2015-08-03のJS: ESLint 1.0.0、JSCS 2.0.0、Esprima 2.5.0","url":"http://jser.info/2015/08/03/eslint-jscs-esprima/","date":"2015-08-03T21:52:00+09:00","content":"JSer.info #239 - JavaScript LintツールであるESLint 1....","category":"JSer","tags":["Lint","Tool","AST","ES6","JavaScript"]},{"title":"2015-08-10のJS: io.js 3.0、RxJS 3.0、MSEdgeとは","url":"http://jser.info/2015/08/10/io.js3.0-rxjs3.0-msedge/","date":"2015-08-10T22:23:00+09:00","content":"JSer.info #240 - io.js 3.0.0がリリースされました。V8 4.4.6...","category":"JSer","tags":["io.js","Rx","MSEdge"]},{"title":"2015-08-17のJS: Redux 1.0.0、flux-utils、Firefox 40","url":"http://jser.info/2015/08/17/redux-flux-utils-firefox40/","date":"2015-08-17T20:21:00+09:00","content":"JSer.info #241 - Fluxのように単方向データの流れを行うフレームワークである...","category":"JSer","tags":["flux","library","firefox"]},{"title":"2015-08-24のJS: Bootstrap 4α、PostCSS 5.0、Node.jsとio.js","url":"http://jser.info/2015/08/24/bootstrap-postcss-node-iojs/","date":"2015-08-24T22:00:00+09:00","content":"JSer.info #242 - CSSフレームワークであるBootstrap 4 alpha...","category":"JSer","tags":["CSS","bootstrap","Node.js","io.js","community"]},{"title":"JSer.infoのロゴやアイコンを更新しました","url":"http://jser.info/2015/08/26/update-logo/","date":"2015-08-26T09:48:00+09:00","content":"JSer.infoのロゴやTwitterのアイコンを更新しました。Tweets by @jse...","category":"other","tags":["JSer.info"]},{"title":"2015-09-02のJS: MSEdgeとasm.js、単方向データフローのアーキテクチャ、CSS仕様書の読み方","url":"http://jser.info/2015/09/02/msedge-unidirectional-architectures-read-css/","date":"2015-09-02T21:38:00+09:00","content":"JSer.info #243 - Windows 10 Build 10532が公開され付属す...","category":"JSer","tags":["Flux","MVC","MSEdge","CSS","Spec"]},{"title":"2015-09-09のJS: Node.js 4.0.0、TypeScript 1.6β、React 0.14の変更点","url":"http://jser.info/2015/09/09/node4.0.0-typescript1.6beta-react/","date":"2015-09-09T23:16:00+09:00","content":"JSer.info #244 - Node.js 4.0.0がリリースされました。Node v...","category":"JSer","tags":["Node.js","io.js","TypeScript","React"]},{"title":"2015-09-16のJS: React 0.14 RC、ESLint 1.4.0、改めてECMAScript 5","url":"http://jser.info/2015/09/16/react-0.14-eslint-1.4-es5/","date":"2015-09-16T19:00:00+09:00","content":"JSer.info #245 - React 0.14 RCがリリースされました。React ...","category":"JSer","tags":["React","ESLint","Lint","ES5"]},{"title":"2015-09-25のJS: Firefox 41.0、npm 3.x stableリリース、XRegExp 3.0.0","url":"http://jser.info/2015/09/25/firefox41-npm3-xregexp3/","date":"2015-09-25T15:18:00+09:00","content":"JSer.info #246 - Firefox 41.0がリリースされました。Firefox...","category":"JSer","tags":["Firefox","npm","node","regexp","library"]},{"title":"2015-09-29のJS: Redux 3.0リリース、JavaScriptのライブラリを公開する方法","url":"http://jser.info/2015/09/29/redux3.0-js-library/","date":"2015-09-29T22:08:00+09:00","content":"JSer.info #247 - Redux v3.0.0がリリースされました。v3.0.0で...","category":"JSer","tags":["Redux","Flux","library","GitHub","JavaScript"]},{"title":"2015-10-08のJS: React 0.14、ESLintの使い方、ES6の末尾呼び出し最適化","url":"http://jser.info/2015/10/08/react0.14-eslint-tail-call/","date":"2015-10-08T22:51:00+09:00","content":"JSer.info #248 - React v0.14が正式リリースされました。reactと...","category":"JSer","tags":["React","ESLint","ES6"]},{"title":"2015-10-16のJS: Node.js 4.2.0 LTS、ES6、CSS.next","url":"http://jser.info/2015/10/16/node-lts-es6-js-css-next/","date":"2015-10-16T22:22:00+09:00","content":"JSer.info #249 - Node.js 4.2.0がリリースされました。このバージョ...","category":"JSer","tags":["Node.js","ES6","CSS","JavaScript"]},{"title":"2015-10-25のJS: ESLint入門、ECMAScriptとは何か?、rollupとES6 modules","url":"http://jser.info/2015/10/25/eslint-ecmascript-rollup/","date":"2015-10-25T20:20:00+09:00","content":"JSer.info #250 - ESLint v1.7.0がリリースされました。.eslin...","category":"JSer","tags":["ESLint","ECMAScript","Bundle","Browserify","rollup"]},{"title":"2015-11-03のJS: Vue.js 1.0.0、Babel 6.0、Node.js 5.0","url":"http://jser.info/2015/11/03/vue1.0-babel6.0-node5.0/","date":"2015-11-03T19:16:00+09:00","content":"JSer.info #251 - Vue.js 1.0.0がリリースされました。0.12.16...","category":"JSer","tags":["Vue","Babel","Node.js"]},{"title":"2015-11-09のJS: 巨大なJavaScriptのリファクタリング、Firefox 44の開発者ツール","url":"http://jser.info/2015/11/09/large-refactoring-firefox44/","date":"2015-11-09T22:03:00+09:00","content":"JSer.info #252 - フロントエンドに秩序を取り戻す方法 // Speaker D...","category":"JSer","tags":["JavaScript","Firefox","debug"]},{"title":"2015-11-16のJS: ECMAScript 2016(ES7)って何、WindowsでのNode.js入門","url":"http://jser.info/2015/11/16/ecmascript-7-ms-node-js/","date":"2015-11-16T22:49:00+09:00","content":"JSer.info #253 - What’s in ECMAScript 2016 (ES7...","category":"JSer","tags":["ECMAScript","ES.next","MS","Node.js"]},{"title":"2015-11-23のJS: JSDoc 3.4.0、Grunt/Bowerの今後、JavaScriptトレンド","url":"http://jser.info/2015/11/23/jsdoc3.4.0-grunt-bower-js-trends/","date":"2015-11-23T20:40:00+09:00","content":"JSer.info #254 - JSDoc 3.4.0がリリースされました。jsdoc/CH...","category":"JSer","tags":["JSDoc","Grunt","Bower","JSer"]},{"title":"2015-12-01のJS: EdgeHTML 13、TypeScript 1.7、Progressive Web Apps","url":"http://jser.info/2015/12/01/edgehtml13-typescript1.7-prgressive-webapps/","date":"2015-12-01T21:05:00+09:00","content":"JSer.info #255 - Introducing EdgeHTML 13, our f...","category":"JSer","tags":["TypeScript","MSEdge","Progressive"]},{"title":"2015-12-07のJS: Jasmine 2.4.0、Redux入門、Firefox Platform Status","url":"http://jser.info/2015/12/07/jasmine2.4-redux-firefox/","date":"2015-12-07T20:20:00+09:00","content":"JSer.info #256 - Jasmine 2.4.0がリリースされました。テストをラン...","category":"JSer","tags":["Jasmine","Testing","Redux","Firefox","Browser"]},{"title":"JSer.info 5周年記念イベントを1/16(土)に開催します","url":"http://jser.info/2015/12/14/jser-info-announce-5-years/","date":"2015-12-14T21:53:00+09:00","content":"2011年01月16日にJSer.infoを開始してから、後ちょっとで丸5年になります。その辺...","category":"イベント","tags":["JSer"]}]
},{}],36:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsJSerItem = require("./models/JSerItem");

var _modelsJSerItem2 = _interopRequireDefault(_modelsJSerItem);

var _modelsJSerPost = require("./models/JSerPost");

var _modelsJSerPost2 = _interopRequireDefault(_modelsJSerPost);

var _modelsJSerWeek = require("./models/JSerWeek");

var _modelsJSerWeek2 = _interopRequireDefault(_modelsJSerWeek);

var _algoAlgoItem = require("./algo/AlgoItem");

var _algoAlgoItem2 = _interopRequireDefault(_algoAlgoItem);

var _algoAlgoPostJs = require("./algo/AlgoPost.js");

var _algoAlgoPostJs2 = _interopRequireDefault(_algoAlgoPostJs);

var _naturalNaturalSearcher = require("./natural/NaturalSearcher");

var _naturalNaturalSearcher2 = _interopRequireDefault(_naturalNaturalSearcher);

require('array.prototype.find');

function filterJSerCategory(article) {
    return (/jser/i.test(article.category)
    );
}

var JSerStat = (function () {
    function JSerStat(rawItems, rawPosts) {
        _classCallCheck(this, JSerStat);

        this._rawItems = rawItems;
        this._rawPosts = rawPosts;
        /** @type {JSerItem[]} */
        this.items = this._rawItems.map(function (item) {
            return new _modelsJSerItem2["default"](item);
        });
        // JSer カテゴリだけにする
        /** @type {JSerPost[]} */
        this.posts = this._rawPosts.filter(filterJSerCategory).map(function (post, index) {
            return new _modelsJSerPost2["default"](index + 1, post);
        });
        /**
         *
         * @type {JSerWeek[]}
         * @private
         */
        this._weeks = [];
        /**
         *  @type {AlgoItem}
         *  @private
         **/
        this._algoItem = new _algoAlgoItem2["default"](this.items);
        /**
         * @type {AlgoPost}
         * @private
         */
        this._algoPost = new _algoAlgoPostJs2["default"](this.posts);
        /**
         * @type {NaturalSearcher}
         */
        this.naturalSearch = null;
    }

    /**
     * 全部で何週あるかを返す(投稿記事の数と一致)
     * @returns {number}
     */

    JSerStat.prototype.getTotalWeekCount = function getTotalWeekCount() {
        return this.posts.length;
    };

    /**
     * beginからendの範囲のJSerItemの配列を返す
     * @param {Date} beginDate
     * @param {Date} endDate
     * @returns {JSerItem[]}
     */

    JSerStat.prototype.findItemsBetween = function findItemsBetween(beginDate, endDate) {
        return this._algoItem.findItemsBetween(beginDate, endDate);
    };

    // deprecated

    JSerStat.prototype.getItemsBetWeen = function getItemsBetWeen(beginDate, endDate) {
        return this.findItemsBetween(beginDate, endDate);
    };

    /**
     * 全てのJSerWeekの配列を返す
     * @returns {JSerWeek[]}
     */

    JSerStat.prototype.getJSerWeeks = function getJSerWeeks() {
        var _this = this;

        if (this._weeks.length === 0) {
            this._weeks = this.posts.reduce(function (results, currentPost, index) {
                var prevPost = _this.posts[index - 1];
                var jserWeek = new _modelsJSerWeek2["default"](currentPost, prevPost, _this._algoItem);
                results.push(jserWeek);
                return results;
            }, []);
        }
        return this._weeks;
    };

    /**
     * beginからendの範囲のJSerWeekの配列を返す
     * @param {Date} beginDate
     * @param {Date} endDate
     * @returns {JSerWeek[]}
     */

    JSerStat.prototype.findJSerWeeksBetween = function findJSerWeeksBetween(beginDate, endDate) {
        var _this2 = this;

        var algoPost = this._algoPost;
        var posts = algoPost.findPostsBetween(beginDate, endDate);
        return posts.reduce(function (results, currentPost, index) {
            var prevPost = _this2.posts[index - 1];
            var jserWeek = new _modelsJSerWeek2["default"](currentPost, prevPost, _this2._algoItem);
            results.push(jserWeek);
            return results;
        }, []);
    };

    // deprecated

    JSerStat.prototype.getJSerWeeksBetWeen = function getJSerWeeksBetWeen(beginDate, endDate) {
        return this.findJSerWeeksBetween(beginDate, endDate);
    };

    /**
     * JSer.info #xxx を返す
     * @param {number} number number start with 1
     * @returns {JSerWeek}
     */

    JSerStat.prototype.findJSerWeek = function findJSerWeek(number) {
        if (number <= 0) {
            throw new Error("number:" + number + " should be >= 1");
        }
        if (number > this.posts.length) {
            return null;
        }
        var targetPost = this.posts[number - 1];
        var prevPost = this.posts[number - 2];
        return new _modelsJSerWeek2["default"](targetPost, prevPost, this._algoItem);
    };

    // deprecated

    JSerStat.prototype.getJSerWeek = function getJSerWeek(number) {
        return this.findJSerWeek(number);
    };

    /**
     * JSerItemを含んでいるJSerWeekを検索して返す.
     * @param {Object} jserItem the jserItem is raw object for JSerItem
     * @return {JSerWeek|null} The week contain this jserItem.
     * 未来の記事などJSerWeekに所属していない場合もある
     */

    JSerStat.prototype.findWeekWithItem = function findWeekWithItem(jserItem) {
        var targetItem = new _modelsJSerItem2["default"](jserItem);
        var tenDaysAfter = new Date(targetItem.date);
        tenDaysAfter.setDate(targetItem.date.getDate() + 12);
        var jSerWeeks = this.findJSerWeeksBetween(targetItem.date, tenDaysAfter);
        return jSerWeeks.find(function (week) {
            if (week.post.date < targetItem.date) {
                return false;
            }
            return week.items.some(function (item) {
                return targetItem.isEqualItem(item);
            });
        });
    };

    /**
     * URLとマッチするJSerItemを返す
     * @param {string} URL
     * @return {JSerItem}
     */

    JSerStat.prototype.findItemWithURL = function findItemWithURL(URL) {
        return this.items.find(function (item) {
            return item.url === URL;
        });
    };

    /**
     * `item` と関連するJSerItemの配列を返す
     * @param {JSerItem} item
     * @param {number} limit
     * @returns {JSerItem[]}
     */

    JSerStat.prototype.findRelatedItems = function findRelatedItems(item) {
        var limit = arguments.length <= 1 || arguments[1] === undefined ? 10 : arguments[1];

        if (this.naturalSearch == null) {
            this.naturalSearch = new _naturalNaturalSearcher2["default"](this.items);
        }
        return this.naturalSearch.findRelatedItems(item, limit);
    };

    return JSerStat;
})();

exports["default"] = JSerStat;
module.exports = exports["default"];

},{"./algo/AlgoItem":37,"./algo/AlgoPost.js":38,"./models/JSerItem":42,"./models/JSerPost":44,"./models/JSerWeek":45,"./natural/NaturalSearcher":46,"array.prototype.find":2}],37:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _algoSearchJs = require("./algoSearch.js");

// for algorithm

var AlgoItem = (function () {
    /**
     *
     * @param {JSerItem[]} items
     */

    function AlgoItem(items) {
        _classCallCheck(this, AlgoItem);

        this.items = items;
        /**
         * @type number[] 昇順となった各Itemのtime配列
         */
        this.itemTimes = items.map(function (item) {
            return item.date.getTime();
        });
    }

    /**
     *
     * @param {Date} beginDate
     * @param {Date} endDate
     * @returns {JSerItem[]}
     */

    AlgoItem.prototype.findItemsBetween = function findItemsBetween(beginDate, endDate) {
        var indexes = _algoSearchJs.findIndexesBetween(this.itemTimes, beginDate, endDate);
        var first = indexes[0];
        var last = indexes[indexes.length - 1];
        if (indexes.length === 0) {
            return [];
        }
        if (first > last) {
            return [];
        }
        return this.items.slice(first, last + 1);
    };

    return AlgoItem;
})();

exports["default"] = AlgoItem;
module.exports = exports["default"];

},{"./algoSearch.js":39}],38:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _algoSearchJs = require("./algoSearch.js");

// for algorithm

var AlgoPost = (function () {
    /**
     *
     * @param {JSerPost[]} posts
     */

    function AlgoPost(posts) {
        _classCallCheck(this, AlgoPost);

        this.posts = posts;
        /**
         * @type number[] 昇順となった各Postのtime配列
         */
        this.postTimeIndex = posts.map(function (post) {
            return post.date.getTime();
        });
    }

    /**
     *
     * @param {Date} beginDate
     * @param {Date} endDate
     * @returns {JSerPost[]}
     */

    AlgoPost.prototype.findPostsBetween = function findPostsBetween(beginDate, endDate) {
        var indexes = _algoSearchJs.findIndexesBetween(this.postTimeIndex, beginDate, endDate);
        var first = indexes[0];
        var last = indexes[indexes.length - 1];

        if (indexes.length === 0) {
            return [];
        }
        // [1, 0] or [ 1, -1]
        if (first > last && last <= 0) {
            return [];
        }
        // [1, 10]
        return this.posts.slice(first, last + 1);
    };

    return AlgoPost;
})();

exports["default"] = AlgoPost;
module.exports = exports["default"];

},{"./algoSearch.js":39}],39:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;
exports.findIndexesBetween = findIndexesBetween;
exports.findIndexBiggerTime = findIndexBiggerTime;
exports.findIndexLessTime = findIndexLessTime;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _binarysearch = require("binarysearch");

var _binarysearch2 = _interopRequireDefault(_binarysearch);

function findIndexesBetween(times, beginDate, endDate) {
    var beginTime = beginDate.getTime();
    var endTime = endDate.getTime();
    return _binarysearch2["default"].range(times, beginTime, endTime);
}

function findIndexBiggerTime(array, time) {
    var currentIndex = 0;
    for (var i = currentIndex; i < array.length; i++) {
        var comparedTime = array[i];
        if (time >= comparedTime) {
            currentIndex = i;
        } else {
            // timeより大きいものが出てきたら直前のものを返す
            return currentIndex;
        }
    }
    return -1;
}

function findIndexLessTime(array, time) {
    var currentIndex = array.length - 1;
    for (var i = currentIndex; i >= 0; i--) {
        var comparedTime = array[i];
        if (time < comparedTime) {
            currentIndex = i;
        } else {
            // timeよりも小さいものが出てきたら直前のものを返す
            return currentIndex;
        }
    }
    return -1;
}

function compare_number(a, b) {
    return a - b;
}

},{"binarysearch":5}],40:[function(require,module,exports){
// LICENSE : MIT
"use strict";
module.exports = {
    JSerStat: require("./JSerStat"),
    compute: require("./compute/compute-tags")
};

},{"./JSerStat":36,"./compute/compute-tags":41}],41:[function(require,module,exports){
// LICENSE : MIT
"use strict";
/**
 * {タグ名:出現回数}のオブジェクトを返す
 * @param {JSerWeek[]} weeks
 * @returns {{string:number}}
 */
exports.__esModule = true;
exports.countTagsByGroup = countTagsByGroup;
exports.countByGroup = countByGroup;

function countTagsByGroup(weeks) {
    return countByGroup(weeks, function (item) {
        var rank = {};
        item.tags.forEach(function (tag) {
            rank[tag] = ++rank[tag] || 1;
        });
        return rank;
    });
}

function countByGroup(weeks, countFn) {
    var rank = {};
    weeks.forEach(function (week) {
        week.items.forEach(function (item) {
            var ret = countFn(item);
            var keys = Object.keys(ret);
            keys.forEach(function (key) {
                rank[key] = (rank[key] || 0) + ret[key];
            });
        });
    });
    return rank;
}

},{}],42:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _assert = require("assert");

var _assert2 = _interopRequireDefault(_assert);

var _JSerItemRelatedLink = require("./JSerItemRelatedLink");

var _JSerItemRelatedLink2 = _interopRequireDefault(_JSerItemRelatedLink);

var JSerItem = (function () {
    function JSerItem(item) {
        _classCallCheck(this, JSerItem);

        /** @type {string} */
        this.title = item["title"];
        /** @type {string} */
        this.url = item["url"];
        /** @type {string} */
        this.content = item["content"];
        /** @type {string[]} */
        this.tags = item["tags"] || [];
        /** @type {Date} */
        this.date = new Date(item["date"]);
        var relatedLinks = item["relatedLinks"] || [];
        /** @type {JSerItemRelatedLink[]} */
        this.relatedLinks = relatedLinks.map(function (link) {
            return new _JSerItemRelatedLink2["default"](link);
        });
    }

    /**
     * @param {JSerItem} item
     * @returns {boolean}
     */

    JSerItem.prototype.isEqualItem = function isEqualItem(item) {
        _assert2["default"](item != null, "item should not be null");
        return this.url === item.url;
    };

    return JSerItem;
})();

exports["default"] = JSerItem;
module.exports = exports["default"];

},{"./JSerItemRelatedLink":43,"assert":3}],43:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSerItemRelatedLink = function JSerItemRelatedLink(link) {
    _classCallCheck(this, JSerItemRelatedLink);

    /** @type {string} */
    this.title = link["title"];
    /** @type {string} */
    this.url = link["url"];
};

exports["default"] = JSerItemRelatedLink;
module.exports = exports["default"];

},{}],44:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSerPost = function JSerPost(number, post) {
    _classCallCheck(this, JSerPost);

    /** @type {number} */
    // start with 1
    this.postNumber = number;
    /** @type {string} */
    this.title = post["title"];
    /** @type {string} */
    this.url = post["url"];
    /** @type {string} */
    this.content = post["content"];
    /** @type {string} */
    this.category = post["category"];
    /** @type {Date} */
    this.date = new Date(post["date"]);
    /** @type {string[]} */
    this.tags = post["tags"] || [];
};

exports["default"] = JSerPost;
module.exports = exports["default"];

},{}],45:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSerWeek = (function () {
    function JSerWeek(currentPost, prevPost, algoItem) {
        _classCallCheck(this, JSerWeek);

        /** @type {number} */
        this.weekNumber = currentPost.postNumber;
        /** @type {Date} */
        this.beginDate = prevPost ? prevPost.date : null;
        /** @type {Date} */
        this.endDate = currentPost.date;
        /** @type {JSerPost} */
        this.post = currentPost;
        /** @type {JSerItem[]} */
        this._items = [];
        this._algoItem = algoItem;
    }

    _createClass(JSerWeek, [{
        key: "items",
        get: function get() {
            if (this._items.length === 0) {
                var pastDate = new Date(1995, 11, 17);
                this._items = this._algoItem.findItemsBetween(this.beginDate || pastDate, this.endDate);
            }
            return this._items;
        }
    }]);

    return JSerWeek;
})();

exports["default"] = JSerWeek;
module.exports = exports["default"];

},{}],46:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TfIdf = require("natural/lib/natural/tfidf/tfidf");
// merge sort
var mergeSort = function mergeSort(arr) {
    if (arr.length < 2) {
        return arr;
    }

    var middle = parseInt(arr.length / 2),
        left = arr.slice(0, middle),
        right = arr.slice(middle);

    return merge(mergeSort(left), mergeSort(right));
};

var merge = function merge(left, right) {
    var result = [];

    while (left.length && right.length) {
        right[0].measure <= left[0].measure ? result.push(left.shift()) : result.push(right.shift());
    }

    while (left.length) {
        result.push(left.shift());
    }
    while (right.length) {
        result.push(right.shift());
    }

    return result;
};
var ignoreWord = function ignoreWord(word) {
    if (word.length <= 1) {
        return false;
    }
    // 数字と.のみは除外
    if (/^v?[\d\.]+$/.test(word)) {
        return false;
    }
    if (/[\?&=]/.test(word)) {
        return false;
    }
    if (/^\.(html|md|php)$/i.test(word)) {
        return false;
    }
    return true;
};
function urlToWords(url) {
    var pathList = url.split("/");
    var pathNames = pathList[pathList.length - 1].split(/([-_]|\.html$|\.md$|\.php$|#)/i);
    return pathNames.filter(ignoreWord);
}

var NaturalSearcher = (function () {
    function NaturalSearcher(items) {
        _classCallCheck(this, NaturalSearcher);

        this.items = items;
        this.tfidf = new TfIdf();
        this.addItemsAsDocuments(this.items);
    }

    NaturalSearcher.prototype.addItemsAsDocuments = function addItemsAsDocuments(items) {
        var _this = this;

        items.forEach(function (item) {
            var urlKeyString = urlToWords(item.url).join(" ");
            var relatedString = item.relatedLinks.map(function (relatedObject) {
                return relatedObject.title + " " + urlToWords(relatedObject.url).join(" ");
            }).join("");
            var tagsString = (item.tags || []).join(" ");
            // 全部を使うと長すぎるコンテンツが有利になりすぎるので絞る
            var slicedContent = item.content.slice(0, 200);
            _this.tfidf.addDocument(item.title + "\n" + tagsString + "\n" + slicedContent + "\n" + urlKeyString + "\n" + relatedString);
        });
    };

    /**
     *
     * @param {JSerItem} targetItem
     * @param {number} limit
     */

    NaturalSearcher.prototype.findRelatedItems = function findRelatedItems(targetItem, limit) {
        var targetIndex = this.items.indexOf(targetItem);
        if (targetIndex === -1) {
            this.items.some(function (item, index) {
                if (item.isEqualItem(item)) {
                    targetIndex = index;
                    return true;
                }
            });
            if (targetIndex === -1) {
                throw new Error("Not found this item: " + targetItem);
            }
        }
        var terms = this.tfidf.listTerms(targetIndex);
        var results = [];
        this.tfidf.tfidfs(terms.map(function (term) {
            return term.term;
        }), function (i, measure) {
            results.push({
                index: i,
                measure: measure
            });
        });
        var sorted = mergeSort(results);
        // tifidf -> item
        var matchItems = [];
        for (var i = 0, len = Math.min(sorted.length, limit + 1); i < len; i++) {
            // 自分自身は含めない
            var matchItem = this.items[sorted[i].index];
            if (this.items[targetIndex].isEqualItem(matchItem)) {
                continue;
            }
            matchItems.push(matchItem);
        }
        return matchItems;
    };

    return NaturalSearcher;
})();

exports["default"] = NaturalSearcher;
module.exports = exports["default"];

},{"natural/lib/natural/tfidf/tfidf":47}],47:[function(require,module,exports){
(function (Buffer){
/*
Copyright (c) 2011, Rob Ellis, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var _ = require("underscore")._,
    Tokenizer = require('../tokenizers/regexp_tokenizer').WordTokenizer,
    tokenizer = new Tokenizer(),
    stopwords = require('../util/stopwords').words,
    fs = require('fs');

function buildDocument(text, key) {
    var stopOut;

    if(typeof text === 'string') {
        text = tokenizer.tokenize(text.toLowerCase());
        stopOut = true;
    } else if(!_.isArray(text)) {
        stopOut = false;
        return text;
    }

    return text.reduce(function(document, term) {
        // next line solves https://github.com/NaturalNode/natural/issues/119
        if(typeof document[term] === 'function') document[term] = 0;
        if(!stopOut || stopwords.indexOf(term) < 0)
            document[term] = (document[term] ? document[term] + 1 : 1);
        return document;
    }, {__key: key});
}

function tf(term, document) {
    return document[term] ? document[term]: 0;
}

function documentHasTerm(term, document) {
    return document[term] && document[term] > 0;
}

function TfIdf(deserialized) {
    if(deserialized)
        this.documents = deserialized.documents;
    else
        this.documents = [];

    this._idfCache = {};
}

// backwards compatibility for < node 0.10
function isEncoding(encoding) {
    if (typeof Buffer.isEncoding !== 'undefined')
        return Buffer.isEncoding(encoding);
    switch ((encoding + '').toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
        case 'raw':
            return true;
    }
    return false;
}

module.exports = TfIdf;
TfIdf.tf = tf;

TfIdf.prototype.idf = function(term, force) {

    // Lookup the term in the New term-IDF caching,
    // this will cut search times down exponentially on large document sets.
    if(this._idfCache[term] && this._idfCache.hasOwnProperty(term) && force !== true)
        return this._idfCache[term];

    var docsWithTerm = this.documents.reduce(function(count, document) {
        return count + (documentHasTerm(term, document) ? 1 : 0);
    }, 0);

    var idf = 1 + Math.log((this.documents.length) / ( 1 + docsWithTerm ));

    // Add the idf to the term cache and return it
    this._idfCache[term] = idf;
    return idf;
};

// If restoreCache is set to true, all terms idf scores currently cached will be recomputed.
// Otherwise, the cache will just be wiped clean
TfIdf.prototype.addDocument = function(document, key, restoreCache) {
    this.documents.push(buildDocument(document, key));

    // make sure the cache is invalidated when new documents arrive
    if(restoreCache === true) {
        for(var term in this._idfCache) {
            // invoking idf with the force option set will
            // force a recomputation of the idf, and it will
            // automatically refresh the cache value.
            this.idf(term, true);
        }
    }   else {
        this._idfCache = {};
    }
};

// If restoreCache is set to true, all terms idf scores currently cached will be recomputed.
// Otherwise, the cache will just be wiped clean
TfIdf.prototype.addFileSync = function(path, encoding, key, restoreCache) {
    if(!encoding)
        encoding = 'utf8';
    if(!isEncoding(encoding))
        throw new Error('Invalid encoding: ' + encoding);

    var document = fs.readFileSync(path, encoding);
    this.documents.push(buildDocument(document, key));

    // make sure the cache is invalidated when new documents arrive
    if(restoreCache === true) {
        for(var term in this._idfCache) {
            // invoking idf with the force option set will
            // force a recomputation of the idf, and it will
            // automatically refresh the cache value.
            this.idf(term, true);
        }
    }
    else {
        this._idfCache = {};
    }
};

TfIdf.prototype.tfidf = function(terms, d) {
    var _this = this;

    if(!_.isArray(terms))
        terms = tokenizer.tokenize(terms.toString().toLowerCase());

    return terms.reduce(function(value, term) {
        var idf = _this.idf(term);
        idf = idf === Infinity ? 0 : idf;
        return value + (tf(term, _this.documents[d]) * idf);
    }, 0.0);
};

TfIdf.prototype.listTerms = function(d) {
    var terms = [];

    for(var term in this.documents[d]) {
        if(term != '__key')
           terms.push({term: term, tfidf: this.tfidf(term, d)});
    }

    return terms.sort(function(x, y) { return y.tfidf - x.tfidf; });
};

TfIdf.prototype.tfidfs = function(terms, callback) {
    var tfidfs = new Array(this.documents.length);

    for(var i = 0; i < this.documents.length; i++) {
        tfidfs[i] = this.tfidf(terms, i);

        if(callback)
            callback(i, tfidfs[i], this.documents[i].__key);
    }

    return tfidfs;
};

// Define a tokenizer other than the default "WordTokenizer"
TfIdf.prototype.setTokenizer = function(t) {
    if(!_.isFunction(t.tokenize))
        throw new Error('Expected a valid Tokenizer');
    tokenizer = t;
};

}).call(this,require("buffer").Buffer)
},{"../tokenizers/regexp_tokenizer":48,"../util/stopwords":50,"buffer":7,"fs":6,"underscore":57}],48:[function(require,module,exports){
/*
Copyright (c) 2011, Rob Ellis, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var Tokenizer = require('./tokenizer'),
    util = require("util"),
    _ = require('underscore')._;

// Base Class for RegExp Matching
var RegexpTokenizer = function(options) {
    var options = options || {};
    this._pattern = options.pattern || this._pattern;
    this.discardEmpty = options.discardEmpty || true;

    // Match and split on GAPS not the actual WORDS
    this._gaps = options.gaps;
    
    if (this._gaps === undefined) {
        this._gaps = true;
    }
};

util.inherits(RegexpTokenizer, Tokenizer);

RegexpTokenizer.prototype.tokenize = function(s) {
    var results;

    if (this._gaps) {
        results = s.split(this._pattern);
        return (this.discardEmpty) ? _.without(results,'',' ') : results;
    } else {
        return s.match(this._pattern);
    }
};

exports.RegexpTokenizer = RegexpTokenizer;

/***
 * A tokenizer that divides a text into sequences of alphabetic and
 * non-alphabetic characters.  E.g.:
 *
 *      >>> WordTokenizer().tokenize("She said 'hello'.")
 *      ['She', 'said', 'hello']
 * 
 */
var WordTokenizer = function(options) {
    this._pattern = /\W+/;
    RegexpTokenizer.call(this,options)
};

util.inherits(WordTokenizer, RegexpTokenizer);
exports.WordTokenizer = WordTokenizer;

/***
 * A tokenizer that divides a text into sequences of alphabetic and
 * non-alphabetic characters.  E.g.:
 *
 *      >>> WordPunctTokenizer().tokenize("She said 'hello'.")
 *      ['She', 'said', "'", 'hello', "'."]
 * 
 */
var WordPunctTokenizer = function(options) {
    this._pattern = new RegExp(/(\w+|\!|\'|\"")/i);
    RegexpTokenizer.call(this,options)
};

util.inherits(WordPunctTokenizer, RegexpTokenizer);
exports.WordPunctTokenizer = WordPunctTokenizer;

},{"./tokenizer":49,"underscore":57,"util":59}],49:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * \@todo Use .bind() in Tokenizer.prototype.attach().
 */

var Tokenizer = function() {
};

Tokenizer.prototype.trim = function(array) {
  while (array[array.length - 1] == '')
    array.pop();

  while (array[0] == '')
    array.shift();

  return array;
};

// Expose an attach function that will patch String with new methods.
Tokenizer.prototype.attach = function() {
  var self = this;

  String.prototype.tokenize = function() {
    return self.tokenize(this);
  }
};

Tokenizer.prototype.tokenize = function() {};

module.exports = Tokenizer;

},{}],50:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// a list of commonly used words that have little meaning and can be excluded
// from analysis.
var words = [
    'about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 'as', 'at', 'be',
    'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can',
    'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had',
    'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'if', 'in', 'into',
    'is', 'it', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must',
    'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over',
    'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than',
    'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were',
    'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '$', '1',
    '2', '3', '4', '5', '6', '7', '8', '9', '0', '_'];
    
// tell the world about the noise words.    
exports.words = words;

},{}],51:[function(require,module,exports){
'use strict'

module.exports = function(target) {
  target = target || {}

  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i]
    if (!source) continue

    Object.getOwnPropertyNames(source).forEach(function(key) {
      if (undefined === target[key])
        target[key] = source[key]
    })
  }

  return target
}

},{}],52:[function(require,module,exports){
(function (root, factory){
  'use strict';

  /*istanbul ignore next:cant test*/
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else {
    // Browser globals
    root.objectPath = factory();
  }
})(this, function(){
  'use strict';

  var
    toStr = Object.prototype.toString,
    _hasOwnProperty = Object.prototype.hasOwnProperty;

  function isEmpty(value){
    if (!value) {
      return true;
    }
    if (isArray(value) && value.length === 0) {
        return true;
    } else if (!isString(value)) {
        for (var i in value) {
            if (_hasOwnProperty.call(value, i)) {
                return false;
            }
        }
        return true;
    }
    return false;
  }

  function toString(type){
    return toStr.call(type);
  }

  function isNumber(value){
    return typeof value === 'number' || toString(value) === "[object Number]";
  }

  function isString(obj){
    return typeof obj === 'string' || toString(obj) === "[object String]";
  }

  function isObject(obj){
    return typeof obj === 'object' && toString(obj) === "[object Object]";
  }

  function isArray(obj){
    return typeof obj === 'object' && typeof obj.length === 'number' && toString(obj) === '[object Array]';
  }

  function isBoolean(obj){
    return typeof obj === 'boolean' || toString(obj) === '[object Boolean]';
  }

  function getKey(key){
    var intKey = parseInt(key);
    if (intKey.toString() === key) {
      return intKey;
    }
    return key;
  }

  function set(obj, path, value, doNotReplace){
    if (isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isString(path)) {
      return set(obj, path.split('.').map(getKey), value, doNotReplace);
    }
    var currentPath = path[0];

    if (path.length === 1) {
      var oldVal = obj[currentPath];
      if (oldVal === void 0 || !doNotReplace) {
        obj[currentPath] = value;
      }
      return oldVal;
    }

    if (obj[currentPath] === void 0) {
      //check if we assume an array
      if(isNumber(path[1])) {
        obj[currentPath] = [];
      } else {
        obj[currentPath] = {};
      }
    }

    return set(obj[currentPath], path.slice(1), value, doNotReplace);
  }

  function del(obj, path) {
    if (isNumber(path)) {
      path = [path];
    }

    if (isEmpty(obj)) {
      return void 0;
    }

    if (isEmpty(path)) {
      return obj;
    }
    if(isString(path)) {
      return del(obj, path.split('.'));
    }

    var currentPath = getKey(path[0]);
    var oldVal = obj[currentPath];

    if(path.length === 1) {
      if (oldVal !== void 0) {
        if (isArray(obj)) {
          obj.splice(currentPath, 1);
        } else {
          delete obj[currentPath];
        }
      }
    } else {
      if (obj[currentPath] !== void 0) {
        return del(obj[currentPath], path.slice(1));
      }
    }

    return obj;
  }

  var objectPath = function(obj) {
    return Object.keys(objectPath).reduce(function(proxy, prop) {
      if (typeof objectPath[prop] === 'function') {
        proxy[prop] = objectPath[prop].bind(objectPath, obj);
      }

      return proxy;
    }, {});
  };

  objectPath.has = function (obj, path) {
    if (isEmpty(obj)) {
      return false;
    }

    if (isNumber(path)) {
      path = [path];
    } else if (isString(path)) {
      path = path.split('.');
    }

    if (isEmpty(path) || path.length === 0) {
      return false;
    }

    for (var i = 0; i < path.length; i++) {
      var j = path[i];
      if ((isObject(obj) || isArray(obj)) && _hasOwnProperty.call(obj, j)) {
        obj = obj[j];
      } else {
        return false;
      }
    }

    return true;
  };

  objectPath.ensureExists = function (obj, path, value){
    return set(obj, path, value, true);
  };

  objectPath.set = function (obj, path, value, doNotReplace){
    return set(obj, path, value, doNotReplace);
  };

  objectPath.insert = function (obj, path, value, at){
    var arr = objectPath.get(obj, path);
    at = ~~at;
    if (!isArray(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }
    arr.splice(at, 0, value);
  };

  objectPath.empty = function(obj, path) {
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return void 0;
    }

    var value, i;
    if (!(value = objectPath.get(obj, path))) {
      return obj;
    }

    if (isString(value)) {
      return objectPath.set(obj, path, '');
    } else if (isBoolean(value)) {
      return objectPath.set(obj, path, false);
    } else if (isNumber(value)) {
      return objectPath.set(obj, path, 0);
    } else if (isArray(value)) {
      value.length = 0;
    } else if (isObject(value)) {
      for (i in value) {
        if (_hasOwnProperty.call(value, i)) {
          delete value[i];
        }
      }
    } else {
      return objectPath.set(obj, path, null);
    }
  };

  objectPath.push = function (obj, path /*, values */){
    var arr = objectPath.get(obj, path);
    if (!isArray(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }

    arr.push.apply(arr, Array.prototype.slice.call(arguments, 2));
  };

  objectPath.coalesce = function (obj, paths, defaultValue) {
    var value;

    for (var i = 0, len = paths.length; i < len; i++) {
      if ((value = objectPath.get(obj, paths[i])) !== void 0) {
        return value;
      }
    }

    return defaultValue;
  };

  objectPath.get = function (obj, path, defaultValue){
    if (isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return defaultValue;
    }
    if (isString(path)) {
      return objectPath.get(obj, path.split('.'), defaultValue);
    }

    var currentPath = getKey(path[0]);

    if (path.length === 1) {
      if (obj[currentPath] === void 0) {
        return defaultValue;
      }
      return obj[currentPath];
    }

    return objectPath.get(obj[currentPath], path.slice(1), defaultValue);
  };

  objectPath.del = function(obj, path) {
    return del(obj, path);
  };

  return objectPath;
});

},{}],53:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],54:[function(require,module,exports){
module.exports = function(md, options) {
  options = options || {};
  options.stripListLeaders = options.hasOwnProperty('stripListLeaders') ? options.stripListLeaders : true;

  var output = md;
  try {
    if (options.stripListLeaders) {
      output = output.replace(/^([\s\t]*)([\*\-\+]|\d\.)\s+/gm, '$1');
    }
    output = output
      // Remove HTML tags
      .replace(/<(.*?)>/g, '$1')
      // Remove setext-style headers
      .replace(/^[=\-]{2,}\s*$/g, '')
      // Remove footnotes?
      .replace(/\[\^.+?\](\: .*?$)?/g, '')
      .replace(/\s{0,2}\[.*?\]: .*?$/g, '')
      // Remove images
      .replace(/\!\[.*?\][\[\(].*?[\]\)]/g, '')
      // Remove inline links
      .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, '$1')
      // Remove reference-style links?
      .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
      // Remove atx-style headers
      .replace(/^\#{1,6}\s*([^#]*)\s*(\#{1,6})?/gm, '$1')
      .replace(/([\*_]{1,2})(\S.*?\S)\1/g, '$2')
      .replace(/(`{3,})(.*?)\1/gm, '$2')
      .replace(/^-{3,}\s*$/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\n{2,}/g, '\n\n');
  } catch(e) {
    console.error(e);
    return md;    
  }
  return output;
}

},{}],55:[function(require,module,exports){
module.exports = exports = require('./lib/sliced');

},{"./lib/sliced":56}],56:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}],57:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],58:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],59:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":58,"_process":53,"inherits":30}],60:[function(require,module,exports){
/**
 * Module dependencies.
 */

var slice = require('sliced')
var flatten = require('array-flatten')

/**
 * This function lets us create virtual nodes using a simple
 * syntax. It is compatible with JSX transforms so you can use
 * JSX to write nodes that will compile to this function.
 *
 * let node = element('div', { id: 'foo' }, [
 *   element('a', { href: 'http://google.com' }, 'Google')
 * ])
 *
 * You can leave out the attributes or the children if either
 * of them aren't needed and it will figure out what you're
 * trying to do.
 */

module.exports = element

/**
 * Create virtual trees of components.
 *
 * This creates the nicer API for the user.
 * It translates that friendly API into an actual tree of nodes.
 *
 * @param {*} type
 * @param {Object} attributes
 * @param {Array} children
 * @return {Object}
 * @api public
 */

function element (type, attributes, children) {
  // Default to div with no args
  if (!type) {
    throw new TypeError('element() needs a type.')
  }

  // Skipped adding attributes and we're passing
  // in children instead.
  if (arguments.length === 2 && (typeof attributes === 'string' || Array.isArray(attributes))) {
    children = [ attributes ]
    attributes = {}
  }

  // Account for JSX putting the children as multiple arguments.
  // This is essentially just the ES6 rest param
  if (arguments.length > 2) {
    children = slice(arguments, 2)
  }

  children = children || []
  attributes = attributes || {}

  // Flatten nested child arrays. This is how JSX compiles some nodes.
  children = flatten(children, 2)

  // Filter out any `undefined` elements
  children = children.filter(function (i) { return typeof i !== 'undefined' })

  // if you pass in a function, it's a `Component` constructor.
  // otherwise it's an element.
  return {
    type: type,
    children: children,
    attributes: attributes
  }
}

},{"array-flatten":1,"sliced":55}],61:[function(require,module,exports){
// LICENSE : MIT
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.render = render;

var _virtualElement = require("virtual-element");

var _virtualElement2 = _interopRequireDefault(_virtualElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function render(component) {
    var props = component.props;
    var state = component.state;
    var id = component.id;

    return (0, _virtualElement2.default)(
        "a",
        { className: "RelatedItem", href: props.url, target: "_blank" },
        props.title
    );
}
exports.default = {
    render: render
};

},{"virtual-element":60}],62:[function(require,module,exports){
// LICENSE : MIT
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.render = render;

var _virtualElement = require("virtual-element");

var _virtualElement2 = _interopRequireDefault(_virtualElement);

var _RelatedItem = require("./RelatedItem");

var _RelatedItem2 = _interopRequireDefault(_RelatedItem);

var _removeMarkdown = require("remove-markdown");

var _removeMarkdown2 = _interopRequireDefault(_removeMarkdown);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ellipsis(text) {
    if (text.length > 200) {
        return text.slice(0, 200) + "…";
    }
    return text;
}
function render(component) {
    var props = component.props;
    var state = component.state;
    var id = component.id;

    var items = props.postWithItems.map(function (postWithItem, index) {
        var item = postWithItem.item;
        var post = postWithItem.post;
        // strip markdown

        var plainText = (0, _removeMarkdown2.default)(item.content, { stripListLeaders: false });

        return (0, _virtualElement2.default)(
            "div",
            { "class": "RelatedItem" },
            (0, _virtualElement2.default)(
                "h4",
                null,
                (0, _virtualElement2.default)(_RelatedItem2.default, { title: item.title, url: item.url })
            ),
            (0, _virtualElement2.default)(
                "cite",
                null,
                (0, _virtualElement2.default)(
                    "a",
                    { href: post.url, title: post.title,
                        target: "_blank" },
                    post.title.replace(/(\d{4}-\d{2}-\d{2}のJS).*$/, "$1")
                )
            ),
            (0, _virtualElement2.default)(
                "p",
                { "class": "RelatedItem--description" },
                ellipsis(plainText)
            )
        );
    });
    return (0, _virtualElement2.default)(
        "div",
        { "class": "RelatedItemList" },
        (0, _virtualElement2.default)(
            "h3",
            { "class": "RelatedItemList--title" },
            "関連する記事"
        ),
        (0, _virtualElement2.default)(
            "dl",
            null,
            items
        )
    );
}
exports.default = { render: render };

},{"./RelatedItem":61,"remove-markdown":54,"virtual-element":60}],63:[function(require,module,exports){
// LICENSE : MIT
"use strict";

var _virtualElement = require('virtual-element');

var _virtualElement2 = _interopRequireDefault(_virtualElement);

var _deku = require('deku');

var _RelatedItemList = require('./component/RelatedItemList');

var _RelatedItemList2 = _interopRequireDefault(_RelatedItemList);

var _jserStat = require('jser-stat');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ItemData = require("jser-stat/data/items");
var PostData = require("jser-stat/data/posts");
function fetchURL(URL) {
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', URL);
        req.onload = function () {
            if (req.status == 200) {
                resolve(req.response);
            } else {
                reject(Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(Error(req.statusText));
        };
        req.send();
    });
}
function getStat() {
    return Promise.resolve(new _jserStat.JSerStat(ItemData, PostData));
    // APIで取ってくる方式
    if (getStat._jSerStat) {
        return Promise.resolve(getStat._jSerStat);
    }
    return Promise.all([fetchURL("http://jser.info/posts.json"), fetchURL("http://jser.info/source-data/items.json")]).then(function (results) {
        var posts = JSON.parse(results[0]).reverse();
        var items = JSON.parse(results[1]);
        var jSerStat = new _jserStat.JSerStat(items, posts);
        getStat._jSerStat = jSerStat;
        return jSerStat;
    });
}

function showRelated(URL, placeholder) {
    getStat().then(function (stat) {
        var jSerItem = stat.findItemWithURL(URL);
        var relatedItems = stat.findRelatedItems(jSerItem);
        return relatedItems.map(function (item) {
            var week = stat.findWeekWithItem(item);
            // 未来の記事候補の場合はまだ該当するweekはない
            if (week == null) {
                return null;
            }
            return {
                item: item,
                post: week.post
            };
        }).filter(function (object) {
            return object != null;
        }); // 空はfilter
    }).then(function (postWithItems) {
        var app = (0, _deku.tree)((0, _virtualElement2.default)(
            'div',
            { 'class': 'RelatedItemBox' },
            (0, _virtualElement2.default)(
                _RelatedItemList2.default,
                { postWithItems: postWithItems },
                'Hello World!'
            )
        ));
        (0, _deku.render)(app, placeholder);
    });
}
getStat().then(function () {
    var siteNodeList = document.querySelectorAll(".site-genre ~ hr + h2 + p");
    var siteList = Array.prototype.slice.call(siteNodeList);
    siteList.forEach(function (item) {
        var URL = item.firstElementChild.href;
        var div = document.createElement("div");
        div.className = "RelatedItemAddition";
        var button = document.createElement("button");
        button.className = "RelatedItemAddition--button";
        button.textContent = "▼関連記事を表示";
        button.addEventListener("click", function (event) {
            event.preventDefault();
            var parentNode = item;
            var box = parentNode.getElementsByClassName("RelatedItemBox");
            if (box.length > 0) {
                return;
            }
            var placeholder = document.createElement("div");
            parentNode.appendChild(placeholder);
            showRelated(URL, placeholder);
        });
        div.appendChild(button);
        item.appendChild(div);
    });
}).catch(function (error) {
    console.error(error, error.stack);
});

},{"./component/RelatedItemList":62,"deku":14,"jser-stat":40,"jser-stat/data/items":34,"jser-stat/data/posts":35,"virtual-element":60}]},{},[63]);