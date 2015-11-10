(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

var util = require('util'),
Classifier = require('./classifier');

var BayesClassifier = function(smoothing) {
    Classifier.call(this);
    this.classFeatures = {};
    this.classTotals = {};
    this.totalExamples = 1; // start at one to smooth
    this.smoothing = smoothing === undefined ? 1.0 : smoothing;
};

util.inherits(BayesClassifier, Classifier);

function addExample(observation, label) {
    if(!this.classFeatures[label]) {
        this.classFeatures[label] = {};
        this.classTotals[label] = 1; // give an extra for smoothing
    }

    if(observation instanceof Array) {
        var i = observation.length;
        this.totalExamples++;
        this.classTotals[label]++;

        while(i--) {
            if(observation[i]) {
                if(this.classFeatures[label][i]) {
                    this.classFeatures[label][i]++;
                } else {
                    // give an extra for smoothing
                    this.classFeatures[label][i] = 1 + this.smoothing;
                }
            }
        }
    } else {
        // sparse observation
        for(var key in observation){
            value = observation[key];

            if(this.classFeatures[label][value]) {
               this.classFeatures[label][value]++;
            } else {
                // give an extra for smoothing
               this.classFeatures[label][value] = 1 + this.smoothing;
            }
        }
    }
}

function train() {

}

function probabilityOfClass(observation, label) {
    var prob = 0;

    if(observation instanceof Array){
        var i = observation.length;

        while(i--) {
            if(observation[i]) {
                var count = this.classFeatures[label][i] || this.smoothing;
                // numbers are tiny, add logs rather than take product
                prob += Math.log(count / this.classTotals[label]);
            }
        }
    } else {
        // sparse observation
        for(var key in observation){
            var count = this.classFeatures[label][observation[key]] || this.smoothing;
            // numbers are tiny, add logs rather than take product
            prob += Math.log(count / this.classTotals[label]);
        }
    }

    // p(C) * unlogging the above calculation P(X|C)
    prob = (this.classTotals[label] / this.totalExamples) * Math.exp(prob);

    return prob;
}

function getClassifications(observation) {
    var classifier = this;
    var labels = [];

    for(var className in this.classFeatures) {
        labels.push({label: className,
        value: classifier.probabilityOfClass(observation, className)});
    }

    return labels.sort(function(x, y) {
        return y.value - x.value;
    });
}

function restore(classifier) {
     classifier = Classifier.restore(classifier);
     classifier.__proto__ = BayesClassifier.prototype;

     return classifier;
}

BayesClassifier.prototype.addExample = addExample;
BayesClassifier.prototype.train = train;
BayesClassifier.prototype.getClassifications = getClassifications;
BayesClassifier.prototype.probabilityOfClass = probabilityOfClass;

BayesClassifier.restore = restore;

module.exports = BayesClassifier;
},{"./classifier":2,"util":149}],2:[function(require,module,exports){
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

function Classifier() {
}

function restore(classifier) {
    classifier = typeof classifier == 'string' ?  JSON.parse(classifier) : classifier;

    return classifier;
}

function addExample(observation, classification) {
    throw 'Not implemented';
}

function classify(observation) {
	var classifications = this.getClassifications(observation);
	if(!classifications || classifications.length === 0) {
		throw "Not Trained";
	} 
    return this.getClassifications(observation)[0].label;
}

function train() {
    throw 'Not implemented';
}

Classifier.prototype.addExample = addExample;
Classifier.prototype.train = train;
Classifier.prototype.classify = classify;

Classifier.restore = restore;

module.exports = Classifier;

},{}],3:[function(require,module,exports){
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

var util = require('util'),
     Classifier = require('./classifier');

var sylvester = require('sylvester'),
Matrix = sylvester.Matrix,
Vector = sylvester.Vector;

function sigmoid(z) {
    return 1 / (1 + Math.exp(0 - z));
}

function hypothesis(theta, Observations) {
    return Observations.x(theta).map(sigmoid);
}

function cost(theta, Examples, classifications) {
    var hypothesisResult = hypothesis(theta, Examples);

    var ones = Vector.One(Examples.rows());
    var cost_1 = Vector.Zero(Examples.rows()).subtract(classifications).elementMultiply(hypothesisResult.log());
    var cost_0 = ones.subtract(classifications).elementMultiply(ones.subtract(hypothesisResult).log());

    return (1 / Examples.rows()) * cost_1.subtract(cost_0).sum();
}

function descendGradient(theta, Examples, classifications) {
    var maxIt = 500 * Examples.rows();
    var last;
    var current;
    var learningRate = 3;
    var learningRateFound = false;

    Examples = Matrix.One(Examples.rows(), 1).augment(Examples);
    theta = theta.augment([0]);

    while(!learningRateFound) {
        var i = 0;
        last = null;

        while(true) {
            var hypothesisResult = hypothesis(theta, Examples);
            theta = theta.subtract(Examples.transpose().x(
            hypothesisResult.subtract(classifications)).x(1 / Examples.rows()).x(learningRate));
            current = cost(theta, Examples, classifications);

            i++;

            if(last) {
            if(current < last)
                learningRateFound = true;
            else
                break;

            if(last - current < 0.0001)
                break;
            }

            if(i >= maxIt) {
                throw 'unable to find minimum';
            }

            last = current;
        }

        learningRate /= 3;
    }

    return theta.chomp(1);
}

var LogisticRegressionClassifier = function() {
    Classifier.call(this);
    this.examples = {};
    this.features = [];
    this.featurePositions = {};
    this.maxFeaturePosition = 0;
    this.classifications = [];
    this.exampleCount = 0;
};

util.inherits(LogisticRegressionClassifier, Classifier);

function createClassifications() {
    var classifications = [];

    for(var i = 0; i < this.exampleCount; i++) {
        var classification = [];

        for(var _ in this.examples) {
            classification.push(0);
        }

       classifications.push(classification);
    }

    return classifications;
}

function computeThetas(Examples, Classifications) {
    this.theta = [];

    // each class will have it's own theta.
    var zero = function() { return 0; };
    for(var i = 1; i <= this.classifications.length; i++) {
        var theta = Examples.row(1).map(zero);
        this.theta.push(descendGradient(theta, Examples, Classifications.column(i)));
    }
}

function train() {
    var examples = [];
    var classifications = this.createClassifications();
    var d = 0, c = 0;

    for(var classification in this.examples) {
        for(var i = 0; i < this.examples[classification].length; i++) {
            var doc = this.examples[classification][i];
            var example = doc;

            examples.push(example);
            classifications[d][c] = 1;
            d++;
        }

        c++;
    }

    this.computeThetas($M(examples), $M(classifications));
}

function addExample(data, classification) {
    if(!this.examples[classification]) {
	this.examples[classification] = [];
	this.classifications.push(classification);
    }

    this.examples[classification].push(data);
    this.exampleCount++;
}

function getClassifications(observation) {
    observation = $V(observation);
    var classifications = [];

    for(var i = 0; i < this.theta.length; i++) {
        classifications.push({label: this.classifications[i], value: sigmoid(observation.dot(this.theta[i])) });
    }

    return classifications.sort(function(x, y) {
        return y.value - x.value;
    });
}

function restore(classifier) {
    classifier = Classifier.restore(classifier);
    classifier.__proto__ = LogisticRegressionClassifier.prototype;

    return classifier;
}

LogisticRegressionClassifier.prototype.addExample = addExample;
LogisticRegressionClassifier.prototype.restore = restore;
LogisticRegressionClassifier.prototype.train = train;
LogisticRegressionClassifier.prototype.createClassifications = createClassifications;
LogisticRegressionClassifier.prototype.computeThetas = computeThetas;
LogisticRegressionClassifier.prototype.getClassifications = getClassifications;

LogisticRegressionClassifier.restore = restore;

module.exports = LogisticRegressionClassifier;

},{"./classifier":2,"sylvester":140,"util":149}],4:[function(require,module,exports){
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

var Sylvester = require('sylvester'),
Matrix = Sylvester.Matrix,
Vector = Sylvester.Vector;

function KMeans(Observations) {
    if(!Observations.elements)
    Observations = $M(Observations);

    this.Observations = Observations;
}

// create an initial centroid matrix with initial values between
// 0 and the max of feature data X.
function createCentroids(k) {
    var Centroid = [];
    var maxes = this.Observations.maxColumns();
    //console.log(maxes);

    for(var i = 1; i <= k; i++) {
        var centroid = [];
        for(var j = 1; j <= this.Observations.cols(); j++) {
            centroid.push(Math.random() * maxes.e(j));
        }

        Centroid.push(centroid);
    }

    //console.log(centroid)

    return $M(Centroid);
}

// get the euclidian distance between the feature data X and
// a given centroid matrix C.
function distanceFrom(Centroids) {
    var distances = [];

    for(var i = 1; i <= this.Observations.rows(); i++) {
        var distance = [];

        for(var j = 1; j <= Centroids.rows(); j++) {
            distance.push(this.Observations.row(i).distanceFrom(Centroids.row(j)));
        }

        distances.push(distance);
    }

    return $M(distances);
}

// categorize the feature data X into k clusters. return a vector
// containing the results.
function cluster(k) {
    var Centroids = this.createCentroids(k);
    var LastDistances = Matrix.Zero(this.Observations.rows(), this.Observations.cols());
    var Distances = this.distanceFrom(Centroids);
    var Groups;

    while(!(LastDistances.eql(Distances))) {
    Groups = Distances.minColumnIndexes();
    LastDistances = Distances;

    var newCentroids = [];

    for(var i = 1; i <= Centroids.rows(); i++) {
        var centroid = [];

        for(var j = 1; j <= Centroids.cols(); j++) {
        var sum = 0;
        var count = 0;

        for(var l = 1; l <= this.Observations.rows(); l++) {
            if(Groups.e(l) == i) {
            count++;
            sum += this.Observations.e(l, j);
            }
        }

        centroid.push(sum / count);
        }

        newCentroids.push(centroid);
    }

    Centroids = $M(newCentroids);
    Distances = this.distanceFrom(Centroids);
    }

    return Groups;
}

KMeans.prototype.createCentroids = createCentroids;
KMeans.prototype.distanceFrom = distanceFrom;
KMeans.prototype.cluster = cluster;

module.exports = KMeans;

},{"sylvester":140}],5:[function(require,module,exports){

exports.BayesClassifier = require('./classifier/bayes_classifier');
exports.LogisticRegressionClassifier = require('./classifier/logistic_regression_classifier');
exports.KMeans = require('./clusterer/kmeans');

},{"./classifier/bayes_classifier":1,"./classifier/logistic_regression_classifier":3,"./clusterer/kmeans":4}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"util/":149}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){


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

},{}],11:[function(require,module,exports){

},{}],12:[function(require,module,exports){
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
var isArray = require('is-array')

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
      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
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
},{"base64-js":9,"ieee754":34,"is-array":36}],13:[function(require,module,exports){

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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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
},{"buffer":12}],16:[function(require,module,exports){
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

},{"component-emitter":13}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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
},{"./application":16,"./render":20,"./stringify":21}],19:[function(require,module,exports){
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

},{"component-type":15}],20:[function(require,module,exports){
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

},{"./events":17,"./node-type":19,"./svg":22,"component-raf":14,"fast.js/forEach":26,"fast.js/object/assign":29,"fast.js/reduce":32,"get-uid":33,"is-dom":37,"object-defaults":133,"object-path":134}],21:[function(require,module,exports){
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

},{"./node-type":19,"component-type":15,"object-defaults":133}],22:[function(require,module,exports){
module.exports = {
  isElement: require('is-svg-element').isElement,
  isAttribute: require('is-svg-attribute'),
  namespace: 'http://www.w3.org/2000/svg'
}

},{"is-svg-attribute":38,"is-svg-element":39}],23:[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],24:[function(require,module,exports){
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

},{"../function/bindInternal3":27}],25:[function(require,module,exports){
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

},{"../function/bindInternal4":28}],26:[function(require,module,exports){
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
},{"./array/forEach":24,"./object/forEach":30}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

},{"../function/bindInternal3":27}],31:[function(require,module,exports){
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

},{"../function/bindInternal4":28}],32:[function(require,module,exports){
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
},{"./array/reduce":25,"./object/reduce":31}],33:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
},{}],41:[function(require,module,exports){
module.exports=[{"title":"2011-01-16のJS: JSer.info初投稿の記事","url":"http://jser.info/post/2774561807","date":"2011-01-16T17:08:26+09:00","content":"JSer.infoとして初投稿になりますが今後ともよろしくお願いします。このサイトについての詳...","category":"JSer","tags":["JavaScript","URL","design","Java","Game","books"]},{"title":"CommonJSに基づいたモジュール管理ローダーSeaJS","url":"http://jser.info/post/2807412128","date":"2011-01-18T14:36:00+09:00","content":"打造最出色的模块加载框架：SeaJS Module Loader v0.3.0 预览版 - 岁...","category":"","tags":["JavaScript","CommonJS","module","YUI"]},{"title":"2011-01-18のJS:CommonJS, Firefox4, モダンJSのベストプラクティス","url":"http://jser.info/post/2810111581","date":"2011-01-18T20:53:04+09:00","content":"少しペースが早いですが、2回目の紹介記事です。最近はCommonJS,modulesというワー...","category":"JSer","tags":["JavaScript","node.js","CommonJS","jQuery"]},{"title":"2010年に人気のあったオライリー本TOP25が60%オフセール中","url":"http://jser.info/post/2824211314","date":"2011-01-19T17:10:00+09:00","content":"O&amp;#8217;Reilly Media - Best of Ebook Deal/Day -...","category":"","tags":["HTML5","books","javascript","jquery","css"]},{"title":"jQueryのソースコードから学ぶ11の事(movie)","url":"http://jser.info/post/2840863615","date":"2011-01-20T20:36:00+09:00","content":"11 More Things I Learned from the jQuery Source...","category":"","tags":["jquery","javascript","movie","presentation"]},{"title":"2011-01-20のJS : IDEの変化、miのWindows版、Node.js製CMSの登場","url":"http://jser.info/post/2841621230","date":"2011-01-20T22:20:00+09:00","content":"今回は直接JavaScriptについてではなく、ブラウザやエディタと言った少し回りの事に関して...","category":"JSer","tags":["javascript","module","Css","IDE","Editor","books"]},{"title":"WebkitベースのJavaScriptコマンドラインツール「PhantomJS」","url":"http://jser.info/post/2888913234","date":"2011-01-23T17:37:00+09:00","content":"don&amp;#8217;t code today what you can&amp;#8217;t deb...","category":"","tags":["javascript","test","webkit"]},{"title":"2011-01-25のJS : 最近のHTML5/JSプロジェクト、テストツール、未来のJavaScript","url":"http://jser.info/post/2924951560","date":"2011-01-26T00:05:00+09:00","content":"JavaScriptのテスト関する話題が多め。特にPhantomJSは面白いツールだと思います...","category":"JSer","tags":["javascript","html5","test","books","jquery","ide"]},{"title":"2011-01-31のJS : 疑似要素、勉強会スライド、strict mode","url":"http://jser.info/post/3030392484","date":"2011-01-31T22:34:00+09:00","content":"今回は勉強会などのスライド資料が多めです。またFirefoxやChromeにstrict mo...","category":"JSer","tags":["javascript","Canvas","slide","ECMA","Firefox","jquery","UI"]},{"title":"2011-02-07のJS: jQuery 1.5リリース、ChromeでWebGLがデフォルト有効へ","url":"http://jser.info/post/3161961410","date":"2011-02-07T19:16:00+09:00","content":"jQuery 1.5が正式リリースされ、新機能の中のDeferred Objectを扱った内容...","category":"JSer","tags":["jquery","javascript","security","chrome","WebGL","test","Css"]},{"title":"2011-02-13のJS: JavaScript Garden、Sass、Node.js 0.4リリース","url":"http://jser.info/post/3270425526","date":"2011-02-13T20:36:00+09:00","content":"今週はCSSフレームワークすごい的な話からSass(SCSS)についての話題が多くなった気がし...","category":"JSer","tags":["javascript","css","CommonJS","IE","node.js","security"]},{"title":"jQueryの.bind(), .live(), .delegate()の違い","url":"http://jser.info/post/3307464125","date":"2011-02-15T19:19:00+09:00","content":"The Difference Between jQuery’s .bind(), .live(...","category":"","tags":["jquery"]},{"title":"WebフォントをWindowsでも綺麗に表示するためには","url":"http://jser.info/post/3307807580","date":"2011-02-15T20:08:00+09:00","content":"Webfont 사용하기 | FRENDS.KRhttp://frends.kr/topics...","category":"","tags":["css","fonts","canvas"]},{"title":"2011-02-15のJS: IE9の変更点、デバッグツール、パフォーマンス測定","url":"http://jser.info/post/3308007227","date":"2011-02-15T20:36:00+09:00","content":"パフォーマンス測定関係についてのおもしろい話がまとまって出てきた感じがしたのでちょっとペースが...","category":"JSer","tags":["javascript","HTML5","jquery","IE","debug"]},{"title":"Mac向けGUIなgitクライアント「Tower」の10%offクーポンが発行中","url":"http://jser.info/post/3342190337","date":"2011-02-17T17:46:00+09:00","content":"10% off Tower for Mac - GitHubhttps://github.co...","category":"","tags":["git","Mac"]},{"title":"2011-02-21のJS: Firebug Tips、JSHint、Node.jsのお話","url":"http://jser.info/post/3421635039","date":"2011-02-21T18:49:00+09:00","content":"今週はNode.js関係でちょっとNode.js自体がどうなんだという感じの話が出たりしました...","category":"JSer","tags":["Node.js","books","firebug","coding"]},{"title":"Tumblrをブログとして利用する-実践編-","url":"http://jser.info/post/3461724032","date":"2011-02-23T18:45:00+09:00","content":"以前書いたTumblrをブログとして使うためにやるべき事 | Web scratchの焼き直し...","category":"","tags":["javascript","tumblr","css"]},{"title":"2011-02-28のJS: APIドキュメント生成、JSHint、Git","url":"http://jser.info/post/3563828253","date":"2011-02-28T23:14:00+09:00","content":"今週はJSHintのフォークした理由についての記事がコメントも併せて興味深かった気がします。後...","category":"JSer","tags":["node.js","javascript","documents","git","event"]},{"title":"2011-03-08のJS: ローダー系ライブラリのまとめ、JavaScriptの歴史、WebGL1.0","url":"http://jser.info/post/3720129918","date":"2011-03-08T19:00:00+09:00","content":"JavaScriptの歴史はネタになりやすいので、いろいろなところで話されていますが、JS h...","category":"JSer","tags":["history","Sass","jquery","IE","webgl"]},{"title":"2011-03-19のJS: IE9正式版リリース、大規模JavaScriptへの対処、ブラウザのデフォルトCSS","url":"http://jser.info/post/3957135221","date":"2011-03-19T17:55:00+09:00","content":"今週はいろいろとあった気がしますがIE9の正式リリースとFirefox4のリリース日(22日)...","category":"JSer","tags":["IE","git","chrome","Node.js"]},{"title":"O&#39;Reilly(Japanも)が全ての電子書籍を半額で&amp;売上を日本赤十字社に寄付","url":"http://jser.info/post/4025509933","date":"2011-03-23T01:33:00+09:00","content":"O&amp;#8217;Reilly Media - Free to Choose Deal: Sup...","category":"","tags":["books"]},{"title":"2011-03-24のJS: Firefox4,Firebug1.7.0リリース、デバッグツール、SassとLESSの比較","url":"http://jser.info/post/4080429411","date":"2011-03-25T16:00:00+09:00","content":"Firefox4の正式リリースがあったのでそれ関連の記事が多めです。またデバッグ関係のツールの...","category":"JSer","tags":["debug","Android","Css","chrome","firefox","sass"]},{"title":"演算子にもstrict modeを &quot;use restrict&quot;; ","url":"http://jser.info/post/4160215988","date":"2011-03-29T00:18:00+09:00","content":"Restrict Modehttp://restrictmode.org/JavaScript...","category":"","tags":["javascript","tools"]},{"title":"2011-04-08のJS: Backbone.jsとMVC、Ender.js、ECMAScript 5","url":"http://jser.info/post/4437775271","date":"2011-04-08T18:21:00+09:00","content":"Backbone.jsとは何かというのを詳細に解説したエントリが興味深かった。 ダグラス様のE...","category":"JSer","tags":["node.js","ES5","firebug","IE9"]},{"title":"2011-04-23のJS: jQuery1.6、IE10、モダンJavaScriptとは","url":"http://jser.info/post/4852073996","date":"2011-04-23T10:19:00+09:00","content":"今週は結構盛りだくさん(更新遅れたのもあるけど)ノンプログラマーのためのjQuery入門はスラ...","category":"JSer","tags":["jquery","coffeescript","perl","webkit","webgl","test","event"]},{"title":"2011-05-04のJS: jQuery1.6リリース、モジュール管理、Aptana3","url":"http://jser.info/post/5186960940","date":"2011-05-04T19:50:58+09:00","content":"今週はJSConf 2011やNodeConf 2011などEventsがいろいろあるためか、...","category":"JSer","tags":["jquery","debug","html5","Css","sass","ie9"]},{"title":"2011-05-10のJS: Browser.next、スケーラブルなJS、○○だけど質問ある?","url":"http://jser.info/post/5357697532","date":"2011-05-10T19:22:00+09:00","content":"現在、大体どのブラウザにもStable,Beta,Alpha,Nightlyとそれぞれビルドが...","category":"JSer","tags":["javascript","opera","node.js","jquery","test","browser"]},{"title":"2011-05-17のJS: jQuery 1.6.1リリース、new 演算子への理解、altJS","url":"http://jser.info/post/5567252835","date":"2011-05-17T12:58:00+09:00","content":"JSer.info #18 - jQuery 1.6で大きく変わったattr()と.prop(...","category":"JSer","tags":["jquery","memory","json","chrome","Firefox"]},{"title":"2011-05-25のJS: Firefox5ベータ版リリース、jQuery1.6移行時の注意点、Jasmine×Sinon","url":"http://jser.info/post/5826793874","date":"2011-05-25T15:35:00+09:00","content":"JSer.info #19 - Firefoxのリリースサイクルが変更されたため、次のバージョ...","category":"JSer","tags":["jquery","IE","firefox","test","books"]},{"title":"2011-06-02のJS: Firefox5～の変更点、JS卒論、Processing.js v1.2リリース","url":"http://jser.info/post/6105230415","date":"2011-06-02T21:04:00+09:00","content":"JSer.info #20 - ちょっと今週はFirefox関係が多めで、Firefox5と6...","category":"JSer","tags":["Firefox","javascript","test","chrome","IE","library"]},{"title":"O&#39;Reilly MediaがJavaScript関係の電子書籍とビデオを半額で販売中","url":"http://jser.info/post/6290733471","date":"2011-06-08T03:43:00+09:00","content":"O&amp;#8217;Reilly Media - Save 50% on Select JavaS...","category":"","tags":["javascript","books"]},{"title":"2011-06-09のJS: CSS2.1勧告、Modernizr 2リリース、O&#39;Reilly本半額","url":"http://jser.info/post/6347977553","date":"2011-06-09T17:04:00+09:00","content":"JSer.info #21 - 今週は、やたらとチュートリアルなものが多いです。(載せてないの...","category":"JSer","tags":["css","chrome","iOS","git","HTML5","Silverlight.","books"]},{"title":"2011-06-17のJS: IE9.0.1、Firefox5、Chrome13、YSlow for Mobile","url":"http://jser.info/post/6621321277","date":"2011-06-17T23:27:00+09:00","content":"JSer.info #22 - 今回から大雑把な区分を設けてみましたので、何かあったら言ってく...","category":"JSer","tags":["books","browser","chrome","test","webkit","IE"]},{"title":"2011-06-24のJS:高速リリースが始まったFirefox5、jQuery Mobile β1、Closure Library","url":"http://jser.info/post/6863638956","date":"2011-06-24T22:12:00+09:00","content":"JSer.info #23 - 今週はFirefoxの高速リリースサイクルが目に見えて動き出し...","category":"JSer","tags":["git","javascript","正規表現","tes","test","jquery"]},{"title":"2011-07-01のJS: IE10pp2、Opera 11.50、High Performance JavaScript","url":"http://jser.info/post/7114486162","date":"2011-07-01T17:26:00+09:00","content":"JSer.info #24 - IE10pp2とOpera 11.50がリリースされて、少しず...","category":"JSer","tags":["IE","opera","node.js"]},{"title":"2011-07-08のJS: IE10はレガシーな機能と決別、Firefox7のメモリ、Node 0.5.0","url":"http://jser.info/post/7381241575","date":"2011-07-08T22:04:00+09:00","content":"JSer.info #25 -今週は非常にあっさりとしてますが、IE10pp2でいろいろな挙動...","category":"JSer","tags":["IE10","ecma","node.js","chrome"]},{"title":"2011-07-16のJS: Node.js for windows、git.js、CSS Media Query","url":"http://jser.info/post/7679184409","date":"2011-07-16T14:34:00+09:00","content":"JSer.info #26 - 今週は結構いろいろありますが、Node で使える ECMA S...","category":"JSer","tags":["node.js",".css","jquery"]},{"title":"2011-07-24のJS: JavaScriptはどう学ぶ?、HiveJS、melonJS","url":"http://jser.info/post/7997466057","date":"2011-07-24T19:03:41+09:00","content":"JSer.info #27 -  今週はちょっと少なめ。What&amp;#8217;s a Clos...","category":"JSer","tags":["event"]},{"title":"2011-07-30のJS: ECMA-262第5版の和訳、Firebug1.8.0、JSテスティングフレームワーク","url":"http://jser.info/post/8253646288","date":"2011-07-30T19:24:00+09:00","content":"JSer.info #28 - ECMA-262第5版の日本語訳をやり始めた方がいるみたいです...","category":"JSer","tags":["es5","firebug","opera"]},{"title":"John Resig: Secrets of the JavaScript Ninja本が50%オフ","url":"http://jser.info/post/8257131693","date":"2011-07-30T23:04:00+09:00","content":"まだ先行販売の状態(MEAP)ですが、jQuery作者として知られるJohn Resigの書籍...","category":"","tags":["jquery","books"]},{"title":"2011-08-06のJS: jQuery Mobile β2リリース、migemojs、JavaScript Bibliography","url":"http://jser.info/post/8553074604","date":"2011-08-06T19:10:42+09:00","content":"JSer.info #29 - Chromeがやっとキャッシュ無効にするオプションをサポートす...","category":"JSer","tags":["jquery","firebug","slide"]},{"title":"2011-08-14のJS: typeof JS、HTML5 Boilerplate v2.0、JavaScript blast","url":"http://jser.info/post/8903788835","date":"2011-08-14T20:01:20+09:00","content":"JSer.info #30 -今週はJavaScript blastやFixing the J...","category":"JSer","tags":["node.js","ecma","html5"]},{"title":"2011-08-21のJS: YUI3.4.0、Firefox6リリース、HTML5 Weekly","url":"http://jser.info/post/9203508431","date":"2011-08-21T19:31:00+09:00","content":"Jser.info #31 - Firefox6が正式リリースされました。(続けてFirefo...","category":"JSer","tags":["Firefox"]},{"title":"2011-08-28のJS: How Browsers Work、XHRのテスト、Node.js in Action","url":"http://jser.info/post/9497025183","date":"2011-08-28T19:36:00+09:00","content":"JSer.info #32 - 今週は、何か濃い記事が多かった気がします。個人的にはAvoid...","category":"JSer","tags":["browser","debug","Css","security"]},{"title":"ebook: JavaScript Web AppsとThird-party JavaScriptが50%オフ","url":"http://jser.info/post/9656429651","date":"2011-09-01T13:33:00+09:00","content":"JavaScript Web Applications - O&amp;#8217;Reilly Me...","category":"","tags":["books","javascript"]},{"title":"2011-09-04のJS: jQuery 1.6.3リリース、ウェブ技術の歴史、RequireJS","url":"http://jser.info/post/9784004842","date":"2011-09-04T18:43:00+09:00","content":"JSer.info #33 - jQuery 1.6.3リリースされましたが、新しい機能などは...","category":"JSer","tags":["jquery","chrome"]},{"title":"2011-09-11のJS: jQuery Mobileβ3、MooTools 1.4.0リリース、pjaxとは","url":"http://jser.info/post/10077541175","date":"2011-09-11T20:21:00+09:00","content":"JSer.info #34 - &amp;#8220;How Browsers Work&quot;はやっぱり人...","category":"JSer","tags":["canvas","CSS","CoffeeScript"]},{"title":"O’Reilly Mediaで全てのebookとVideoが半額で、28日まで","url":"http://jser.info/post/10260022356","date":"2011-09-16T09:53:49+09:00","content":"O’Reilly MediaがBack to School Special - *Free t...","category":"","tags":["oreilly","books"]},{"title":"2011-09-18のJS: Node.js 0.4.12、IE10pp3、ECMAScript Support Matrix","url":"http://jser.info/post/10355725749","date":"2011-09-18T21:32:00+09:00","content":"JSer.info #35 - Windows 8開発者向けプレビュー版がリリースされ、その中...","category":"JSer","tags":["javascript","node.js","jquery","ie10"]},{"title":"2011-09-25のJS: setImmediate、WebStorm3.0 EAP","url":"http://jser.info/post/10636897479","date":"2011-09-25T19:07:00+09:00","content":"JSer.info #36 - 今週は少なめ。パーフェクトJavaScriptが発売されたりし...","category":"JSer","tags":["music","ecma","ide"]},{"title":"2011-10-02のJS: jQuery Mobile1.0RC、jQuery1.7β、CSS4セレクタ","url":"http://jser.info/post/10930860395","date":"2011-10-02T21:11:40+09:00","content":"JSer.info #37 - jQuery Mobile1.0RC1やjQuery 1.7β...","category":"JSer","tags":["Css","jquery","firefox","ecma","security"]},{"title":"2011-10-09のJS: WeakMap、デザインパターン、CSSアニメーション","url":"http://jser.info/post/11220208044","date":"2011-10-09T17:53:00+09:00","content":"JSer.info #38 - WeakMapやCSSアニメーションの使い方やXHR2のcro...","category":"JSer","tags":["jquery","ecma","firefox","design","w3c"]},{"title":"2011-10-16のJS: Dart言語、Deferredライブラリ、CSS Lint 0.7.0","url":"http://jser.info/post/11518711080","date":"2011-10-16T19:08:19+09:00","content":"JSer.info #39 - GoogleによりDart言語が公開されました。また、なぜか今...","category":"JSer","tags":["opera","WAI-ARIA","Dart","CSS"]},{"title":"2011-10-23のJS: RequireJS 1.0、$.Callbacks、MVC","url":"http://jser.info/post/11812454810","date":"2011-10-23T19:06:00+09:00","content":"JSer.info #40 - モジュールローダーのRequireJSが1.0になったりその他...","category":"JSer","tags":["javascript","jquery","firebug","MVC"]},{"title":"2011-10-31のJS: WebStorm半額、jQuery Standards Team、Project Silk","url":"http://jser.info/post/12160303191","date":"2011-10-31T23:18:26+09:00","content":"JSer.info #41 - HTML,CSS,JavaScript IDEとして優秀なWe...","category":"JSer","tags":["jquery","ide","ecma","svg"]},{"title":"2011-11-06のJS: jQuery 1.7リリース、AMD&amp;モジュール化、Chrome Developer Tools","url":"http://jser.info/post/12412054655","date":"2011-11-06T19:05:47+09:00","content":"JSer.info #42 -jQuery1.7がリリースされました。1.7ではイベントAPI...","category":"JSer","tags":["jquery","chrome","security","module"]},{"title":"2011-11-13のJS: node.js 0.6.0、Firefox8、CoffeeScript 1.1.3 リリース","url":"http://jser.info/post/12732710417","date":"2011-11-13T19:32:00+09:00","content":"JSer.info #43 - そろそろAdvent Calendarの季節ですが今年もいろい...","category":"JSer","tags":["css","oreilly","node.js"]},{"title":"2011-11-20のJS: jQuery Mobile 1.0、JavaScript Garden和訳、Sinon.JS","url":"http://jser.info/post/13055544324","date":"2011-11-20T19:14:42+09:00","content":"JSer.info #44 - jQuery Mobile 1.0がやっと正式リリースされまし...","category":"JSer","tags":[]},{"title":"Pragmatic Bookshelfの書籍が全て40%OFF","url":"http://jser.info/post/13300772554","date":"2011-11-26T00:42:40+09:00","content":"2011/11/25&amp;#160;00:01PST から 23:59PSTの間、表題の通りのキャ...","category":"","tags":["books"]},{"title":"2011-11-27のJS: Node v0.6.3、JavaScripture、Fullscreen API ","url":"http://jser.info/post/13398937895","date":"2011-11-27T22:45:00+09:00","content":"JSer.info #45 - jQuery1.7.1がリリースされていますが、次のjQuer...","category":"JSer","tags":["node.js","library","jquery","firefox"]},{"title":"Apress 全ての書籍が$15、O&#39;Reilly 一部書籍が60%オフ","url":"http://jser.info/post/13447659794","date":"2011-11-28T17:59:34+09:00","content":"O&amp;#8217;Reilly MediaとApressがそれぞれ本日限定のセールをやっています...","category":"","tags":[]},{"title":"2011-12-04のJS: JavaScript開発者アンケート、MooTools, Dojo アップデート、Firefoxの開発者ツールまとめ","url":"http://jser.info/post/13721219759","date":"2011-12-04T18:02:00+09:00","content":"JSer.info #46 - JavaScript Advent Calendar 2011...","category":"JSer","tags":["library","イベント","mvc","html5"]},{"title":"2011-12-11のJS: IE10pp4、Opera 11.60、テストフレームワークBuster.JS","url":"http://jser.info/post/14060819847","date":"2011-12-11T20:33:00+09:00","content":"JSer.info #47 - IE10pp4が公開されて、Typed arrayなどがサポー...","category":"JSer","tags":["ie10","opera","mobile"]},{"title":"2011-12-18のJS: Dartium公開、JS開発者アンケートの結果発表、Polyfilling The HTML5","url":"http://jser.info/post/14399524720","date":"2011-12-18T20:59:00+09:00","content":"JSer.info #48 -DartVMをサポートしたChromium(       Dar...","category":"JSer","tags":[]},{"title":"2011-12-25のJS: Knockout 2.0.0、Firefox11の変更点、WebStorm3.0リリース","url":"http://jser.info/post/14762879105","date":"2011-12-25T20:05:00+09:00","content":"JSer.info #49 - FIrefox 11(Aurora 11なので実際には少し入る...","category":"JSer","tags":["twitter","CSS","javascript","wai-aria","test"]},{"title":"2012-01-01のJS: Google Documentの仕組み、impress.js、YSlow for Command Line","url":"http://jser.info/post/15125294102","date":"2012-01-01T22:45:00+09:00","content":"JSer.info #50 - 今週は年末だったからか振り返り系の記事が多かったので、新しい記...","category":"JSer","tags":[]},{"title":"2012-01-09のJS: Node 0.6.7、Firebug1.9.0リリース、MVCライブラリ","url":"http://jser.info/post/15563719242","date":"2012-01-09T21:19:00+09:00","content":"JSer.info #51 -  Firebug 1.9.0がリリースされました。Firebu...","category":"JSer","tags":["firebug","node"]},{"title":"オフライン勉強会でJSer.info一周年について発表してきた","url":"http://jser.info/post/15883533195","date":"2012-01-15T22:42:00+09:00","content":"オフラインJavaScript勉強会 で発表してきた内容についてのまとめです。去年の1月16日...","category":"","tags":["イベント","javascript"]},{"title":"2012-01-15のJS: PhantomJS 1.4リリース、JSTestDriverの導入、Device APIs","url":"http://jser.info/post/15884909384","date":"2012-01-15T23:33:00+09:00","content":"JSer.info #52 - 今年に入ってから、JavaScriptのいわゆるMVCフレーム...","category":"JSer","tags":["javascript","coffeescript","mobile"]},{"title":"2012-01-22のJS: WebRTC、Node 0.7.0リリース、slimit","url":"http://jser.info/post/16285455811","date":"2012-01-22T21:56:52+09:00","content":"JSer.info #53 - Chromeのdev channelでWebRTCが利用できる...","category":"JSer","tags":["node.js","tools"]},{"title":"2012-01-29のJS: jQuery Mobile 1.0.1、Firebug 1.10a2リリース、XHR2の同期通信について","url":"http://jser.info/post/16692607671","date":"2012-01-29T21:34:28+09:00","content":"JSer.info #54 - jQuery MobileやRequireJSなどいろいろアッ...","category":"JSer","tags":[]},{"title":"2012-02-05のJS: Backbone.js 0.9.1、The little book on CoffeeScript、Sassチュートリアル","url":"http://jser.info/post/17086939482","date":"2012-02-05T20:40:02+09:00","content":"JSer.info #55 - Backbone.jsの0.9.0がリリースされて、すぐ後に0...","category":"JSer","tags":["Css","mobile","LESS","node.js"]},{"title":"2012-02-12のJS: HTML5 Boilerplate 3.0、Nodeチュートリアル、Pot.js 1.13","url":"http://jser.info/post/17484921080","date":"2012-02-12T22:20:40+09:00","content":"JSer.info #56 - HTML5 Boilerplate 3.0がリリースされました...","category":"JSer","tags":["jquery","html5"]},{"title":"2012-02-20のJS: Web Appsフィールドガイド、大規模JS開発、小さなテストフレームワーク","url":"http://jser.info/post/17928816205","date":"2012-02-20T13:31:00+09:00","content":"JSer.info #57 - JavaScriptのデザインパターンについて書かれたEsse...","category":"JSer","tags":["design","event"]},{"title":"2012-02-27のJS: Pot.jsリファレンス、WebStorm紹介、grunt","url":"http://jser.info/post/18317558076","date":"2012-02-27T00:56:28+09:00","content":"JSer.info #58 - &amp;#8220;ループ処理における CPU 負荷を抑え、UI に...","category":"JSer","tags":["library","WebStorm"]},{"title":"2012-03-04のJS: Buster.JS、IE 10 Consumer Preview、QUnitでのテスト","url":"http://jser.info/post/18719289543","date":"2012-03-04T18:50:00+09:00","content":"JSer.info #59 - Test-Driven JavaScript Developm...","category":"JSer","tags":["ie10","test"]},{"title":"2012-03-12のJS: Sencha Touch 2.0、IEの自動アップグレード、Visual Studio 11 ","url":"http://jser.info/post/19179024872","date":"2012-03-12T23:09:21+09:00","content":"JSer.info #60 - モバイルアプリケーション向けのフレームワークのSencha T...","category":"JSer","tags":["javascript","ide"]},{"title":"2012-03-18のJS: Firefox11リリース、Web Workers、オブジェクト指向JavaScript","url":"http://jser.info/post/19507539234","date":"2012-03-18T20:47:07+09:00","content":"JSer.info #61 - Firefox11がリリースされました。開発者ツールにスタイル...","category":"JSer","tags":["firefox"]},{"title":"2012-03-25のJS: jQuery1.7.2、PhantomJS 1.5、JavaScript「再」紹介","url":"http://jser.info/post/19892092053","date":"2012-03-25T23:14:23+09:00","content":"JSer.info #62 - A re-introduction to JavaScript...","category":"JSer","tags":["jquery","webkit","node.js"]},{"title":"2012-04-01のJS: Mocha 1.0、Opera 11.62、Webkit1 と WebKit2","url":"http://jser.info/post/20280249810","date":"2012-04-01T19:46:00+09:00","content":"JSer.info #63 - JavaScriptテストフレームワークであるMochaの1....","category":"JSer","tags":["commonjs","webkit","test"]},{"title":"2012-04-08のJS: はてな教科書(JavaScript によるイベントドリブン)、CodeGrid、Qatrix ","url":"http://jser.info/post/20712606758","date":"2012-04-08T23:03:00+09:00","content":"JSer.info #64 - はてな研修用教科書というものが公開されて、その中でJavaSc...","category":"JSer","tags":["jquery","ecma","html5"]},{"title":"2012-04-15のJS: jQuery Mobile 1.1.0、CoffeeScript 1.3.1、YUI 3.5.0 リリース","url":"http://jser.info/post/21139931818","date":"2012-04-15T19:39:00+09:00","content":"JSer.info #65 - jQuery MobileとかCoffeeScriptとかPh...","category":"JSer","tags":["jquery","coffeescript"]},{"title":"2012-04-23のJS: JavaScript Enlightenment、WebStorm 4.0、mag.js ","url":"http://jser.info/post/21644435501","date":"2012-04-23T22:06:44+09:00","content":"JSer.info #66 - &amp;#8220;A book to turn a JavaScr...","category":"JSer","tags":["node.js","test","jquery","webstorm","IE","firefox"]},{"title":"2012-04-29のJS: Ext JS 4.1、Moobile 0.1リリース、lodash","url":"http://jser.info/post/22046177789","date":"2012-04-29T22:37:00+09:00","content":"JSer.info #67 - MooToolsからモバイルWebアプリケーションフレームワー...","category":"JSer","tags":["coffeescript","library","Css","firefox"]},{"title":"2012-05-07のJS: Node.js 0.6.17、JavaScriptスタイルガイド、js3-mode","url":"http://jser.info/post/22585773615","date":"2012-05-07T22:29:00+09:00","content":"JSer.info #68 - HTML5ROCKSが他言語化されたので、一部記事などが翻訳さ...","category":"JSer","tags":["editor","node","security"]},{"title":"2012-05-13のJS: YUIDoc 0.3.0、document.writeを使うべきではない理由、ECMAScriptの現在/未来","url":"http://jser.info/post/22967498990","date":"2012-05-13T22:21:03+09:00","content":"JSer.info #69 - JavaScriptのコメントからAPIドキュメントを生成する...","category":"JSer","tags":["javascript","ecma","Yui"]},{"title":"2012-05-20のJS: HTML5 Video、AMD API、JavaScript Design Patterns ","url":"http://jser.info/post/23409442733","date":"2012-05-20T21:30:00+09:00","content":"JSer.info #70 - HTML5 Videoのブラウザの対応してる機能などを細かくま...","category":"JSer","tags":["node","jquery","backbone.js","AMD","html5"]},{"title":"2012-05-27のJS:XRegExp v2.0.0、SinonJS+JsTestDriver、ステートフルJavaScript","url":"http://jser.info/post/23856474655","date":"2012-05-27T20:33:45+09:00","content":"JSer.info #71 - @kyo_agoさんがJsTestDriverとSinon.J...","category":"JSer","tags":["test","sinon.js"]},{"title":"2012-06-04のJS: IE10 pp6、RequireJS 2.0、Fluent 2012、HTML5devconf","url":"http://jser.info/post/24400726739","date":"2012-06-04T22:15:00+09:00","content":"JSer.info #72 - AMDローダとして有名なRequireJS 2.0がリリースさ...","category":"JSer","tags":["AMD","Esprima"]},{"title":"2012-06-10のJS: Jasmine 1.2、Bunyip、JavaScriptのテストを書く7つの理由","url":"http://jser.info/post/24805047685","date":"2012-06-10T18:48:00+09:00","content":"JSer.info #73 - タイトルが全部JavaScriptテスト関係だったりしますが、...","category":"JSer","tags":["test"]},{"title":"2012-06-15のJS: Sentimental Version","url":"http://jser.info/post/25286638502","date":"2012-06-15T20:29:00+09:00","content":"JSer.info #75 - いわゆる幻のバージョン","category":"JSer","tags":["Opera","ide"]},{"title":"2012-06-17のJS: Opera 12、AngularJS 1.0、JavaScript IDE","url":"http://jser.info/post/25286638506","date":"2012-06-17T20:29:00+09:00","content":"JSer.info #74 - いわゆるテンプレートエンジンライブラリの一種のAngularJ...","category":"JSer","tags":["Opera","ide"]},{"title":"2012-06-24のJS: jQuery 1.8 β1、PhantomJS 1.6、パッケージマネージャーJam","url":"http://jser.info/post/25777657024","date":"2012-06-24T21:16:00+09:00","content":"JSer.info #76 - jQuery 1.8 β1がリリースされました。最近言われてた...","category":"JSer","tags":["AMD","jquery"]},{"title":"インタラクティブなJavaScriptテストフレームワークTestem","url":"http://jser.info/post/26266683374","date":"2012-07-01T17:47:00+09:00","content":"インタラクティブにテストを実行できるの目的として上げてるテスティングフレームワークのteste...","category":"","tags":["test","node.js"]},{"title":"2012-07-01のJS: Node v0.8.0、jQuery1.9のロードマップ、SVG入門","url":"http://jser.info/post/26270762728","date":"2012-07-01T20:41:13+09:00","content":"JSer.info #77 - Node.jsの安定版0.8.xがリリースされてました。JQC...","category":"JSer","tags":["node.js","jquery","SVG"]},{"title":"2012-07-08のJS: &quot;use strict&quot;;、ES5.1和訳、CoffeeScript入門","url":"http://jser.info/post/26759415982","date":"2012-07-08T21:40:19+09:00","content":"JSer.info #78 - JavaScriptでstrict modeの宣言を行う&amp;#8...","category":"JSer","tags":["ecma","coffeescript"]},{"title":"2012-07-18のJS: Sinon.JS 1.4.0、Firebug 1.10、Testacular","url":"http://jser.info/post/27409971975","date":"2012-07-18T00:21:00+09:00","content":"JSer.info #79 - stub/mock/spy テストライブラリの Sinon.J...","category":"JSer","tags":["test","firebug","node.js"]},{"title":"2012-07-22のJS: Enyo 2、Typed Arraysチュートリアル、MockライブラリDexter JS","url":"http://jser.info/post/27757077993","date":"2012-07-22T19:32:54+09:00","content":"JSer.info #80 - ウェブアプリケーションフレームワークのEnyo 2リリースされ...","category":"JSer","tags":["test"]},{"title":"2012-07-30のJS: MVC系フレームワークのまとめ、リファクタリングjQuery、サイ本第6版","url":"http://jser.info/post/28336147599","date":"2012-07-30T23:14:00+09:00","content":"JSer.info #81 - JavaScriptのMVC系(サバクラ両方で動く JavaS...","category":"JSer","tags":["jquery","mvc","books"]},{"title":"2012-08-06のJS: YUI 3.6.0、Processing.js 1.4.0、Testing with CoffeeScript","url":"http://jser.info/post/28836462847","date":"2012-08-06T23:26:25+09:00","content":"JSer.info #82 - YUI 3.6.0がリリースされました。なんとなく、YUI T...","category":"JSer","tags":["Yui","coffeescript","test"]},{"title":"2012-08-13のJS: jQuery 1.8、Prototype.js 1.7.1、JavaScriptの過去/現在/ES.next","url":"http://jser.info/post/29335611140/2012-08-13-js-jquery-1-8-prototype-js","date":"2012-08-14T09:31:42+09:00","content":"JSer.info #83 - jQuery 1.8がリリースされました。また、 Protot...","category":"JSer","tags":["ECMAScript","JavaScript","jQuery"]},{"title":"2012-08-19のJS: Benchmark.js 1.0.0、Dojo 1.8、Sass 3.2.0 リリース","url":"http://jser.info/post/29757737771/2012-08-19-js-benchmark-js-1-0-0-dojo-1-8-sass-3-2-0","date":"2012-08-19T23:22:22+09:00","content":"JSer.info #84 - JavaScriptのコードスニペットのベンチマークを取ったり...","category":"JSer","tags":["benchmark"]},{"title":"2012-08-26のJS: Lo-Dash v0.5、Twitter Bootstrap 2.1.0、Web Inspectorでメモリ管理デバッグ","url":"http://jser.info/post/30234300631","date":"2012-08-26T19:09:33+09:00","content":"JSer.info #85 - underscore.jsの互換ライブラリのLo-Dash v...","category":"JSer","tags":["library","css","debug"]},{"title":"2012-09-02のJS: Firefox 15.0、HTML5 Boilerplate 4.0、Javascript Scope Quiz","url":"http://jser.info/post/30721107732","date":"2012-09-02T21:29:14+09:00","content":"JSer.info #86 - Firefox 15.0がリリースされました。キーイベント関係...","category":"JSer","tags":["Firefox","HTML5","Quiz"]},{"title":"2012-09-10のJS: WebStorm、コールバックなコーディングガイド、Source Maps","url":"http://jser.info/post/31270435672","date":"2012-09-10T23:20:16+09:00","content":"JSer.info #87 - WebStorm等のJetBrains製IDEはBack To...","category":"JSer","tags":["webstorm","node.js","sourcemaps"]},{"title":"2012-09-16のJS:フロントエンドのワークフローツールYeomanリリース、CSS Lint v0.9.9","url":"http://jser.info/post/31650273373","date":"2012-09-16T19:46:00+09:00","content":"JSer.info #88 - 以前から話されていたフロントエンドのツールやライブラリでの開発...","category":"JSer","tags":["tools","Css"]},{"title":"2012-09-24のJS: ACE Editor 1.0、jQuery 1.8.2、DOM Enlightenment Book β公開","url":"http://jser.info/post/32195784626","date":"2012-09-24T22:38:00+09:00","content":"JSer.info #89 - Mozilla Skywriter (Bespin)の後継でも...","category":"JSer","tags":["IDE","HTML5","W3C","books","DOM"]},{"title":"2012-09-30のJS: Underscore.js 1.4.0、PhantomJS 1.7、部分適用とカリー化","url":"http://jser.info/post/32584928708","date":"2012-09-30T19:01:00+09:00","content":"JSer.info #90 - Underscore.js が久々にアップデートされて、幾つか...","category":"JSer","tags":["library","webkit","javascript"]},{"title":"2012-10-08のJS: TypeScript、jQuery Mobile 1.2.0、NetBeans 7.3","url":"http://jser.info/post/33157092650","date":"2012-10-08T22:20:00+09:00","content":"JSer.info #91 - MicrosoftからTypeScriptというJavaScr...","category":"JSer","tags":["TypeScript","jquery","ide"]},{"title":"2012-10-14のJS: Web Platform Docs 、jQuery UI 1.9.0、Firefox 16","url":"http://jser.info/post/33562219916","date":"2012-10-14T21:44:00+09:00","content":"JSer.info #92 - Web Platform Docs(WPD) がアナウンスされ...","category":"JSer","tags":["w3c","jquery","firefox","chrome"]},{"title":"2012-10-21のJS: Meteor 0.5.0 、AngularJSがTestacularに移行、alt属性のベストプラクティス","url":"http://jser.info/post/34024677162","date":"2012-10-21T22:17:00+09:00","content":"JSer.info #93 - Webアプリケーション用フレームワークのMeteor 0.5....","category":"JSer","tags":["test","mvc","debug"]},{"title":"2012-10-29のJS: JavaScriptパーサ Esprima 1.0.0、Orion 1.0、大規模CoffeeScript","url":"http://jser.info/post/34565313418","date":"2012-10-29T23:36:00+09:00","content":"JSer.info #94 - 既にいろいろなツールで使われていますが、JavaScriptパ...","category":"JSer","tags":["javascript","coffeescript"]},{"title":"2012-11-06のJS:Yeti 0.2.13、Knockout 2.2.0、jQuery deprecated API","url":"http://jser.info/post/35124613102/2012-11-06-js-yeti-0-2-13-knockout-2-2-0-jquery","date":"2012-11-06T22:29:06+09:00","content":"JSer.info #95 - Yeti 0.2.13がリリースされました。QUnitのサポー...","category":"JSer","tags":["jQuery","testing"]},{"title":"2012-11-12のJS: Sencha Touch 2.1、JavaScriptコーディングスタイル、WebStorm LiveEdit","url":"http://jser.info/post/35565193068","date":"2012-11-13T00:35:20+09:00","content":"JSer.info #96 - Sencha Touch 2.1、Sencha Cmd 3.0...","category":"JSer","tags":["WebStorm","Sencha"]},{"title":"2012-11-18のJS: Opera 12.10、jQuery 1.8.3、TypeScript 0.8.1","url":"http://jser.info/post/35980297909","date":"2012-11-18T20:40:13+09:00","content":"JSer.info #97 - Opera 12.10リリースされ、SPDY、Fullscre...","category":"JSer","tags":["opera","jquery","typescript"]},{"title":"2012-11-26のJS: RequireJS 2.1.2、CSS@supports、JSLint/JSHint 解説","url":"http://jser.info/post/36591986101","date":"2012-11-26T23:40:00+09:00","content":"JSer.info #98 - JavaScriptのAMDモジュールローダのRequireJ...","category":"JSer","tags":["AMD","CSS","Opera"]},{"title":"2012-12-03のJS: enchant.js v0.6.0、Graphical Timeline、Async JavaScript","url":"http://jser.info/post/37110877175","date":"2012-12-03T22:50:00+09:00","content":"JSer.info #99 - enchant.js v0.6.0がリリースされ、デフォルトが...","category":"JSer","tags":["canvas","firefox","books"]},{"title":"2012-12-10のJS: Firebug 1.11.0、Heap Profilerでのメモリリーク調査、CSS testing tools","url":"http://jser.info/post/37638024456","date":"2012-12-10T23:43:00+09:00","content":"JSer.info #100 - Firebug 1.11.0がリリースされました。Fireb...","category":"JSer","tags":["firebug","chrome","debug","Css","testing"]},{"title":"2012-12-18のJS:ブラウザバグ報告手順、jQuery Deferred、DOM Compatibility Tables","url":"http://jser.info/post/38149485673","date":"2012-12-18T00:38:00+09:00","content":"JSer.info #101 - ブラウザのバグを見つけた場合にどのように報告するかについてま...","category":"JSer","tags":["jquery","browser","debug","dom"]},{"title":"WebStormがマヤセール中","url":"http://jser.info/post/38385083557","date":"2012-12-21T00:13:49+09:00","content":"WebStormの場合、新規個人ライセンスが $12 で、珍しくアップグレードにもセールが適応...","category":"","tags":[]},{"title":"2012-12-23のJS: jQuery1.9での変更点まとめ、Back-Forwad Cache、Chrome Devloper Tools解説","url":"http://jser.info/post/38627451843","date":"2012-12-24T00:00:00+09:00","content":"JSer.info #102 - 先週jQuery 1.9 Beta 1が公開されましたが、以...","category":"JSer","tags":["jquery","chrome","debug","browser"]},{"title":"2012-12-31のJS: PhantomJS 1.8、CasperJS 1.0リリース、Unit Testing JavaScript","url":"http://jser.info/post/39300263537","date":"2012-12-31T20:55:00+09:00","content":"JSer.info #103 - PhantomJS 1.8がリリースされました。大きな点とし...","category":"JSer","tags":["testing","backbone.js","altJS","github"]},{"title":"2013-01-08のJS: Secrets of the JavaScript Ninja、Effective JavaScript、 ES5でのJavaScript category: JSer Objects","url":"http://jser.info/post/39934331924","date":"2013-01-08T01:27:00+09:00","content":"JSer.info #104 - 書き始めてから4年ぐらい経ったと思われますが、ついにSecr...","category":"","tags":["javascript","books"]},{"title":"2013-01-14のJS: jQuery 1.9RC1、HTML5 Bones、JavaScriptリファレンス","url":"http://jser.info/post/40517175879","date":"2013-01-14T22:49:00+09:00","content":"JSer.info #105 - jQuery 1.9のRC1がリリースされました。jQuer...","category":"JSer","tags":["jquery","html5","javascript"]},{"title":"2013-01-21のJS: jQuery 1.9、Testing jQuery Plugins、JavaScript testing boilerplate","url":"http://jser.info/post/41104670903","date":"2013-01-22T00:07:00+09:00","content":"JSer.info #106 - jQuery 1.9やjQuery UI 1.10.0がリリ...","category":"JSer","tags":["jquery","testing"]},{"title":"2013-01-29のJS: QUnit 1.11、アンチパターンでみるTestable JavaScript、jQueryのDeferredとPromise","url":"http://jser.info/post/41782477547","date":"2013-01-29T22:42:00+09:00","content":"Jser.info #107 - QUnitが久々がアップデートがでてQUnit 1.11がリ...","category":"JSer","tags":["testing","jquery"]},{"title":"2013-02-03のJS: jQuery Migrate 1.1.0、Testling-CI、Effective JavaScript日本語版","url":"http://jser.info/post/42182271353","date":"2013-02-03T21:40:00+09:00","content":"JSer.info #108 - jquery-migrate 1.1.0がリリースされました...","category":"JSer","tags":["jquery","books","testing"]},{"title":"2013-02-11のJS: jQuery 1.9.1 、video／audio要素のQ&amp;A、解説Chrome Dev Tools","url":"http://jser.info/post/42835565455","date":"2013-02-11T20:24:00+09:00","content":"JSer.info #109 - jQuery 1.9.1 リリースされました。主にbugfi...","category":"JSer","tags":["jquery","chrome","html5"]},{"title":"2013-02-18のJS: OperaがWebkitへ移行、TodoMVC 1.1 、Lo-Dash 1.0.0リリース","url":"http://jser.info/post/43400440609","date":"2013-02-18T23:58:00+09:00","content":"JSer.info #110 - Opera DesktopがレンダリングエンジンとしてPre...","category":"JSer","tags":["jquery","mvc","library"]},{"title":"2013-02-26のJS: jQuery Mobile 1.3.0、 testacular 0.6.0、Grunt 0.4","url":"http://jser.info/post/44059391525","date":"2013-02-26T21:57:53+09:00","content":"JSer.info #111 - jQuery Mobile 1.3.0リリースされました。J...","category":"JSer","tags":[]},{"title":"2013-03-04のJS: JSHint 1.0.0、NetBeans 7.3リリース、開発者のための WebKit","url":"http://jser.info/post/44539128842","date":"2013-03-04T22:33:00+09:00","content":"JSer.info #112 - JSHint 1.0.0がリリースされました。大部分の更新内...","category":"JSer","tags":["tools","webkit","ide"]},{"title":"2013-03-11のJS: Zepto.js 1.0 、WebStorm 6.0、Tern/Aulx/Scripted","url":"http://jser.info/post/45109695078","date":"2013-03-11T23:23:00+09:00","content":"JSer.info #113 - jQuery-compatibleなライブラリのZepto....","category":"JSer","tags":["AST","javascript","jquery"]},{"title":"2013-03-18のJS: Node v0.10.0、setIntervalで非同期処理を回すコードのリファクタリング、CSSフレームワークのまとめ","url":"http://jser.info/post/45671679801","date":"2013-03-18T22:47:00+09:00","content":"JSer.info #114 - Node v0.10.0のメジャーアップデートが公開されまし...","category":"JSer","tags":["node","Css"]},{"title":"2013-03-24のJS: Backbone 1.0、CI as a Service 、DOMイベント基礎からLv4","url":"http://jser.info/post/46157633733","date":"2013-03-24T22:39:48+09:00","content":"JSer.info #115 - Backbone.js 1.0がリリースされました。test...","category":"JSer","tags":["MVC","testing","dom"]},{"title":"2013-04-01のJS: PhantomJS 1.9、Same-Origin Policy、JITコンパイル","url":"http://jser.info/post/46842509372","date":"2013-04-01T21:27:57+09:00","content":"JSer.info #116 - PhantomJS 1.9がリリースされました。外部プロセス...","category":"JSer","tags":["webkit","JIT","Security"]},{"title":"Chrome Blink よくある質問の翻訳まとめ","url":"http://jser.info/post/47339713468","date":"2013-04-07T13:41:41+09:00","content":"GoogleがWebkitをフォークして新しいレンダリングエンジンとしてBlinkを発表しまし...","category":"","tags":["Google","Chrome","Webkit","翻訳"]},{"title":"2013-04-08のJS: Chrome Blink、Firefox 20.0、EPUB 3 仕様書和訳","url":"http://jser.info/post/47454955299","date":"2013-04-08T22:32:32+09:00","content":"JSer.info #117 - GoogleはChromiumプロジェクトのレンダリングエン...","category":"JSer","tags":["chrome","Webkit","firefox","epub"]},{"title":"2013-04-15のJS: jQuery 2.0 Beta 3、実践メモリプロファイリング、WebStorm&amp;AngularJS","url":"http://jser.info/post/48040853605","date":"2013-04-15T23:15:00+09:00","content":"JSer.info #118 - jQuery 2.0 Beta 3がリリースされました。No...","category":"JSer","tags":["jquery","chrome","webstorm","movie"]},{"title":"2013-04-21のJS: jQuery 2.0 、Sencha Touch 2.2、Grunt日本語リファレンス","url":"http://jser.info/post/48526589776","date":"2013-04-21T23:50:00+09:00","content":"JSer.info #119 - jQuery 2.0がリリースされました。以前発表されたロー...","category":"JSer","tags":["jquery","webkit","sencha"]},{"title":"2013-04-29のJS: TypeScript 0.9α、Jade入門、JavaScript Ninja","url":"http://jser.info/post/49173192636","date":"2013-04-29T20:58:00+09:00","content":"JSer.info #120 - TypeScript 0.9.0 Alphaが公開されました...","category":"JSer","tags":["TypeScript","Node","Books"]},{"title":"2013-05-07のJS: Sinon.JS 1.7.1、The Politics of JavaScript、Intern(Test)","url":"http://jser.info/post/49854959525","date":"2013-05-07T23:11:30+09:00","content":"JSer.info #121 - Sinon.JS 1.7.1 リリース。$.ajax or ...","category":"JSer","tags":["testing","slide"]},{"title":"2013-05-13のJS:  JSHint 2.0.0、JSDoc 3移行ガイド、ES6 generator","url":"http://jser.info/post/50341060452","date":"2013-05-13T22:50:00+09:00","content":"JSer.info #122 - JSHint 2.0.0リリース。JSHint 1.0.0が...","category":"JSer","tags":["tool","JSDoc"]},{"title":"2013-05-20のJS: Web Components、Firefox 21.0、Regular Expression Enlightenment","url":"http://jser.info/post/50905119483","date":"2013-05-20T22:22:00+09:00","content":"JSer.info #123 - PolymerというWeb Componentsのpolyf...","category":"JSer","tags":["Firefox","RexExp","Book"]},{"title":"2013-05-27のJS: JSHint 2.1.0 、jQuery 1.10.0 、Writing Testable JavaScript ","url":"http://jser.info/post/51471360040","date":"2013-05-27T22:23:00+09:00","content":"JSer.info #124 - rapid releaseを採用したJSHintですが早速2...","category":"JSer","tags":["jQuery","testing"]},{"title":"2013-06-03のJS: WebStorm 7 EAP、Seleniumとは何か、ECMAScript 6 Overview、","url":"http://jser.info/post/52055156113","date":"2013-06-03T22:34:00+09:00","content":"JSer.info #125 - WebStorm 7 EAP(いわゆるα版)がリリースされま...","category":"JSer","tags":["WebStorm","ecmascript"]},{"title":"2013-06-10のJS: Bower入門、描画パフォーマンスとGPU、JavaScript refresh","url":"http://jser.info/post/52625615075","date":"2013-06-10T22:44:48+09:00","content":"JSer.info #126 - Bower入門(基礎編) - from scratchという...","category":"JSer","tags":["tool","Chrome","debug","javascript"]},{"title":"2013-06-17のJS: Gmailでのメモリ管理、requestAnimationFrame、DOM Future と DOM の将来","url":"http://jser.info/post/53196035548","date":"2013-06-17T23:26:41+09:00","content":"JSer.info #127 - Google I/Oの発表されたGmailでのメモリ管理につ...","category":"JSer","tags":["DOM","memory"]},{"title":"2013-06-24のJS: TypeScript 0.9、Dart βリリース、CSP1.0","url":"http://jser.info/post/53755615195","date":"2013-06-24T22:29:00+09:00","content":"JSer.info #128 - TypeScript 0.9が正式リリースされました。ジェネ...","category":"JSer","tags":["TypeScript","Dart","CSP","Security"]},{"title":"2013-07-02のJS:  Firefox 22、ES6 Module 、Generators*、SlimerJS","url":"http://jser.info/post/54348875825","date":"2013-07-02T00:57:00+09:00","content":"JSer.info #129 - Firefox 22.0がリリースされました。WebRTCが...","category":"JSer","tags":["Firefox","ES6"]},{"title":"2013-07-08のJS: Opera 15、JavaScriptのオブジェクト指向、 SpiderMonkey Parser API","url":"http://jser.info/post/54913696698","date":"2013-07-08T22:54:32+09:00","content":"JSer.info #130 - ChromiumベースとなったOpera 15がリリースされ...","category":"JSer","tags":["opera","javascript"]},{"title":"2013-07-16のJS: Jasmineとモック、Chrome Dev Tools新機能まとめ、ESLint","url":"http://jser.info/post/55601042473","date":"2013-07-16T22:44:00+09:00","content":"JSer.info #131 - JavaScriptでテストのためのspyやmock,stu...","category":"JSer","tags":["jasmine","Chrome","ecmascript","tools"]},{"title":"2013-07-23のJS: jQuery Mobile 1.3.2、Bower 1.0.0、Test Private Functions","url":"http://jser.info/post/56242966779","date":"2013-07-24T00:04:00+09:00","content":"JSer.info #132 - jQuery Mobile 1.3.2がリリースされました。...","category":"JSer","tags":["jquery","ECMSCript","module"]},{"title":"High-Quality JavaScript Code ツールまとめ","url":"http://jser.info/post/56525802407/high-quality-javascript-code","date":"2013-07-27T01:34:32+09:00","content":"  High-Quality JavaScript Code  from Den Odellと...","category":"","tags":["JavaScript","スライド","まとめ"]},{"title":"2013-07-29のJS: IE11 DP on Windows7、ES6 modulesの使い方、JS オブジェクト指向","url":"http://jser.info/post/56695943944/2013-07-29-js-ie11-dp-on-windows7-es6-modules-js","date":"2013-07-29T00:48:00+09:00","content":"JSer.info #133 - Windows7向けにIE11 Developer Prev...","category":"JSer","tags":["JavaScript","Windows","IE11","ES6"]},{"title":"2013-08-05のJS: JSHint 2.1.6、Web Tracing Framework、Handlebars","url":"http://jser.info/post/57425671735","date":"2013-08-05T22:49:00+09:00","content":"JSer.info #134 - JSHint 2.1.6がリリースされています。ES6のyi...","category":"JSer","tags":["JavaScript","DOM","library"]},{"title":"2013-08-12のJS: Firefox 23.0、W3C Highlights@2013、DalekJS","url":"http://jser.info/post/58058890591","date":"2013-08-12T23:15:00+09:00","content":"JSer.info #135 - Firefox 23.0がリリースされました。Firefox...","category":"JSer","tags":["Firefox","W3C","Selemium","DalekJS"]},{"title":"2013-08-19のJS: Bootstrap 3 RC2、Firefox25 開発ツール、ES6の新しい文法とES5","url":"http://jser.info/post/58698279190/2013-08-19-js-bootstrap-3-rc2-firefox25","date":"2013-08-19T23:25:00+09:00","content":"JSer.info #136 - Bootstrap 3 RC2(aka. Twitter B...","category":"JSer","tags":["CSS","Firefox","Debug","ES6"]},{"title":"2013-08-26のJS: Yeoman 1.0、Meta-Weekly、Power Assert in JavaScript","url":"http://jser.info/post/59394147051/2013-08-26-js-yeoman-1-0-meta-weekly-power-assert-in","date":"2013-08-26T22:48:06+09:00","content":"JSer.info #137 - Yeoman 1.0がリリースされました。yo コマンドの分...","category":"JSer","tags":["JavaScript","testing","website"]},{"title":"2013-09-02のJS: Ember.js 1.0、ECMAScript i18n API、メンテナブルCSS","url":"http://jser.info/post/60073198740/2013-09-02-js-ember-js-1-0-ecmascript-i18n","date":"2013-09-02T22:22:04+09:00","content":"JSer.info #138 - 長いRCがおわりEmber.js 1.0とEmber Dat...","category":"JSer","tags":["EmberJS","ECMAScript","i18n","CSS"]},{"title":"2013-09-09のJS:WebStorm 7.0β、@@ iterator、Enterprise Web Development","url":"http://jser.info/post/60753350918/2013-09-09-js-webstorm-7-0-iterator-enterprise-web","date":"2013-09-09T23:21:15+09:00","content":"JSer.info #139 - WebStorm 7.0 Betaがリリースされました。EJ...","category":"JSer","tags":["WebStorm","ES6","book"]},{"title":"2013-09-16のJS: Lo-Dash 2.0、CSS Flexbox、regexp.js","url":"http://jser.info/post/61403252910/2013-09-16-js-lo-dash-2-0-flexbox-regexp-js","date":"2013-09-16T22:06:54+09:00","content":"JSer.info #140 - lodash v2.0.0がリリースされました。変更の詳細は...","category":"JSer","tags":["JavaScript","Underscore.js","CSS","RegExp"]},{"title":"2013-09-24のJS: jQuery2.1 β1、Buster.JS v0.7.4、Tableタグガイド","url":"http://jser.info/post/62154098795/2013-09-24-js-jquery2-1-1-buster-js-v0-7-4-table","date":"2013-09-24T23:39:43+09:00","content":"JSer.info #141 - jQuery 1.11 and 2.1 Beta 1 がリリ...","category":"JSer","tags":["jQuery","Buster.JS","HTML"]},{"title":"2013-09-29のJS: WebStorm 7.0、WebGL 2.0、AngularJSデバッグ&amp;テスト","url":"http://jser.info/post/62619483902/2013-09-29-js-webstorm-7-0-webgl-2-0-angularjs","date":"2013-09-29T23:48:48+09:00","content":"JSer.info #142 - WebGL 2 Specificationのfirst ed...","category":"JSer","tags":["WebGL","WebStorm","AngularJS","Testing","Debug"]},{"title":"2013-10-07のJS: なぜテストをするのか、console API、PromisesライブラリBluebird","url":"http://jser.info/post/63373114717/2013-10-07-js-console","date":"2013-10-07T23:17:06+09:00","content":"JSer.info #143 - Testable &amp;amp; Tested Client-s...","category":"JSer","tags":["JavaScript","testing","debug","library"]},{"title":"2013-10-15のJS: Backbone.js 1.1.0、MV*データバインディング、Knockout 3.0RC","url":"http://jser.info/post/64115054116/2013-10-15-js-backbone-js-1-1-0-mv-knockout","date":"2013-10-15T23:16:15+09:00","content":"JSer.info #144 - Backbone.js 1.1.0 がリリースされました。1...","category":"JSer","tags":["MVC"]},{"title":"Packt Publishingの書籍が全て50%オフのセール中","url":"http://jser.info/post/64570955675/packt-publishing-50","date":"2013-10-20T21:50:46+09:00","content":"Packt Publishingの全ての書籍がクーポンコード COL50 で半額で買えるように...","category":"","tags":["book","JavaScript"]},{"title":"2013-10-21のJS: JSHint 2.3.0、Node v0.10.21、Promises and Generators","url":"http://jser.info/post/64677530544/2013-10-21-js-jshint-2-3-0-node-v0-10-21-promises-and","date":"2013-10-21T22:30:16+09:00","content":"JSer.info #145 - JavaScriptのLintツールJSHint 2.3.0...","category":"JSer","tags":["JSHint","Node.js","Promises","Generators"]},{"title":"2013-10-29のJS: iv / lv5 1.0.0、Knockout.js 3.0、Snap.svg","url":"http://jser.info/post/65340412002/2013-10-29-js-iv-lv5-1-0-0-knockout-js-3-0-snap-svg","date":"2013-10-29T00:23:07+09:00","content":"JSer.info #146 -  ECMA262&amp;#160;5.1仕様準拠のECMAScri...","category":"JSer","tags":["ECMAScript","JavaScript","MVC","SVG"]},{"title":"2013-11-06のJS: WebStormのMochaサポート、ESLint 0.1.0、ヘッドレスIE","url":"http://jser.info/post/66177916780/2013-11-06-js-webstorm-mocha-eslint-0-1-0-ie","date":"2013-11-06T20:23:13+09:00","content":"JSer.info #147 - WebStorm 7.0.2 RCがリリースされ、Karma...","category":"JSer","tags":["WebStorm","ECMAScript","Tools","IE"]},{"title":"2013-11-11のJS: AngularJS 1.2.0、ブラウザ間を超えたRemoteDebug protocol","url":"http://jser.info/post/66677981011/2013-11-11-js-angularjs-1-2-0-remotedebug","date":"2013-11-11T23:57:56+09:00","content":"JSer.info #148 - AngularJS 1.2.0がリリースされました。Anim...","category":"JSer","tags":["AngularJS","Debug","Browser"]},{"title":"2013-11-18のJS: Dart 1.0、jQuery 2.1.0 Beta 2、60fpsのスクロール","url":"http://jser.info/post/67363001788","date":"2013-11-18T22:12:02+09:00","content":"JSer.info #149 - Dartが発表されてから約2年、 Dart SDK 1.0が...","category":"JSer","tags":["Dart","jQuery","performance"]},{"title":"2013-11-25のJS: Grunt 0.4.2、IE6-11の互換性機能、AngularJSとEmber.js","url":"http://jser.info/post/68059706431/2013-11-25-js-grunt","date":"2013-11-25T22:31:00+09:00","content":"JSer.info #150 - Grunt 0.4.2 がリリースされました。grunt.f...","category":"JSer","tags":["Grunt","IE","AngularJS","EmberJS"]},{"title":"Pragmatic Bookshelfの書籍等が全て半額のセール中","url":"http://jser.info/post/68062359944/pragmatic-bookshelf","date":"2013-11-25T23:26:03+09:00","content":"Rubyを中心にOreillyと並んで技術書のebookに強いThe Pragmatic Bo...","category":"","tags":["Books"]},{"title":"ManningのJavaScript書籍が全て半額のセール中","url":"http://jser.info/post/68115394733","date":"2013-11-26T10:00:14+09:00","content":"Manning PublicationsAction本等で知られるManning Public...","category":"","tags":["JavaScript","book"]},{"title":"2013-12-03のJS:YUI 3.14.0、JavaScript開発者アンケート、JavaScript Test Runner比較","url":"http://jser.info/post/68881229249/2013-12-03-js-yui-3-14-0-javascript-javascript","date":"2013-12-04T00:03:26+09:00","content":"JSer.info #151 - YUI 3.14.0がリリースされました。ちょっと面白い感じ...","category":"JSer","tags":["YUI","アンケート","ES6","Promises","Testing"]},{"title":"2013-12-09のJS: browserify v3.0、TypeScript 0.9.5、power-doctest","url":"http://jser.info/post/69487144209/2013-12-09-js-browserify-v3-0-typescript","date":"2013-12-09T23:59:58+09:00","content":"JSer.info #152 - node.js向けのスタイルで書かれたものをブラウザで動くよ...","category":"JSer","tags":["node.js","TypeScript","testing"]},{"title":"2013-12-16のJS: Firefox 26、JavaScript開発者アンケート結果、MV*ライブラリとセキュリティ","url":"http://jser.info/post/70188909334/2013-12-16-js-firefox","date":"2013-12-16T22:59:46+09:00","content":"JSer.info #153 - Firefox 26がリリースされました。主な変更点や追加機...","category":"JSer","tags":["Firefox","JavaScript","MVC","Security"]},{"title":"2013-12-23のJS: Jasmine 2.0、Promises x Generator、Koa、ストリーミングビルドシステムgulp","url":"http://jser.info/post/70888873447/2013-12-23-js-jasmine-2-0-promises-x","date":"2013-12-23T21:05:55+09:00","content":"JSer.info #154 - JavaScripttテストフレームワークのJasmine2...","category":"JSer","tags":["jasmine","testing","promises","generator","node.js"]},{"title":"2013-12-31のJS: JSHint 2.4.0、koaチュートリアル、Selenium Builder","url":"http://jser.info/post/71734160602/2013-12-31-js-jshint-2-4-0-koa-selenium-builder","date":"2013-12-31T17:38:51+09:00","content":"JSer.info #155 - JSHint 2.4.0 がリリースされました。bugfix...","category":"JSer","tags":["JSHInt","Node.js","Selenium"]},{"title":"2014-01-06のJS:Koa 0.2.0、jQuery Mobile 1.4.0、Functional JavaScript","url":"http://jser.info/post/72442862507/2014-01-06-js-koa-0-2-0-jquery-mobile-1-4-0-functional","date":"2014-01-06T23:57:02+09:00","content":"JSer.info #156 - NodeのWebフレームワークであるKoa 0.2.0(0....","category":"JSer","tags":["node.js","jQuery","mobile","FP"]},{"title":"Graspを使ったJavaScriptのリファクタリング","url":"http://jser.info/post/73202282881/grasp-javascript","date":"2014-01-13T22:23:32+09:00","content":"Refactoring your JavaScript code with Grasp | G...","category":"","tags":["JavaScript","AST","Console","Tools"]},{"title":"2014-01-13のJS: sweet.js 0.4.0、Generatorチュートリアル、同期的に書ける結合テストフレームワークTestium","url":"http://jser.info/post/73206411885/2014-01-13-js-sweet-js","date":"2014-01-13T23:41:46+09:00","content":"JSer.info #157 - JavaScriptをマクロを使って展開出来るSweet.j...","category":"JSer","tags":["macro","generator","debug","testing","node.js"]},{"title":"third anniversary","url":"http://jser.info/post/73484514668/third-anniversary","date":"2014-01-16T13:48:00+09:00","content":"今日で JSer.info を初めてから丸3年が経ちました。2011-01-16のJavaSc...","category":"","tags":["JavaScript"]},{"title":"2014-01-21のJS: jQuery 2.1.0 RC1リリース、browserify入門、ECMAScript 6 @ 2013","url":"http://jser.info/post/73953487267/2014-01-21-js-jquery-2-1-0","date":"2014-01-21T00:59:20+09:00","content":"JSer.info #158 - jQuery 1.11.0 RC1 と 2.1.0 RC1が...","category":"JSer","tags":["jquery","browserify","ES6"]},{"title":"2014-01-27のJS:ESLint 0.3.0、jQuery 2.1リリース、Backbone.Marionette","url":"http://jser.info/post/74722015170/2014-01-27-js-eslint-0-3-0-jquery","date":"2014-01-27T22:57:01+09:00","content":"JSer.info #159 - JS ASTをベースとしてJavaScriptのLintツー...","category":"JSer","tags":["ECMAScript","Lint","jQuery","Backbone.js"]},{"title":"JSer.infoに紹介してもらいたい記事のPull Requestが出来るようになりました","url":"http://jser.info/post/75446735069/jser-info-pull-request","date":"2014-02-03T13:09:16+09:00","content":"JSer.info Pull Request Form というサイトを作りました。どういうサイ...","category":"","tags":["github","AngularJS","browserify"]},{"title":"2014-02-03のJS: Bootstrap 3.1.0、CoffeeScript1.7.0、アクセシブルなアイコンフォント","url":"http://jser.info/post/75477390938/2014-02-03-js-bootstrap","date":"2014-02-03T22:15:57+09:00","content":"JSer.info #160 - Bootstrap 3.1.0がリリースされました。ドキュメ...","category":"JSer","tags":["CSS","Bootstrap","CoffeeScript","Fonts"]},{"title":"2014-02-10のJS: Firefox 27、Promisesガイドライン、Sweet.js チュートリアル","url":"http://jser.info/post/76223855511/2014-02-10-js-firefox-27-promises-sweet-js","date":"2014-02-11T00:03:27+09:00","content":"JSer.info #161 - Firefox 27がリリースされました。CSSのall:u...","category":"JSer","tags":["Firefox","Promises","Sweet.js"]},{"title":"2014-02-17のJS: ESLint 0.4.0、Underscore 1.6.0、Gruntとgulp","url":"http://jser.info/post/76953562122/2014-02-17-js-eslint-0-4-0-underscore-1-6-0-grunt-gulp","date":"2014-02-17T22:50:01+09:00","content":"JSer.info #162 - plugableなJavaScript LintツールのES...","category":"JSer","tags":["ECMAScript","AST","Grunt","gulp"]},{"title":"あなたが読むべきJavaScript Promises","url":"http://jser.info/post/77696682011/es6-promises","date":"2014-02-24T21:36:44+09:00","content":"はじめにこの記事は、 JavaScript/ES6 promisesについてを理解するために読...","category":"","tags":["ECMAScript","Promises","JavaScript"]},{"title":"2014-02-24のJS: Gruntfileのメンテナンス、Promisesアンチパターン、ES6 Fiddle","url":"http://jser.info/post/77704000553/2014-02-24-js-gruntfile-promises-es6","date":"2014-02-25T00:00:56+09:00","content":"JSer.info #163 - Maintainable Gruntfile.js - fr...","category":"JSer","tags":["Grunt","Promises","ES6"]},{"title":"2014-03-03のJS : TypeScript 1.0RC、Rewriting With ES6、Webアプリのセキュリティ入門","url":"http://jser.info/post/78438562725/2014-03-03-js-typescript-1-0rc-rewriting-with","date":"2014-03-03T23:04:45+09:00","content":"JSer.info #164 - TypeScript 1.0RCがリリースされました。元々は...","category":"JSer","tags":["TypeScript","ES6","Security"]},{"title":"2014-03-10のJS: Sass 3.3、Orion 5.0.0、Speaking JavaScript","url":"http://jser.info/post/79162569101/2014-03-10-js-sass-3-3-orion-5-0-0-speaking-javascript","date":"2014-03-10T22:39:23+09:00","content":"JSer.info #165 - Sass 3.3.0がリリースされました。新しいデータタイプ...","category":"JSer","tags":["Sass","book"]},{"title":"2014-03-17のJS: Karma 0.12.0、mocha 1.18.0、Promisesエラーハンドリング、実践Browserify","url":"http://jser.info/post/79869632329/2014-03-17-js-karma-0-12-0-mocha","date":"2014-03-17T23:33:59+09:00","content":"JSer.info #166 - JavaScript test runnerのKarma v...","category":"JSer","tags":["testing","node.js","promises","browserify"]},{"title":"2014-03-24のJS: AngularJS 2.0、JavaScript Lintツールの現状と未来","url":"http://jser.info/post/80570556661/2014-03-24-js-angularjs-2-0-javascript-lint","date":"2014-03-24T21:44:28+09:00","content":"JSer.info #167 - 以前からちょこちょこDesign docsが公開されていまし...","category":"JSer","tags":["AngularJS","Lint","Tools","JavaScript"]},{"title":"2014-03-31のJS: Esprima 1.1.1、WebStorm 8.0、JavaScriptとメモリリーク","url":"http://jser.info/post/81291650500/2014-03-31-js-esprima-1-1-1-webstorm","date":"2014-03-31T23:38:10+09:00","content":"JSer.info #168 - JavaScriptパーサーのEsprima 1.1.1がリ...","category":"JSer","tags":["JavaScript","AST","WebStorm","node.js"]},{"title":"2014-04-07のJS: TypeScript 1.0、JSHint 2.5.0、Chromeの非同期処理デバッグ","url":"http://jser.info/post/81989727221/2014-04-07-js-typescript-1-0-jshint","date":"2014-04-07T22:37:11+09:00","content":"JSer.info #169 - MSによるJavaScriptのスーパーセット実装であるTy...","category":"JSer","tags":["TypeScript","JavaScript","Tools","Chrome","Debug"]},{"title":"2014-04-14のJS: Chrome35β、JavaScript非同期処理、spy-js","url":"http://jser.info/post/82675654535/2014-04-14-js-chrome35-javascript-spy-js","date":"2014-04-14T19:01:38+09:00","content":"JSer.info #170 - Chrome 35 Betaがリリースされました。Stabl...","category":"JSer","tags":["Chrome","JavaScript","Async","WebStorm"]},{"title":"2014-04-21のJS: Kendo UI、JS Recipes、square/esnext ","url":"http://jser.info/post/83405640735/2014-04-21-js-kendo-ui-js-recipes-square-esnext","date":"2014-04-21T21:39:31+09:00","content":"JSer.info #171 - Telerikが開発してるKendo UI Coreがオープ...","category":"JSer","tags":["JavaScript","UI","ECMAScript","Tools"]},{"title":"2014-04-29のJS: Firefox29、Promises、ES6へ向けて","url":"http://jser.info/post/84230597159/2014-04-29-js-firefox29-promises-es6","date":"2014-04-30T00:50:19+09:00","content":"JSer.info #172 - Firefox 29がリリースされました。UI的にも大きな変...","category":"JSer","tags":["Firefox","Promises","ECMAScript"]},{"title":"2014-05-06のJS: Node 0.11.13、ECMAScript 6入門、JS Testing Recipes","url":"http://jser.info/post/84910244174/2014-05-06-js-node-0-11-13-ecmascript-6-js-testing","date":"2014-05-06T18:17:30+09:00","content":"JSer.info #173 - Node v0.11.13 (Unstable)がリリースさ...","category":"JSer","tags":["Node.js","ECMAScript","JavaScript","Testing","book"]},{"title":"2014-05-12のJS: browserify 4.0.0、JSテスト環境の移行、ES6-Learning","url":"http://jser.info/post/85527368079/2014-05-12-js-browserify-4-0-0-js-es6-learning","date":"2014-05-12T23:42:56+09:00","content":"JSer.info #174 - browserify 4.0.0がリリースされました。(もう...","category":"JSer","tags":["browserify","JavaScript","testing","ES6"]},{"title":"2014-05-20のJS: ESLint 0.6.0、browserifyハンドブック、HTML Imports","url":"http://jser.info/post/86306165694/2014-05-20-js-eslint-0-6-0-browserify-html","date":"2014-05-20T22:23:02+09:00","content":"JSer.info #175 - JavaScript LintツールのESLint 0.6....","category":"JSer","tags":["ECMAScript","JavaScript","Tools","browserify","HTML"]},{"title":"2014-05-26のJS: Chrome35-36、Object.observe、React.jsチュートリアル","url":"http://jser.info/post/86894902744/2014-05-26-js","date":"2014-05-26T22:56:19+09:00","content":"JSer.info #176 - Chrome 35のstableがリリースされました。以前紹...","category":"JSer","tags":["Chrome","ECMAScript","React.js"]},{"title":"2014-06-02のJS: gulp3.7、Socket.IO1.0、JSConf US 2014","url":"http://jser.info/post/87594529109/2014-06-02-js-gulp3-7-socket-io1-0-jsconf-us-2014","date":"2014-06-02T22:48:33+09:00","content":"JSer.info #177 - ビルドツールであるgulpの3.7.0がリリースされました。...","category":"JSer","tags":["JavaScript","tools","node.js","イベント"]},{"title":"2014-06-09のJS: Bluebird 2.0.0、ES6のリリーススケジュール、Nodeで作るコマンドラインツール","url":"http://jser.info/post/88276341744/2014-06-09-js-bluebird","date":"2014-06-09T23:37:42+09:00","content":"JSer.info #178 - JavaScriptのPromise実装ライブラリであるBl...","category":"JSer","tags":["promises","ECMAScript","ES6","Node.js"]},{"title":"2014-06-17のJS: Firefox30.0、Firebug 2.0、IE Developer Channel","url":"http://jser.info/post/89057149744/2014-06-17-js-firefox30-0-firebug-2-0-ie-developer","date":"2014-06-17T22:48:08+09:00","content":"JSer.info #179 - Firefox 30がリリースされました。XHRなどDOMの...","category":"JSer","tags":["Firefox","Firebug","IE","browser"]},{"title":"2014-06-23のJS: Backbone.Marionette 2.0.0、Orion 6.0、JavaScript Promise","url":"http://jser.info/post/89652992559/2014-06-23-js-backbone-marionette-2-0-0-orion","date":"2014-06-23T22:21:58+09:00","content":"JSer.info #180 - Backbone.Marionetteがメジャーアップデート...","category":"JSer","tags":["backbone","IDE","editor","JavaScript","Promises"]},{"title":"2014-06-30のJS: jQuery UI 1.11.0、ビルドツールWebPack、QuickStart、Firefox DevTools","url":"http://jser.info/post/90349855204/2014-06-30-js-jquery-ui","date":"2014-06-30T22:10:23+09:00","content":"JSer.info #181 - jQuery UI 1.11.0がリリースされました。AMD...","category":"JSer","tags":["jquery","JavaScript","browser","browserify","Firefox","debug"]},{"title":"2014-07-07のJS: Dart 1st Edition、Intern 2.0、7 Patterns to Refactor","url":"http://jser.info/post/91041422669/2014-07-07-js-dart-1st-edition-intern-2-0-7-patterns","date":"2014-07-07T21:24:00+09:00","content":"JSer.info #182 - Googleが主に開発してるDart言語のEcma標準仕様と...","category":"JSer","tags":["Dart","JavaScript","testing"]},{"title":"2014-07-15のJS: ESLint 0.7.1、Ember 1.6.0、初めてのJavaScriptデバッグ","url":"http://jser.info/post/91847418764/2014-07-15-js-eslint-0-7-1-ember","date":"2014-07-15T22:52:01+09:00","content":"JSer.info #183 - ESLint 0.7.1がリリースされました。設定ファイル周...","category":"JSer","tags":["JavaScript","ECMAScript","Ember","Debug"]},{"title":"2014-07-22のJS: Chrome36、Web ComponentsとPolyfillとCustom Element","url":"http://jser.info/post/92530743429/2014-07-22-js-chrome36-web-components-polyfill-custom","date":"2014-07-22T22:25:47+09:00","content":"JSer.info #184 - Chrome 36.0がリリースされました。同じくChrom...","category":"JSer","tags":["Chrome","Opera","WebComponents","Polymer","library"]},{"title":"2014-07-28のJS: Browserify 5.0.0リリース、AngularJSとセキュリティ","url":"http://jser.info/post/93108308634/2014-07-28-js-browserify-5-0-0-angularjs","date":"2014-07-28T22:02:22+09:00","content":"JSer.info #185 - Node.jsスタイルで書いモジュールをブラウザでも動かせる...","category":"JSer","tags":["browser","browserify","angularjs","security"]},{"title":"JSer.infoをTumblrからGitHub Pagesに移行しました","url":"http://jser.info/2014/08/03/renewal/","date":"2014-08-03T00:00:00+09:00","content":"JSer.info を Tumblr から Jekyllベースのブログへと移行しました。ドメイ...","category":"雑記","tags":["Jekyll","GitHub"]},{"title":"2014-08-04のJS: traceur-compiler入門、Eloquent JavaScript第二版","url":"http://jser.info/2014/08/04/traceur-eloquentjavascript/","date":"2014-08-04T00:00:00+09:00","content":"JSer.info #186 - traceur-compiler 入門 - from scr...","category":"JSer","tags":["ES6","traceur","book","JSer.info"]},{"title":"2014-08-11のJS: WebStorm 9 EAP、Server Sent Events、IEのサポートサイクル","url":"http://jser.info/2014/08/11/WebStorm9EAP-SSE-IE/","date":"2014-08-11T00:00:00+09:00","content":"JSer.info #187 - WebStorm 9 EAP(Early Access Pr...","category":"JSer","tags":["JavaScript","WebStorm","SSE","IE","Windows"]},{"title":"2014-08-19のJS: Sass 3.4、Compass 1.0、IE11/F12開発者ツール","url":"http://jser.info/2014/08/19/sass-compass-ie11/","date":"2014-08-19T00:00:00+09:00","content":"JSer.info #188 - Sass 3.4がリリースされました。parent sele...","category":"JSer","tags":["JavaScript","Sass","Compass","IE","debug"]},{"title":"2014-08-25のJS: Autoprefixer 3.0、JavaScriptのオブジェクト、Next Component","url":"http://jser.info/2014/08/25/autoprefixer-js-object/","date":"2014-08-25T22:09:00+09:00","content":"JSer.info #189 - CSSファイルに対してvendor prefixを付加できる...","category":"JSer","tags":["CSS","JavaScript","パッケージ管理","Components"]},{"title":"2014-09-01のJS: Underscore 1.7.0、Browserify入門、Gravit","url":"http://jser.info/2014/09/01/underscore-browserify-Gravit/","date":"2014-09-01T08:19:00+09:00","content":"JSer.info #190 - Underscore 1.7.0がリリースされました。破壊的...","category":"JSer","tags":["JavaScript","Broserify","Design","software","node-webkit"]},{"title":"2014-09-08のJS: Chrome 37/Opera 24、Firefox 32、ESLint 0.8.0","url":"http://jser.info/2014/09/08/chrome-opera-firefox-eslint/","date":"2014-09-08T21:38:00+09:00","content":"JSer.info #191 - Chrome 37とOpera 24(Chromium 37...","category":"JSer","tags":["Chrome","Opera","Firefox","AST","ECMAScript"]},{"title":"2014-09-15のJS: JavaScriptエンジンの最適化、ビルドツールBroccoli","url":"http://jser.info/2014/09/15/v8-react-broccoli/","date":"2014-09-15T21:24:00+09:00","content":"JSer.info #192 - 今週はnodeconfeuがあったのと、自分でも最適化につい...","category":"JSer","tags":["JavaScript","V8","ビルド","Tools","イベント","Performance"]},{"title":"2014-09-23のJS: npm 2.0.0、iOS8 WKWebView、Node.jsとPromise","url":"http://jser.info/2014/09/23/npm2-ios8-promises/","date":"2014-09-23T16:58:00+09:00","content":"JSer.info #193 - Node.jsのパッケージ管理ツールであるnpm 2.0.0...","category":"JSer","tags":["node.js","npm","iOS","Promises"]},{"title":"2014-09-30のJS: Gruntの現在と未来、React.js、The Mobile Web Handbook","url":"http://jser.info/2014/09/30/grunt-react-mobile/","date":"2014-09-30T22:36:00+09:00","content":"JSer.info #194 - The State of Gruntというスライドでは、Gr...","category":"JSer","tags":["JavaScript","Grunt","React","Flux"]},{"title":"JSer.info 200回記念イベントを11月1日に行います","url":"http://jser.info/events/jser200","date":"2014-10-06T12:00:00+09:00","content":"JSer.info 大体200回目を記念した11月1日(土)にイベントを行います。JSer.i...","category":"","tags":["JavaScript","イベント"]},{"title":"2014-10-06のJS: localForage 1.0.0、Promises API、FluxとReactとBackbone.js","url":"http://jser.info/2014/10/06/promise-flux-react-backbone/","date":"2014-10-06T19:59:00+09:00","content":"JSer.info #195 - IndexedDBやWebSQLやlocalStorage等...","category":"JSer","tags":["JavaScript","Promise","localstorage","Flux","React","Backbone.js"]},{"title":"2014-10-14のJS: Chrome 38リリース、ES6をES5へお手軽に変換","url":"http://jser.info/2014/10/14/chrome38-es6to5/","date":"2014-10-14T19:40:00+09:00","content":"JSer.info #196 - Chrome 38のStable版がリリースされました。Ch...","category":"JSer","tags":["Chrome","ECMAScript","Tools"]},{"title":"2014-10-20のJS: Firefox 33、Reactとは何か、FormatJS","url":"http://jser.info/2014/10/19/firefox33-react-formatjs/","date":"2014-10-19T23:31:00+09:00","content":"JSer.info #197 - Firefox 33.0がリリースされました。Chromeや...","category":"JSer","tags":["Firefox","React","i18n","library"]},{"title":"2014-10-27のJS: WebStorm 9、ESLint 0.9.0、AngularJS 2.0とAtScript","url":"http://jser.info/2014/10/27/webstorm9-eslint-atscript/","date":"2014-10-27T19:41:00+09:00","content":"JSer.info #198 - WebStorm 9がリリースされました。新たにMeteor...","category":"JSer","tags":["WebStorm","IDE","Lint","Tools","TypeScript","AngularJS"]},{"title":"2014-11-02のJS: Bootstrap 3.3.0、CSP Lv.2、Object.observe()の未来","url":"http://jser.info/2014/11/02/bootstrap3.3.0-csplv2-object.observe/","date":"2014-11-02T17:35:00+09:00","content":"JSer.info #199 - Bootstrap 3.3.0がリリースされました。tran...","category":"JSer","tags":["CSS","CSP","セキュリティ","JavaScript","MVC","React"]},{"title":"JSer.info 200回記念イベントを開催しました","url":"http://jser.info/2014/11/02/jser200/","date":"2014-11-02T19:26:00+09:00","content":"JSer.info #200 - 11月1日に大体200回目の投稿を記念するという名目でJSe...","category":"JSer","tags":["JSer","JavaScript","イベント"]},{"title":"2014-11-10のJS: Less 2.0、Vue.js 0.11、Model-View-Intent","url":"http://jser.info/2014/11/10/less2-vue-mvi/","date":"2014-11-10T20:46:00+09:00","content":"JSer.info #201 - CSSプリプロセッサであるLess 2.0がリリースされまし...","category":"JSer","tags":["Less","CSS","Vue.js","VirtualDOM"]},{"title":"2014-11-17のJS: IEプレビュー版のES6サポート、Jasmine 2.1.0、TypeScript 1.3","url":"http://jser.info/2014/11/17/ie11-es6-jasmine/","date":"2014-11-17T21:17:00+09:00","content":"JSer.info #202 - Windows 10の新しいプレビュー版が公開されたため、I...","category":"JSer","tags":["IE","ES6","Testing"]},{"title":"2014-11-25のJS: Chrome 39、デバッグTips、Facebook Flow","url":"http://jser.info/2014/11/25/chrome39-debug-flowtype/","date":"2014-11-25T08:12:00+09:00","content":"JSer.info #203 - Chrome 39がリリースされました。実装された機能などに...","category":"JSer","tags":["Chrome","debug","Flow","Type"]},{"title":"2014-12-02のJS: JavaScript開発者アンケート、フレームワーク or ライブラリ、関数型プログラミング","url":"http://jser.info/2014/12/02/survey-framework-library-functional-js/","date":"2014-12-02T09:47:00+09:00","content":"JSer.info #204 - 今年もDailyJSによるJavaScript開発者向けアン...","category":"JSer","tags":["アンケート","Angular","JavaScript","library"]},{"title":"2014-12-08のJS: Firefox 34、QUnit 1.16、ES7 Async Generator","url":"http://jser.info/2014/12/08/firefox-qunit-es7-async/","date":"2014-12-08T19:47:00+09:00","content":"JSer.info #205 - Firefo 34.0がリリースされました。Firefox開...","category":"JSer","tags":["Firefox","testing","webpack","ES7","非同期"]},{"title":"2014-12-16のJS: ES6 Proxy、Web Components、Service Worker","url":"http://jser.info/2014/12/16/es6proxy-serviceworker/","date":"2014-12-16T22:00:00+09:00","content":"JSer.info #206 - Meta programming with ECMAScri...","category":"JSer","tags":["ES6","WebComponents","ServiceWorker"]},{"title":"2014-12-23のJS: 開発者アンケート結果、Protractorの仕組み、パフォーマンスチューニング","url":"http://jser.info/2014/12/23/survey2014-protractor-performance/","date":"2014-12-23T18:26:00+09:00","content":"JSer.info #207 - DailyJSが毎年この時期にやっているアンケートであるJa...","category":"JSer","tags":["アンケート","E2E","Performance","JavaScript","Angular"]},{"title":"2014-12-30のJS: jsdom 2.0.0、6to5 2.0.0、HTMLBars","url":"http://jser.info/2014/12/30/jsdom-6to5-htmlbars/","date":"2014-12-30T22:54:00+09:00","content":"JSer.info #208 - DOMのJavaScript実装(Node.jsでも動くDO...","category":"JSer","tags":["JavaScript","DOM","ECMAScript","テンプレート"]},{"title":"2015-01-06のJS: ESLint 0.11.0、Browserifyとwebpack、TypeScriptの本","url":"http://jser.info/2015/01/06/eslint0.11-browserify-webpack-typescript/","date":"2015-01-06T22:24:00+09:00","content":"JSer.info #209 - JavaScript LintツールであるESLint 0....","category":"JSer","tags":["JavaScript","Lint","tools","Browserify","webpack","TypeScript"]},{"title":"2015-01-13のJS: 6to5、ES6とjspm、リファクタリングJavaScript","url":"http://jser.info/2015/01/13/6to5-jspm-refactoring-javascript/","date":"2015-01-13T21:44:00+09:00","content":"JSer.info #210 - ES6+のコードをES5に変換するツールである6to5の公式...","category":"JSer","tags":["ES6","リファクタリング","JavaScript","modules"]},{"title":"JSer.info 4周年","url":"http://jser.info/2015/01/16/4-years/","date":"2015-01-16T07:35:00+09:00","content":"今日でJSer.infoは4周年です。この一年の間に、Ju U-YeongさんによるJSer....","category":"雑記","tags":["JavaScript"]},{"title":"2015-01-20のJS: TypeScript 1.4、io.js 1.0、bluebird 2.7のglobal rejection events","url":"http://jser.info/2015/01/20/typescript1.4-iojs-bluebird2.7/","date":"2015-01-20T22:24:00+09:00","content":"JSer.info #211 - TypeScript 1.4がリリースされました。以前Typ...","category":"JSer","tags":["TypeScript","Node.js","io.js","Promise","library"]},{"title":"2015-01-28のJS: Vivaldi、lodash 3.0.0、JavaScriptテスト概要","url":"http://jser.info/2015/01/28/vivaldi-lodash3-js-tests/","date":"2015-01-28T00:14:00+09:00","content":"JSer.info #212 - 元OperaのCEOによるChromiumベースのブラウザで...","category":"JSer","tags":["Browser","Opera","library","Testing"]},{"title":"2015-02-02のJS: 6to5 Ver3.0、CoffeeScript 1.9.0、PhantomJS 2.0","url":"http://jser.info/2015/02/02/6to5-coffeescript-phantomjs/","date":"2015-02-02T20:09:00+09:00","content":"JSer.info #213 - ES6+αのコードをES5へ変換するツールである6to5のV...","category":"JSer","tags":["ES6","CoffeeScript","webkit"]},{"title":"2015-02-09のJS: Node v0.12.0、Esprima 2.0、CSS Reference","url":"http://jser.info/2015/02/09/nodejs-0.12-esprima2.0-css-reference/","date":"2015-02-09T19:38:00+09:00","content":"JSer.info #214 - ついにNode v0.12.0がリリースされました。最近では...","category":"JSer","tags":["Node.js","AST","JavaScript","CSS","リファレンス"]},{"title":"2015-02-17のJS: Babel(6to5)、BrowserSync 2.0、Flux実装比較","url":"http://jser.info/2015/02/17/6to5-to-babel-browsersync-flux/","date":"2015-02-17T00:00:00+09:00","content":"JSer.info #215 - ES6+のコードをES5に変換するツールである6to5がBa...","category":"JSer","tags":["Tools","ES6","Flux","library"]},{"title":"2015-02-23のJS: Underscore.js 1.8.0、CodeMirror 5.0、Web Audio入門","url":"http://jser.info/2015/02/23/underscore1.8-codemirror5.0-web-audio-api/","date":"2015-02-23T22:21:00+09:00","content":"JSer.info #216 - Underscore.js 1.8.0がリリースされています...","category":"JSer","tags":["JavaScript","library","Editor","WebAudio"]},{"title":"2015-03-02のJS: Firefox 36.0、ASTのコミュニティ標準、Service Worker","url":"http://jser.info/2015/03/02/firefox36-ast-serviceworker/","date":"2015-03-02T22:32:00+09:00","content":"JSer.info #217 - Firefox 36.0がリリースされました。CSSの機能追...","category":"JSer","tags":["JavaScript","Firefox","AST","ServiceWorker"]},{"title":"2015-03-09のJS: ESLint 0.16.0、AtScript is TypeScript","url":"http://jser.info/2015/03/09/eslint0.16-atscript-is-typescript/","date":"2015-03-09T20:58:00+09:00","content":"JSer.info #218 - ESLint 0.16.0がリリースされました。ESLint...","category":"JSer","tags":["ECMAScript","AtScript","TypeScript"]},{"title":"2015-03-16のJS: React v0.13、Chrome 42β、モダンJavaScriptの歴史","url":"http://jser.info/2015/03/16/react0.13-chrome42beta-modern-js-hisotory/","date":"2015-03-16T22:31:00+09:00","content":"JSer.info #219 - React v0.13がリリースされました。React.Co...","category":"JSer","tags":["React","Chrome","history"]},{"title":"2015-03-23のJS: IEのアップデート、RxJS入門、Chrome DevToolsの新機能と計測の仕方","url":"http://jser.info/2015/03/23/ie-rxjs-chrome-devtools/","date":"2015-03-23T22:49:00+09:00","content":"JSer.info #220 - Windows 10 Technical Previewがア...","category":"JSer","tags":["IE","Chrome","debug","performance"]},{"title":"2015-03-31のJS: Dart to JS、ES6 Generator、Reactでシングルページアプリケーション作成","url":"http://jser.info/2015/03/31/dart-generator-react-tutorial/","date":"2015-03-31T22:04:00+09:00","content":"JSer.info #221 - DartをChromeに載せることは諦めて、DartをJav...","category":"JSer","tags":["Dart","ES6","React","tutorial"]},{"title":"2015-04-06のJS: Babel 5.0.0と次期ECMAScript、Bower 1.4.0、JSCSと自動整形","url":"http://jser.info/2015/04/06/babel5-bower-jscs/","date":"2015-04-06T22:53:00+09:00","content":"JSer.info #222 - ES6+のコードをES5相当に変換するツールであるBabel...","category":"JSer","tags":["JavaScript","ECMAScript","Bower","tool"]},{"title":"2015-04-14のJS: 初代jQueryをコードリーディング、npmのエコシステムとプロトタイピング","url":"http://jser.info/2015/04/14/jQuery-origin/","date":"2015-04-14T23:06:00+09:00","content":"JSer.info #223 - John Resig - Annotated Version...","category":"JSer","tags":["jQuery","コードリーディング","npm","GitHub"]},{"title":"2015-04-20のJS: ECMAScript6最終ドラフト、JavaScriptトレーニング","url":"http://jser.info/2015/04/20/es6-final-draft-js-traning/","date":"2015-04-20T22:12:00+09:00","content":"JSer.info #224 - 次期ECMAScriptであるES6 Rev 38 Fina...","category":"JSer","tags":["ECMAScript","JavaScript","tutorial"]},{"title":"2015-04-29のJS: Globalize 1.0、Flux実装、Code Smellsの検出","url":"http://jser.info/2015/04/29/globalize-flux-code-smells/","date":"2015-04-29T23:17:00+09:00","content":"JSer.info #225 - CLDRベースの国際化対応ライブラリであるjquery/gl...","category":"JSer","tags":["i18n","Flux","JavaScript"]},{"title":"2015-05-06のJS: io.js 2.0.0、Microsoft Edge、Isomorphic","url":"http://jser.info/2015/05/06/iojs2.0.0-msedge-isomorphic/","date":"2015-05-06T22:09:00+09:00","content":"JSer.info #226 - Node.jsのforkであるio.js 2.0.0がリリー...","category":"JSer","tags":["Node.js","io.js","ECMAScript","MS","IE"]},{"title":"2015-05-12のJS: ECMAScript 2015(ES6)入門、最近のnpmの変更点を見る","url":"http://jser.info/2015/05/12/ecmascript2015-npm/","date":"2015-05-12T19:21:00+09:00","content":"JSer.info #227 - Rubyist Magazine - 2015 年の Jav...","category":"JSer","tags":["ES6","ECMAScript","npm","Node.js"]},{"title":"2015-05-19のJS: Firefox 38、Backbone.js 1.2.0、マイクロベンチマークの問題","url":"http://jser.info/2015/05/19/firefox38-babel-bench/","date":"2015-05-19T23:03:00+09:00","content":"JSer.info #228 - Firefox 38.0がリリースされました。タブやウィンド...","category":"JSer","tags":["Firefox","Backbone","MVC","V8","ベンチマーク"]},{"title":"2015-05-27のJS: Promiseのありがちな間違い、AngularJS 2に向けて、Plain JS","url":"http://jser.info/2015/05/27/promise-angular2/","date":"2015-05-27T22:12:00+09:00","content":"JSer.info #229 - We have a problem with promise...","category":"JSer","tags":["Promise","AngularJS","DOM","jQuery"]},{"title":"2015-06-02のJS: AngularJS 1.4.0、Polymer 1.0リリース、今後のJSの流れ","url":"http://jser.info/2015/06/02/Angular1.4.0-Polymer1.0/","date":"2015-06-02T19:32:00+09:00","content":"JSer.info #230 - AngularJS 1.4.0がリリースされました。ngAn...","category":"JSer","tags":["Angular","WebComponents"]},{"title":"JSer.infoについて","url":"http://jser.info/about/","date":"2015-06-10T00:00:00+09:00","content":"このサイトについて。JSer.infoは世界中言語問わずJavaScriptの情報を紹介してい...","category":"meta","tags":[]},{"title":"2015-06-10のJS: ブラウザとES6の状況、Web Audio APIチュートリアル","url":"http://jser.info/2015/06/10/es6-status-webaudio/","date":"2015-06-10T12:45:00+09:00","content":"JSer.info #231 - Safari 9.0の変更点が公開されています。JavaSc...","category":"JSer","tags":["WebAudio","ES6","Safari","Chrome","MSEdge"]},{"title":"2015-06-16のJS: Vue.js 0.12、Exploring ES6、2015年のJavaScriptの流れ","url":"http://jser.info/2015/06/16/vue0.12-exploring-es6-2015/","date":"2015-06-16T22:00:00+09:00","content":"JSer.info #232 - MVVMライブラリであるVue.js 0.12がリリースされ...","category":"JSer","tags":["ES6","book","JSer","Vue","MVVM"]},{"title":"2015-06-23のJS: ECMAScript 6公開、SVGガイド、JSConf US 2015","url":"http://jser.info/2015/06/23/es6-svg-jsconfus/","date":"2015-06-23T21:06:00+09:00","content":"JSer.info #233 - ECMAScript 2015(aka. ES6)がEcma...","category":"JSer","tags":["ES6","Promise","SVG","動画"]},{"title":"2015-06-30のJS: Ember Data Stableリリース、JavaScriptアンケート","url":"http://jser.info/2015/06/30/ember-data-survey/","date":"2015-06-30T20:28:00+09:00","content":"JSer.info #234 - Ember DataがついにStableリリースされました。...","category":"JSer","tags":["Ember","アンケート","JavaScript","ECMAScript"]},{"title":"2015-07-06のJS: React v0.14 Beta 1、Firefox 39、ES6アンケート結果","url":"http://jser.info/2015/07/06/react-0.14-firefox39-es6/","date":"2015-07-06T22:23:00+09:00","content":"JSer.info #235 - React v0.14 Beta 1がリリースされました。大...","category":"JSer","tags":["React","Firefox","JSer.info"]},{"title":"JSHint: A Formal Commitment to New Language Features","url":"http://jser.info/2015/07/11/jshint-new-lang-features/","date":"2015-07-11T14:53:00+09:00","content":"A Formal Commitment to New Language FeaturesJSH...","category":"JavaScript","tags":["JSHint","ECMAScript","ES.next","community"]},{"title":"2015-07-14のJS: jQuery 3.0αリリース、JSHintとES.next","url":"http://jser.info/2015/07/14/jquery3.0-jshint-esnext/","date":"2015-07-14T22:40:00+09:00","content":"JSer.info #236 - jQuery 3.0αがリリースされました。jQuery 3...","category":"JSer","tags":["jQuery","ECMAScript","JSHint","Lint"]},{"title":"2015-07-21のJS: TypeScript 1.5、Web Components概要、ブラウザの情報源","url":"http://jser.info/2015/07/21/typescript1.5-webcomponents-browser/","date":"2015-07-21T22:54:00+09:00","content":"JSer.info #237 -  TypeScript 1.5がリリースされました。Anno...","category":"JSer","tags":["TypeScript","WebCompoents","Browser"]},{"title":"2015-07-28のJS: Chrome 45β、ES6チュートリアル、Chrome開発者ツール本","url":"http://jser.info/2015/07/28/chrome45-es6-devtools/","date":"2015-07-28T23:11:00+09:00","content":"JSer.info #238 - Chrome 45 Betaがリリースされました。Chrom...","category":"JSer","tags":["Chrome","ES6","debug"]},{"title":"2015-08-03のJS: ESLint 1.0.0、JSCS 2.0.0、Esprima 2.5.0","url":"http://jser.info/2015/08/03/eslint-jscs-esprima/","date":"2015-08-03T21:52:00+09:00","content":"JSer.info #239 - JavaScript LintツールであるESLint 1....","category":"JSer","tags":["Lint","Tool","AST","ES6","JavaScript"]},{"title":"2015-08-10のJS: io.js 3.0、RxJS 3.0、MSEdgeとは","url":"http://jser.info/2015/08/10/io.js3.0-rxjs3.0-msedge/","date":"2015-08-10T22:23:00+09:00","content":"JSer.info #240 - io.js 3.0.0がリリースされました。V8 4.4.6...","category":"JSer","tags":["io.js","Rx","MSEdge"]},{"title":"2015-08-17のJS: Redux 1.0.0、flux-utils、Firefox 40","url":"http://jser.info/2015/08/17/redux-flux-utils-firefox40/","date":"2015-08-17T20:21:00+09:00","content":"JSer.info #241 - Fluxのように単方向データの流れを行うフレームワークである...","category":"JSer","tags":["flux","library","firefox"]},{"title":"2015-08-24のJS: Bootstrap 4α、PostCSS 5.0、Node.jsとio.js","url":"http://jser.info/2015/08/24/bootstrap-postcss-node-iojs/","date":"2015-08-24T22:00:00+09:00","content":"JSer.info #242 - CSSフレームワークであるBootstrap 4 alpha...","category":"JSer","tags":["CSS","bootstrap","Node.js","io.js","community"]},{"title":"JSer.infoのロゴやアイコンを更新しました","url":"http://jser.info/2015/08/26/update-logo/","date":"2015-08-26T09:48:00+09:00","content":"JSer.infoのロゴやTwitterのアイコンを更新しました。Tweets by @jse...","category":"other","tags":["JSer.info"]},{"title":"2015-09-02のJS: MSEdgeとasm.js、単方向データフローのアーキテクチャ、CSS仕様書の読み方","url":"http://jser.info/2015/09/02/msedge-unidirectional-architectures-read-css/","date":"2015-09-02T21:38:00+09:00","content":"JSer.info #243 - Windows 10 Build 10532が公開され付属す...","category":"JSer","tags":["Flux","MVC","MSEdge","CSS","Spec"]},{"title":"2015-09-09のJS: Node.js 4.0.0、TypeScript 1.6β、React 0.14の変更点","url":"http://jser.info/2015/09/09/node4.0.0-typescript1.6beta-react/","date":"2015-09-09T23:16:00+09:00","content":"JSer.info #244 - Node.js 4.0.0がリリースされました。Node v...","category":"JSer","tags":["Node.js","io.js","TypeScript","React"]},{"title":"2015-09-16のJS: React 0.14 RC、ESLint 1.4.0、改めてECMAScript 5","url":"http://jser.info/2015/09/16/react-0.14-eslint-1.4-es5/","date":"2015-09-16T19:00:00+09:00","content":"JSer.info #245 - React 0.14 RCがリリースされました。React ...","category":"JSer","tags":["React","ESLint","Lint","ES5"]},{"title":"2015-09-25のJS: Firefox 41.0、npm 3.x stableリリース、XRegExp 3.0.0","url":"http://jser.info/2015/09/25/firefox41-npm3-xregexp3/","date":"2015-09-25T15:18:00+09:00","content":"JSer.info #246 - Firefox 41.0がリリースされました。Firefox...","category":"JSer","tags":["Firefox","npm","node","regexp","library"]},{"title":"2015-09-29のJS: Redux 3.0リリース、JavaScriptのライブラリを公開する方法","url":"http://jser.info/2015/09/29/redux3.0-js-library/","date":"2015-09-29T22:08:00+09:00","content":"JSer.info #247 - Redux v3.0.0がリリースされました。v3.0.0で...","category":"JSer","tags":["Redux","Flux","library","GitHub","JavaScript"]},{"title":"2015-10-08のJS: React 0.14、ESLintの使い方、ES6の末尾呼び出し最適化","url":"http://jser.info/2015/10/08/react0.14-eslint-tail-call/","date":"2015-10-08T22:51:00+09:00","content":"JSer.info #248 - React v0.14が正式リリースされました。reactと...","category":"JSer","tags":["React","ESLint","ES6"]},{"title":"2015-10-16のJS: Node.js 4.2.0 LTS、ES6、CSS.next","url":"http://jser.info/2015/10/16/node-lts-es6-js-css-next/","date":"2015-10-16T22:22:00+09:00","content":"JSer.info #249 - Node.js 4.2.0がリリースされました。このバージョ...","category":"JSer","tags":["Node.js","ES6","CSS","JavaScript"]},{"title":"2015-10-25のJS: ESLint入門、ECMAScriptとは何か?、rollupとES6 modules","url":"http://jser.info/2015/10/25/eslint-ecmascript-rollup/","date":"2015-10-25T20:20:00+09:00","content":"JSer.info #250 - ESLint v1.7.0がリリースされました。.eslin...","category":"JSer","tags":["ESLint","ECMAScript","Bundle","Browserify","rollup"]},{"title":"2015-11-03のJS: Vue.js 1.0.0、Babel 6.0、Node.js 5.0","url":"http://jser.info/2015/11/03/vue1.0-babel6.0-node5.0/","date":"2015-11-03T19:16:00+09:00","content":"JSer.info #251 - Vue.js 1.0.0がリリースされました。0.12.16...","category":"JSer","tags":["Vue","Babel","Node.js"]},{"title":"2015-11-09のJS: 巨大なJavaScriptのリファクタリング、Firefox 44の開発者ツール","url":"http://jser.info/2015/11/09/large-refactoring-firefox44/","date":"2015-11-09T22:03:00+09:00","content":"JSer.info #252 - フロントエンドに秩序を取り戻す方法 // Speaker D...","category":"JSer","tags":["JavaScript","Firefox","debug"]}]
},{}],42:[function(require,module,exports){
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

        this._rawItems = rawItems || require("../data/items.json");
        this._rawPosts = rawPosts || require("../data/posts.json");
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

},{"../data/items.json":40,"../data/posts.json":41,"./algo/AlgoItem":43,"./algo/AlgoPost.js":44,"./models/JSerItem":48,"./models/JSerPost":50,"./models/JSerWeek":51,"./natural/NaturalSearcher":52,"array.prototype.find":7}],43:[function(require,module,exports){
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

},{"./algoSearch.js":45}],44:[function(require,module,exports){
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

},{"./algoSearch.js":45}],45:[function(require,module,exports){
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

},{"binarysearch":10}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
// LICENSE : MIT
"use strict";
module.exports = {
    JSerStat: require("./JSerStat"),
    compute: require("./compute/compute-tags")
};

},{"./JSerStat":42,"./compute/compute-tags":46}],48:[function(require,module,exports){
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

},{"./JSerItemRelatedLink":49,"assert":8}],49:[function(require,module,exports){
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

},{}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
// LICENSE : MIT
"use strict";
exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _natural = require("natural");

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
        this.tfidf = new _natural.TfIdf();
        this.addItemsAsDocuments(this.items);
    }

    NaturalSearcher.prototype.addItemsAsDocuments = function addItemsAsDocuments(items) {
        var _this = this;

        items.forEach(function (item) {
            var urlKeyString = urlToWords(item.url).join(" ");
            var relatedString = item.relatedLinks.map(function (relatedObject) {
                return relatedObject.title + " " + urlToWords(relatedObject.url).join(" ");
            }).join("");
            _this.tfidf.addDocument(item.title + "\n" + item.content + "\n" + urlKeyString + "\n" + relatedString);
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
                throw new Error("Not foun" + " this item: " + targetItem);
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

},{"natural":60}],53:[function(require,module,exports){
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

var _ = require("underscore")._;

/*
 Sentences Analizer Class
 From http://www.writingcentre.uottawa.ca/hypergrammar/sntpurps.html

 Take a POS input and analyse it for
  - Type of Sentense
     - Interrogative
       - Tag Questions
       - 
     - Declarative
     - Exclamatory 
     - Imperative

  - Parts of a Sentense
     - Subject
     - Predicate

  - Show Preposition Phrases
*/

var Sentences = function(pos, callback) {
    this.posObj = pos;
    this.senType = null;
    callback(this);
};

Sentences.prototype.part = function(callback) {
    var subject = [],
	predicat = [],
	verbFound = false;
	
    this.prepositionPhrases();
	
    for (var i = 0; i < this.posObj.tags.length; i++) {
        if (this.posObj.tags[i].pos == "VB") {
            if (i === 0) {
                verbFound = true;
            } else {
                // We need to Test for any EX before the VB
                if (this.posObj.tags[i - 1].pos != "EX") {
                    verbFound = true;
                } else {
                    predicat.push(this.posObj.tags[i].token);
                }					
            }
        }

        // Add Pronoun Phrase (pp) Or Subject Phrase (sp)
        if (!verbFound) {
            if (this.posObj.tags[i].pp != true)
                this.posObj.tags[i].spos = "SP";
            
            subject.push(this.posObj.tags[i].token);
        } else {
            if (this.posObj.tags[i].pp != true)
                this.posObj.tags[i].spos = "PP";
            
            predicat.push(this.posObj.tags[i].token)
        }
    }
	
    if (subject.length == 0) {
	this.posObj.tags.push({token:"You",spos:"SP",pos:"PRP",added:true});
    }
    
    callback(this);	
};

// Takes POS and removes IN to NN or NNS
// Adds a PP for each prepositionPhrases
Sentences.prototype.prepositionPhrases = function() {
    var remove = false;

    for (var i = 0; i < this.posObj.tags.length; i++) {
        if (this.posObj.tags[i].pos.match("IN")) {
            remove = true;
        }
    
        if (remove) {
            this.posObj.tags[i].pp = true;
        }
    
        if (this.posObj.tags[i].pos.match("NN")) {
            remove = false;
        }
    }	
};

Sentences.prototype.subjectToString = function() {
    return this.posObj.tags.map(function(t){ if (t.spos == "SP" || t.spos == "S" ) return t.token }).join(' ');
};

Sentences.prototype.predicateToString = function() {
    return this.posObj.tags.map(function(t){ if (t.spos == "PP" || t.spos == "P" ) return t.token }).join(' ');
};

Sentences.prototype.implicitYou = function() {
    for (var i = 0; i < this.posObj.tags.length;i++) {
        if (this.posObj.tags[i].added) {
            return true;
        }
    }
    
    return false;
};

Sentences.prototype.toString = function() {
    return this.posObj.tags.map(function(t){return t.token}).join(' ');
};

// This is quick and incomplete.
Sentences.prototype.type = function(callback) {
    var callback = callback || false;

    // Check for implicit you before popping a tag.
    var implicitYou = this.implicitYou();

    // FIXME - punct seems useless
    var lastElement = this.posObj.punct();
    lastElement = (lastElement.length != 0) ? lastElement.pop() : this.posObj.tags.pop();

    if (lastElement.pos !== ".") {
        if (implicitYou) {
            this.senType = "COMMAND";
        } else if (_(["WDT","WP","WP$","WRB"]).contains(this.posObj.tags[0].pos)) {
            // Sentences that start with: who, what where when why and how, then they are questions
            this.senType = "INTERROGATIVE";
        } else if (_(["PRP"]).contains(lastElement.pos)) {
            // Sentences that end in a Personal pronoun are most likely questions
            // eg. We should run away, should we [?]
            // eg. You want to see that again, do you [?]
            this.senType = "INTERROGATIVE";
        } else {
            this.senType = "UNKNOWN";
        }
            
    } else {
        switch(lastElement.token) {
            case "?": this.senType = "INTERROGATIVE"; break;
            case "!": this.senType = (implicitYou) ? "COMMAND":"EXCLAMATORY"; break;
            case ".": this.senType = (implicitYou) ? "COMMAND":"DECLARATIVE";	break;
        }
    }
    
    if (callback && _(callback).isFunction()) {
        callback(this);
    } else {
        return this.senType;
    }
};

module.exports = Sentences;

},{"underscore":147}],54:[function(require,module,exports){
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

var PorterStemmer = require('../stemmers/porter_stemmer'),
util = require('util'),
Classifier = require('./classifier'),
ApparatusBayesClassifier = require('apparatus').BayesClassifier;

var BayesClassifier = function(stemmer, smoothing) {
    var abc = new ApparatusBayesClassifier();
    if (smoothing && isFinite(smoothing)) {
        abc = new ApparatusBayesClassifier(smoothing);
    }
    Classifier.call(this, abc, stemmer);
};

util.inherits(BayesClassifier, Classifier);

function restore(classifier, stemmer) {
    classifier = Classifier.restore(classifier, stemmer);
    classifier.__proto__ = BayesClassifier.prototype;
    classifier.classifier = ApparatusBayesClassifier.restore(classifier.classifier);

    return classifier;
}

function load(filename, stemmer, callback) {
    Classifier.load(filename, function(err, classifier) {
        if (err) {
            callback(err);
        }
        callback(err, restore(classifier, stemmer));
    });
}

BayesClassifier.restore = restore;
BayesClassifier.load = load;

module.exports = BayesClassifier;

},{"../stemmers/porter_stemmer":81,"./classifier":55,"apparatus":5,"util":149}],55:[function(require,module,exports){
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

var PorterStemmer = require('../stemmers/porter_stemmer'),
util = require('util'),
events = require('events');

var Classifier = function(classifier, stemmer) {
    this.classifier = classifier;
    this.docs = [];
    this.features = {};
    this.stemmer = stemmer || PorterStemmer;
    this.lastAdded = 0;
    this.events = new events.EventEmitter();
};

function addDocument(text, classification) {
    if(typeof text === 'string')
	text = this.stemmer.tokenizeAndStem(text);

    if(text.length === 0) {
        // ignore empty documents
        return;
    }

    this.docs.push({
	label: classification,
	text: text
    });

    for(var i = 0; i < text.length; i++) {
	this.features[text[i]] = 1;
    }
}

function removeDocument(text, classification) {
  var docs = this.docs
    , doc
    , pos;

  if (typeof text === 'string') {
    text = this.stemmer.tokenizeAndStem(text);
  }

  for (var i = 0, ii = docs.length; i < ii; i++) {
    doc = docs[i];
    if (doc.text.join(' ') == text.join(' ') &&
        doc.label == classification) {
      pos = i;
    }
  }

  // Remove if there's a match
  if (!isNaN(pos)) {
    this.docs.splice(pos, 1);

    for (var i = 0, ii = text.length; i < ii; i++) {
      delete this.features[text[i]];
    }
  }
}

function textToFeatures(observation) {
    var features = [];

    if(typeof observation === 'string')
	observation = this.stemmer.tokenizeAndStem(observation);

    for(var feature in this.features) {
        if(observation.indexOf(feature) > -1)
            features.push(1);
        else
            features.push(0);
    }

    return features;
}

function train() {
    var totalDocs = this.docs.length;
    for(var i = this.lastAdded; i < totalDocs; i++) {
        var features = this.textToFeatures(this.docs[i].text);
        this.classifier.addExample(features, this.docs[i].label);
        this.events.emit('trainedWithDocument', {index: i, total: totalDocs, doc: this.docs[i]});
        this.lastAdded++;
    }
    this.events.emit('doneTraining', true);
    this.classifier.train();
}

function retrain() {
  this.classifier = new (this.classifier.constructor)();
  this.lastAdded = 0;
  this.train();
}

function getClassifications(observation) {
    return this.classifier.getClassifications(this.textToFeatures(observation));
}

function classify(observation) {
    return this.classifier.classify(this.textToFeatures(observation));
}

function restore(classifier, stemmer) {
    classifier.stemmer = stemmer || PorterStemmer;
    classifier.events = new events.EventEmitter();
    return classifier;
}

function save(filename, callback) {
    var data = JSON.stringify(this);
    var fs = require('fs');
    var classifier = this;
    fs.writeFile(filename, data, 'utf8', function(err) {
        if(callback) {
            callback(err, err ? null : classifier);
        }
    });
}

function load(filename, callback) {
    var fs = require('fs');

    fs.readFile(filename, 'utf8', function(err, data) {
        var classifier;
          
        if(!err) {
            classifier = JSON.parse(data);
        }

        if(callback)
            callback(err, classifier);
    });
}

Classifier.prototype.addDocument = addDocument;
Classifier.prototype.removeDocument = removeDocument;
Classifier.prototype.train = train;
Classifier.prototype.retrain = retrain;
Classifier.prototype.classify = classify;
Classifier.prototype.textToFeatures = textToFeatures;
Classifier.prototype.save = save;
Classifier.prototype.getClassifications = getClassifications;
Classifier.restore = restore;
Classifier.load = load;

module.exports = Classifier;

},{"../stemmers/porter_stemmer":81,"events":23,"fs":11,"util":149}],56:[function(require,module,exports){
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

var PorterStemmer = require('../stemmers/porter_stemmer'),
util = require('util'),
Classifier = require('./classifier'),
ApparatusLogisticRegressionClassifier = require('apparatus').LogisticRegressionClassifier;

var LogisticRegressionClassifier = function(stemmer) {
    Classifier.call(this, new ApparatusLogisticRegressionClassifier(), stemmer);
};

util.inherits(LogisticRegressionClassifier, Classifier);

function restore(classifier, stemmer) {
    classifier = Classifier.restore(classifier, stemmer);
    classifier.__proto__ = LogisticRegressionClassifier.prototype;
    classifier.classifier = ApparatusLogisticRegressionClassifier.restore(classifier.classifier);

    return classifier;
}

function load(filename, stemmer, callback) {
    Classifier.load(filename, function(err, classifier) {
        callback(err, restore(classifier, stemmer));
    });
}

function train() {
    // we need to reset the traning state because logistic regression
    // needs its matricies to have their widths synced, etc.
    this.lastAdded = 0;
    this.classifier = new ApparatusLogisticRegressionClassifier();
    Classifier.prototype.train.call(this);
}

LogisticRegressionClassifier.prototype.train = train;
LogisticRegressionClassifier.restore = restore;
LogisticRegressionClassifier.load = load;

module.exports = LogisticRegressionClassifier;

},{"../stemmers/porter_stemmer":81,"./classifier":55,"apparatus":5,"util":149}],57:[function(require,module,exports){
/*
Copyright (c) 2011, John Crepezzi, Chris Umbel

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

// Get all of the pairs of letters for a string
var letterPairs = function (str) {
  var numPairs = str.length - 1;
  var pairs = new Array(numPairs);
  for (var i = 0; i < numPairs; i++) {
    pairs[i] = str.substring(i, i + 2);
  }
  return pairs;
};

// Get all of the pairs in all of the words for a string
var wordLetterPairs = function (str) {
  var allPairs = [], pairs;
  var words = str.split(/\s+/);
  for (var i = 0; i < words.length; i++) {
    pairs = letterPairs(words[i]);
    allPairs.push.apply(allPairs, pairs);
  }
  return allPairs;
};

// Perform some sanitization steps
var sanitize = function (str) {
  return str.toLowerCase().replace(/^\s+|\s+$/g, '');
};

// Compare two strings, and spit out a number from 0-1
var compare = function (str1, str2) {
  var pairs1 = wordLetterPairs(sanitize(str1));
  var pairs2 = wordLetterPairs(sanitize(str2));
  var intersection = 0, union = pairs1.length + pairs2.length;
  var i, j, pair1, pair2;
  for (i = 0; i < pairs1.length; i++) {
    pair1 = pairs1[i];
    for (j = 0; j < pairs2.length; j++) {
      pair2 = pairs2[j];
      if (pair1 == pair2) {
        intersection ++;
        delete pairs2[j];
        break;
      }
    }
  }
  return 2 * intersection / union;
};

module.exports = compare;

},{}],58:[function(require,module,exports){
/*
Copyright (c) 2012, Adam Phillabaum, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

Unless otherwise stated by a specific section of code

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// Computes the Jaro distance between two string -- intrepreted from:
// http://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
// s1 is the first string to compare
// s2 is the second string to compare
function distance(s1, s2) {
    if (typeof(s1) != "string" || typeof(s2) != "string") return 0;
    if (s1.length == 0 || s2.length == 0) 
        return 0;
    s1 = s1.toLowerCase(), s2 = s2.toLowerCase();
    var matchWindow = (Math.floor(Math.max(s1.length, s2.length) / 2.0)) - 1;
    var matches1 = new Array(s1.length);
    var matches2 = new Array(s2.length);
    var m = 0; // number of matches
    var t = 0; // number of transpositions

    //debug helpers
    //console.log("s1: " + s1 + "; s2: " + s2);
    //console.log(" - matchWindow: " + matchWindow);

    // find matches
    for (var i = 0; i < s1.length; i++) {
	var matched = false;

	// check for an exact match
	if (s1[i] ==  s2[i]) {
		matches1[i] = matches2[i] = matched = true;
		m++
	}

	// check the "match window"
	else {
        	// this for loop is a little brutal
        	for (k = (i <= matchWindow) ? 0 : i - matchWindow;
        		(k <= i + matchWindow) && k < s2.length && !matched;
			k++) {
            		if (s1[i] == s2[k]) {
                		if(!matches1[i] && !matches2[k]) {
                	    		m++;
               		}

        	        matches1[i] = matches2[k] = matched = true;
        	    }
        	}
	}
    }

    if(m == 0)
        return 0.0;

    // count transpositions
    var k = 0;

    for(var i = 0; i < s1.length; i++) {
    	if(matches1[k]) {
    	    while(!matches2[k] && k < matches2.length)
                k++;
	        if(s1[i] != s2[k] &&  k < matches2.length)  {
                t++;
            }

    	    k++;
    	}
    }
    
    //debug helpers:
    //console.log(" - matches: " + m);
    //console.log(" - transpositions: " + t);
    t = t / 2.0;
    return (m / s1.length + m / s2.length + (m - t) / m) / 3;
}

// Computes the Winkler distance between two string -- intrepreted from:
// http://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
// s1 is the first string to compare
// s2 is the second string to compare
// dj is the Jaro Distance (if you've already computed it), leave blank and the method handles it
function JaroWinklerDistance(s1, s2, dj) {
		if (s1 == s2) {
				return 1 
		}
		else {
		    var jaro;
		    (typeof(dj) == 'undefined')? jaro = distance(s1,s2) : jaro = dj;
		    var p = 0.1; //
		    var l = 0 // length of the matching prefix
		    while(s1[l] == s2[l] && l < 4)
		        l++;
		    
		    return jaro + l * p * (1 - jaro);
		}
}
module.exports = JaroWinklerDistance;

},{}],59:[function(require,module,exports){
/*
Copyright (c) 2012, Sid Nallu, Chris Umbel

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

/*
 * contribution by sidred123
 */

/*
 * Compute the Levenshtein distance between two strings.
 * Algorithm based from Speech and Language Processing - Daniel Jurafsky and James H. Martin.
 */

function LevenshteinDistance (source, target, options) {
    options = options || {};
    if(isNaN(options.insertion_cost)) options.insertion_cost = 1;
    if(isNaN(options.deletion_cost)) options.deletion_cost = 1;
    if(isNaN(options.substitution_cost)) options.substitution_cost = 1;

    var sourceLength = source.length;
    var targetLength = target.length;
    var distanceMatrix = [[0]];

    for (var row =  1; row <= sourceLength; row++) {
        distanceMatrix[row] = [];
        distanceMatrix[row][0] = distanceMatrix[row-1][0] + options.deletion_cost;
    }

    for (var column = 1; column <= targetLength; column++) {
        distanceMatrix[0][column] = distanceMatrix[0][column-1] + options.insertion_cost;
    }

    for (var row = 1; row <= sourceLength; row++) {
        for (var column = 1; column <= targetLength; column++) {
            var costToInsert = distanceMatrix[row][column-1] + options.insertion_cost;
            var costToDelete = distanceMatrix[row-1][column] + options.deletion_cost;

            var sourceElement = source[row-1];
            var targetElement = target[column-1];
            var costToSubstitute = distanceMatrix[row-1][column-1];
            if (sourceElement !== targetElement) {
                costToSubstitute = costToSubstitute + options.substitution_cost;
            }
            distanceMatrix[row][column] = Math.min(costToInsert, costToDelete, costToSubstitute);
        }
    }
    return distanceMatrix[sourceLength][targetLength];
}

module.exports = LevenshteinDistance;

},{}],60:[function(require,module,exports){
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

exports.SoundEx = require('./phonetics/soundex');
exports.Metaphone = require('./phonetics/metaphone');
exports.DoubleMetaphone = require('./phonetics/double_metaphone');
exports.SoundExDM = require('./phonetics/dm_soundex');
exports.PorterStemmer = require('./stemmers/porter_stemmer');
exports.PorterStemmerFa = require('./stemmers/porter_stemmer_fa');
exports.PorterStemmerFr = require('./stemmers/porter_stemmer_fr');
exports.PorterStemmerRu = require('./stemmers/porter_stemmer_ru');
exports.PorterStemmerEs = require('./stemmers/porter_stemmer_es');
exports.PorterStemmerIt = require('./stemmers/porter_stemmer_it');
exports.PorterStemmerNo = require('./stemmers/porter_stemmer_no');
exports.LancasterStemmer = require('./stemmers/lancaster_stemmer');
exports.StemmerFr = require('./stemmers/stemmer_fr');
exports.StemmerPl = require('./stemmers/stemmer_pl');
exports.StemmerJa = require('./stemmers/stemmer_ja');
exports.AggressiveTokenizerNl = require('./tokenizers/aggressive_tokenizer_nl');
exports.AggressiveTokenizerFa = require('./tokenizers/aggressive_tokenizer_fa');
exports.AggressiveTokenizerRu = require('./tokenizers/aggressive_tokenizer_ru');
exports.AggressiveTokenizerEs = require('./tokenizers/aggressive_tokenizer_es');
exports.AggressiveTokenizerIt = require('./tokenizers/aggressive_tokenizer_it');
exports.AggressiveTokenizerPl = require('./tokenizers/aggressive_tokenizer_pl');
exports.AggressiveTokenizerPt = require('./tokenizers/aggressive_tokenizer_pt');
exports.AggressiveTokenizerNo = require('./tokenizers/aggressive_tokenizer_no');
exports.AggressiveTokenizer = require('./tokenizers/aggressive_tokenizer');
exports.RegexpTokenizer = require('./tokenizers/regexp_tokenizer').RegexpTokenizer;
exports.WordTokenizer = require('./tokenizers/regexp_tokenizer').WordTokenizer;
exports.WordPunctTokenizer = require('./tokenizers/regexp_tokenizer').WordPunctTokenizer;
exports.TreebankWordTokenizer = require('./tokenizers/treebank_word_tokenizer');
exports.TokenizerJa = require('./tokenizers/tokenizer_ja');
exports.BayesClassifier = require('./classifiers/bayes_classifier');
exports.LogisticRegressionClassifier = require('./classifiers/logistic_regression_classifier');
exports.NounInflector = require('./inflectors/noun_inflector');
exports.NounInflectorFr = require('./inflectors/fr/noun_inflector');
exports.NounInflectorJa = require('./inflectors/ja/noun_inflector');
exports.PresentVerbInflector = require('./inflectors/present_verb_inflector');
exports.CountInflector = require('./inflectors/count_inflector');
exports.WordNet = require('./wordnet/wordnet');
exports.TfIdf = require('./tfidf/tfidf');
exports.Trie = require('./trie/trie');
exports.SentenceAnalyzer = require('./analyzers/sentence_analyzer');
exports.stopwords = require('./util/stopwords').words;
exports.ShortestPathTree = require('./util/shortest_path_tree');
exports.LongestPathTree = require('./util/longest_path_tree');
exports.EdgeWeightedDigraph = require('./util/edge_weighted_digraph');
exports.NGrams = require('./ngrams/ngrams');
exports.NGramsZH = require('./ngrams/ngrams_zh');
exports.JaroWinklerDistance = require('./distance/jaro-winkler_distance');
exports.LevenshteinDistance = require('./distance/levenshtein_distance');
exports.DiceCoefficient = require('./distance/dice_coefficient');
exports.normalize = require('./normalizers/normalizer').normalize_tokens;
exports.normalize_ja = require('./normalizers/normalizer_ja').normalize_ja;
exports.removeDiacritics = require('./normalizers/remove_diacritics');
exports.transliterate_ja = require('./transliterators/ja');

},{"./analyzers/sentence_analyzer":53,"./classifiers/bayes_classifier":54,"./classifiers/logistic_regression_classifier":56,"./distance/dice_coefficient":57,"./distance/jaro-winkler_distance":58,"./distance/levenshtein_distance":59,"./inflectors/count_inflector":61,"./inflectors/fr/noun_inflector":63,"./inflectors/ja/noun_inflector":64,"./inflectors/noun_inflector":65,"./inflectors/present_verb_inflector":66,"./ngrams/ngrams":68,"./ngrams/ngrams_zh":69,"./normalizers/normalizer":70,"./normalizers/normalizer_ja":71,"./normalizers/remove_diacritics":73,"./phonetics/dm_soundex":74,"./phonetics/double_metaphone":75,"./phonetics/metaphone":76,"./phonetics/soundex":78,"./stemmers/lancaster_stemmer":80,"./stemmers/porter_stemmer":81,"./stemmers/porter_stemmer_es":82,"./stemmers/porter_stemmer_fa":83,"./stemmers/porter_stemmer_fr":84,"./stemmers/porter_stemmer_it":85,"./stemmers/porter_stemmer_no":86,"./stemmers/porter_stemmer_ru":87,"./stemmers/stemmer_fr":91,"./stemmers/stemmer_ja":93,"./stemmers/stemmer_pl":95,"./tfidf/tfidf":97,"./tokenizers/aggressive_tokenizer":98,"./tokenizers/aggressive_tokenizer_es":99,"./tokenizers/aggressive_tokenizer_fa":100,"./tokenizers/aggressive_tokenizer_it":102,"./tokenizers/aggressive_tokenizer_nl":103,"./tokenizers/aggressive_tokenizer_no":104,"./tokenizers/aggressive_tokenizer_pl":105,"./tokenizers/aggressive_tokenizer_pt":106,"./tokenizers/aggressive_tokenizer_ru":107,"./tokenizers/regexp_tokenizer":108,"./tokenizers/tokenizer_ja":110,"./tokenizers/treebank_word_tokenizer":111,"./transliterators/ja":112,"./trie/trie":113,"./util/edge_weighted_digraph":115,"./util/longest_path_tree":116,"./util/shortest_path_tree":117,"./util/stopwords":118,"./wordnet/wordnet":131}],61:[function(require,module,exports){
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

function nthForm(i) {
    var teenth = (i % 100);

    if(teenth > 10 && teenth < 14)
        return 'th';
    else {
        switch(i % 10) {
            case 1:
                return 'st';
                break;
            case 2:
                return 'nd';
                break;            
            case 3:
                return 'rd';
                break;
            default:
                return 'th';
        }
    }
}

function nth(i) {
    return i.toString() + nthForm(i);
}

var CountInflector = function() {
};

CountInflector.nth = nth;

module.exports = CountInflector;

},{}],62:[function(require,module,exports){
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

var FormSet = function() {
    this.regularForms = [];
    this.irregularForms = {};
}

module.exports = FormSet;

},{}],63:[function(require,module,exports){
/*
 Copyright (c) 2012, Guillaume Marty

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
 * A noun inflector for French.
 * Compiled from:
 * \@see http://fr.wiktionary.org/wiki/Annexe:Pluriels_irr%C3%A9guliers_en_fran%C3%A7ais
 * \@see http://fr.wikipedia.org/wiki/Pluriels_irr%C3%A9guliers_en_fran%C3%A7ais
 *
 * \@todo Take compounded noun into account (eaux-fortes, pique-nique...).
 * \@todo General note: French also requires AdjectiveInflector (femininize...).
 */

var SingularPluralInflector = require('../singular_plural_inflector'),
    util = require('util'),
    FormSet = require('../form_set');

function attach() {
  var inflector = this;

  String.prototype.singularizeNoun = function() {
    return inflector.singularize(this);
  };

  String.prototype.pluralizeNoun = function() {
    return inflector.pluralize(this);
  };
}



/**
 * @constructor
 */
var NounInflector = function() {
  // Ambiguous a.k.a. invariant.
  // \@todo Expand this list to be as comprehensive as possible.
  this.ambiguous = [
    // Nouns ending by -s
    'à-peu-près', 'à-propos', 'abattis', 'abcès', 'abois', 'abribus', 'abus',
    'accès', 'acquis', 'adénovirus', 'adonis', 'ados', 'agrès', 'aguets',
    'ailleurs', 'ais', 'albatros', 'albinos', 'alias', 'aloès', 'amaryllis',
    'amas', 'ampélopsis', 'ananas', 'anchois', 'angélus', 'anis', 'anticorps',
    'antihéros', 'antirides', 'anus', 'appas', 'appentis', 'appui-bras',
    'appuie-bras', 'arcanes', 'argus', 'arrérages', 'arrière-pays', 'as',
    'ascaris', 'asparagus', 'atlas', 'atours', 'aurochs', 'autobus',
    'autofocus', 'avant-bras', 'avant-corps', 'avant-propos', 'avers', 'avis',
    'axis', 'barbouillis', 'bas', 'beaujolais', 'beaux-arts', 'biais',
    'bibliobus', 'biceps', 'bicross', 'bien-fonds', 'bloc-notes', 'blockhaus',
    'blocus', 'blues', 'bois', 'bonus', 'bout-dehors', 'bouts-rimés',
    'branle-bas', 'bras', 'brebis', 'bris', 'brise-lames', 'brise-mottes',
    'brûlis', 'buis', 'burnous', 'bus', 'business', 'cabas', 'cacatoès',
    'cacatois', 'cactus', 'cadenas', 'cafouillis', 'caillebotis', 'calvados',
    'cambouis', 'campus', 'canevas', 'cannabis', 'carquois', 'cas',
    'casse-noisettes', 'casse-pieds', 'cassis', 'caucus', 'cens', 'cervelas',
    'chablis', 'chamois', 'chaos', 'chas', 'chasselas', 'châssis',
    'chatouillis', 'chauffe-assiettes', 'chauve-souris', 'chorus', 'choucas',
    'circoncis', 'cirrus', 'clafoutis', 'clapotis', 'cliquetis', 'clos',
    'cochylis', 'colis', 'coloris', 'commis', 'compas', 'compromis',
    'compte-chèques', 'compte-gouttes', 'compte-tours', 'concours', 'confins',
    'congrès', 'consensus', 'contrepoids', 'contresens', 'contretemps',
    'corn flakes', 'corps', 'corps-à-corps', 'corpus', 'cosinus', 'cosmos',
    'coulis', 'coupe-ongles', 'cours', 'court-jus', 'couscous', 'coutelas',
    'crocus', 'croquis', 'cross', 'cubitus', 'cumulus', 'cure-dents',
    'cure-ongles', 'cure-pipes', 'cursus', 'cyclo-cross', 'cyprès', 'dais',
    'damas', 'débarras', 'débours', 'débris', 'décès', 'dedans', 'dehors',
    'delirium tremens', 'demi-gros', 'dépens', 'dessous', 'dessus', 'détritus',
    'deux-mâts', 'deux-pièces', 'deux-points', 'deux-roues', 'deux-temps',
    'dévers', 'devis', 'diplodocus', 'discours', 'dos', 'ébats', 'éboulis',
    'échalas', 'edelweiss', 'élaeis', 'éleis', 'éléphantiasis', 'embarras',
    'empois', 'en-cas', 'encens', 'enclos', 'endos', 'engrais', 'entrelacs',
    'entremets', 'envers', 'épluche-légumes', 'ers', 'espace-temps',
    'essuie-mains', 'eucalyptus', 'ex-libris', 'excès', 'express', 'extrados',
    'faciès', 'fait-divers', 'fatras', 'faux-sens', 'favoris', 'ficus',
    'fier-à-bras', 'finnois', 'florès', 'focus', 'fœtus', 'fois', 'forceps',
    'fouillis', 'fracas', 'frais', 'français', 'franglais', 'frimas',
    'friselis', 'frisottis', 'froncis', 'frottis', 'fucus', 'gâchis', 'galetas',
    'galimatias', 'garde-à-vous', 'garde-corps', 'gargouillis', 'gars',
    'gâte-bois', 'gazouillis', 'génois', 'gibus', 'glacis', 'glas', 'gneiss',
    'gobe-mouches', 'grès', 'gribouillis', 'guet-apens', 'habeas corpus',
    'hachis', 'haras', 'hardes', 'harnais', 'haut-le-corps', 'hautbois',
    'herbe-aux-chats', 'héros', 'herpès', 'hiatus', 'hibiscus', 'hors-concours',
    'hors-pistes', 'hourdis', 'huis-clos', 'humérus', 'humus', 'ibis', 'iléus',
    'indique-fuites', 'infarctus', 'inlandsis', 'insuccès', 'intercours',
    'intrados', 'intrus', 'iris', 'isatis', 'jais', 'jars', 'jeans',
    'jeuconcours', 'judas', 'juliénas', 'jus', 'justaucorps', 'kakatoès',
    'kermès', 'kriss', 'lacis', 'laïus', 'lambris', 'lapis', 'laps', 'lapsus',
    'laquais', 'las', 'lattis', 'lave-mains', 'lavis', 'lèche-bottes',
    'lèche-vitrines', 'legs', 'lias', 'liégeois', 'lilas', 'lis', 'lœss',
    'logis', 'loris', 'lotus', 'louis', 'lupus', 'lys', 'mâchicoulis', 'madras',
    'maïs', 'malappris', 'malus', 'mânes', 'maquis', 'marais', 'maroilles',
    'marquis', 'mas', 'mass-médias', 'matelas', 'matois', 'médius', 'mépris',
    'mérinos', 'mess', 'mets', 'mi-bas', 'micro-ondes', 'mille-pattes',
    'millepertuis', 'minibus', 'minois', 'minus', 'mirabilis', 'mois',
    'monocorps', 'monte-plats', 'mors', 'motocross', 'mots-croisés', 'motus',
    'mouchetis', 'mucus', 'myosotis', 'nævus', 'négus', 'niais',
    'nimbo-stratus', 'nimbus', 'norois', 'nounours', 'nu-pieds', 'oasis',
    'obus', 'olibrius', 'omnibus', 'opus', 'os', 'ours', 'ouvre-boîtes',
    'ouvre-bouteilles', 'palais', 'palis', 'palmarès', 'palus', 'panais',
    'panaris', 'pancréas', 'papyrus', 'par-dehors', 'paradis', 'parcours',
    'pardessus', 'pare-balles', 'pare-chocs', 'parvis', 'pas', 'passe-temps',
    'pataquès', 'pathos', 'patois', 'pavois', 'pays', 'permis',
    'petit-bourgeois', 'petit-gris', 'petit-pois', 'phallus', 'phimosis',
    'pickles', 'pilotis', 'pique-fleurs', 'pis', 'pithiviers', 'pityriasis',
    'plateau-repas', 'plâtras', 'plein-temps', 'plexiglas', 'plexus', 'plus',
    'poids', 'pois', 'pont-levis', 'porte-avions', 'porte-bagages',
    'porte-billets', 'porte-bouteilles', 'porte-clés', 'porte-hélicoptères',
    'porte-jarretelles', 'porte-revues', 'pouls', 'préavis', 'presse-fruits',
    'presse-papiers', 'princeps', 'printemps', 'procès', 'processus', 'progrès',
    'propos', 'prospectus', 'protège-dents', 'psoriasis', 'pubis', 'puits',
    'pus', 'putois', 'quatre-épices', 'quatre-feuilles', 'quatre-heures',
    'quatre-mâts', 'quatre-quarts', 'quatre-temps', 'quitus', 'rabais',
    'rachis', 'radis', 'radius', 'raïs', 'ramassis', 'rébus', 'reclus',
    'recours', 'refus', 'relais', 'remords', 'remous', 'remue-méninges',
    'rendez-vous', 'repas', 'répons', 'repos', 'repris', 'reps', 'rétrovirus',
    'revers', 'rhinocéros', 'rictus', 'rince-doigts', 'ris', 'rollmops',
    'rosé-des-prés', 'roulis', 'rubis', 'salmigondis', 'salsifis', 'sans-logis',
    'sas', 'sassafras', 'sauternes', 'schnaps', 'schuss', 'secours', 'semis',
    'sens', 'serre-fils', 'serre-livres', 'sévices', 'sinus', 'skunks',
    'souris', 'sournois', 'sous-bois', 'stradivarius', 'stras', 'strass',
    'strato-cumulus', 'stratus', 'stress', 'succès', 'surdos', 'surplus',
    'surpoids', 'sursis', 'suspens', 'synopsis', 'syphilis', 'taffetas',
    'taillis', 'talus', 'tamaris', 'tamis', 'tapis', 'tas', 'taudis', 'temps',
    'tennis', 'terminus', 'terre-neuvas', 'tétanos', 'tétras', 'thalamus',
    'thermos', 'thesaurus', 'thésaurus', 'thymus', 'tire-fesses', 'tonus',
    'torchis', 'torticolis', 'tournedos', 'tournevis', 'tournis', 'tracas',
    'traîne-savates', 'travers', 'tréfonds', 'treillis', 'trépas', 'trias',
    'triceps', 'trichomonas', 'trois-étoiles', 'trois-mâts', 'trois-quarts',
    'trolleybus', 'tumulus', 'typhus', 'univers', 'us', 'utérus', 'vasistas',
    'vélocross', 'velours', 'verglas', 'verjus', 'vernis', 'vers',
    'vert-de-gris', 'vide-ordures', 'vide-poches', 'villageois', 'virus',
    'vis-à-vis', 'volubilis', 'vulgum pecus', 'waters', 'williams', 'xérès',

    // Nouns ending by -x
    'abat-voix', 'afflux', 'alpax', 'anthrax', 'apex', 'aptéryx',
    'archéoptéryx', 'arrière-faix', 'bombyx', 'borax', 'bordeaux', 'bouseux',
    'box', 'carex', 'casse-noix', 'cedex', 'céphalothorax', 'cérambyx', 'chaux',
    'choix', 'coccyx', 'codex', 'contumax', 'coqueleux', 'cortex', 'courroux',
    'croix', 'crucifix', 'culex', 'demodex', 'duplex', 'entre-deux', 'époux',
    'équivaux', 'eux', 'ex', 'faix', 'faucheux', 'faux', 'fax', 'ferreux',
    'flux', 'fox', 'freux', 'furax', 'hapax', 'harengueux', 'hélix',
    'horse-pox', 'houx', 'index', 'influx', 'inox', 'juke-box', 'kleenex',
    'lagothrix', 'larynx', 'lastex', 'latex', 'lux', 'lynx', 'macareux', 'max',
    'mésothorax', 'mi-voix', 'mirepoix', 'motteux', 'multiplex', 'murex',
    'narthex', 'noix', 'onyx', 'opopanax', 'oropharynx', 'paix', 'panax',
    'perdrix', 'pharynx', 'phénix', 'phlox', 'phoenix', 'pneumothorax', 'poix',
    'portefaix', 'pousse-cailloux', 'preux', 'prix', 'prothorax', 'pucheux',
    'pyrex', 'pyroligneux', 'quadruplex', 'queux', 'redoux', 'reflex', 'reflux',
    'relax', 'rhinopharynx', 'rose-croix', 'rouvieux', 'roux', 'rumex',
    'saindoux', 'sardonyx', 'scolex', 'sèche-cheveux', 'silex', 'simplex',
    'sioux', 'sirex', 'smilax', 'solex', 'songe-creux', 'spalax', 'sphex',
    'sphinx', 'storax', 'strix', 'styrax', 'surfaix', 'surtaux', 'syrinx',
    'tamarix', 'taux', 'télex', 'thorax', 'tord-boyaux', 'toux', 'trionyx',
    'tripoux', 'tubifex', 'vertex', 'vidéotex', 'vielleux', 'vieux',
    'violoneux', 'voix', 'volvox', 'vortex',

    // Nouns ending by -z
    'allume-gaz', 'assez', 'biogaz', 'cache-nez', 'camping-gaz', 'chez',
    'chintz', 'ersatz', 'fez', 'free-jazz', 'fritz', 'gaz', 'gin-fizz', 'hertz',
    'jazz', 'jerez', 'kibboutz', 'kilohertz', 'kolkhoz', 'kronprinz', 'lapiaz',
    'lez', 'mégahertz', 'merguez', 'nez', 'pince-nez', 'quartz', 'quiz', 'ranz',
    'raz', 'recez', 'rémiz', 'rez', 'riz', 'ruolz', 'seltz', 'serre-nez'
  ];

  this.customPluralForms = [];
  this.customSingularForms = [];
  this.singularForms = new FormSet();
  this.pluralForms = new FormSet();

  this.attach = attach;

  this.addIrregular('ail', 'aulx');
  this.addIrregular('bétail', 'bestiaux');
  this.addIrregular('bonhomme', 'bonshommes');
  this.addIrregular('ciel', 'cieux');
  this.addIrregular('monsieur', 'messieurs');
  this.addIrregular('mafioso', 'mafiosi');
  this.addIrregular('œil', 'yeux');
  this.addIrregular('putto', 'putti');
  this.addIrregular('targui', 'touareg'); // touareg -> touaregs is also OK.

  // Pluralize
  this.pluralForms.regularForms.push([/^(av|b|c|carnav|cérémoni|chac|corr|emment|emmenth|festiv|fut|gavi|gra|narv|p|récit|rég|rit|rorqu|st)al$/i, '$1als']);
  this.pluralForms.regularForms.push([/^(aspir|b|cor|ém|ferm|gemm|soupir|trav|vant|vent|vitr)ail$/i, '$1aux']);
  this.pluralForms.regularForms.push([/^(bij|caill|ch|gen|hib|jouj|p|rip|chouch)ou$/i, '$1oux']);
  this.pluralForms.regularForms.push([/^(gr|berimb|don|karb|land|pil|rest|sarr|un)au$/i, '$1aus']);
  this.pluralForms.regularForms.push([/^(bl|ém|enf|pn)eu$/i, '$1eus']);
  this.pluralForms.regularForms.push([/(au|eau|eu|œu)$/i, '$1x']);
  this.pluralForms.regularForms.push([/al$/i, 'aux']);
  this.pluralForms.regularForms.push([/(s|x)$/i, '$1']);
  this.pluralForms.regularForms.push([/(.*)$/i, '$1s']);

  // Singularize
  this.singularForms.regularForms.push([/^(aspir|b|cor|ém|ferm|gemm|soupir|trav|vant|vent|vitr)aux$/i, '$1ail']);
  this.singularForms.regularForms.push([/^(aloy|b|bouc|boy|burg|conoy|coy|cr|esquim|ét|fabli|flé|flûti|glu|gr|gru|hoy|joy|kérab|matéri|nobli|noy|pré|sen|sén|t|touch|tuss|tuy|v|ypré)aux$/i, '$1au']);
  this.singularForms.regularForms.push([/^(bij|caill|ch|gen|hib|jouj|p|rip|chouch)oux$/i, '$1ou']);
  this.singularForms.regularForms.push([/^(bis)?aïeux$/i, '$1aïeul']);
  this.singularForms.regularForms.push([/^apparaux$/i, 'appareil']); // One way transform, don't put on irregular list.
  this.singularForms.regularForms.push([/^ciels$/i, 'ciel']);
  this.singularForms.regularForms.push([/^œils$/i, 'œil']);
  this.singularForms.regularForms.push([/(eau|eu|œu)x$/i, '$1']);
  this.singularForms.regularForms.push([/aux$/i, 'al']);
  this.singularForms.regularForms.push([/(.*)s$/i, '$1']);

  this.pluralize = function(token) {
    return this.ize(token, this.pluralForms, this.customPluralForms);
  };

  this.singularize = function(token) {
    return this.ize(token, this.singularForms, this.customSingularForms);
  };
};

util.inherits(NounInflector, SingularPluralInflector);

module.exports = NounInflector;

},{"../form_set":62,"../singular_plural_inflector":67,"util":149}],64:[function(require,module,exports){
/*
 Copyright (c) 2012, Guillaume Marty

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
 * A noun inflector for Japanese.
 * Compiled from several sources including:
 * \@see http://answers.yahoo.com/question/index?qid=20080528201740AASBWy6
 * \@see http://www.excite.co.jp/dictionary/english_japanese/
 *
 * This script assumes input is normalized using normalizer_ja().
 * Pluralizing Japanese has a very limited interest.
 * Japanese don't usually distinct plural from singular, so even a word looking
 * like a singular might actually be a plural.
 *
 * Singularization of nouns ending by -tachi or -ra is achieved using a
 * comprehensive black list, while nouns ending by -domo or -gata use a white
 * list because there are too many exceptions.
 *
 * \@todo Singularize nouns ending by -ら, but there are too many exceptions.
 * \@todo Expand the list of common plurals ending by -domo and -gata.
 */

var SingularPluralInflector = require('../singular_plural_inflector'),
    util = require('util'),
    FormSet = require('../form_set');

function attach() {
  var inflector = this;

  String.prototype.singularizeNoun = function() {
    return inflector.singularize(this);
  };

  String.prototype.pluralizeNoun = function() {
    return inflector.pluralize(this);
  };
}



/**
 * @constructor
 */
var NounInflector = function() {
  // Ambiguous a.k.a. invariant.
  this.ambiguous = [
    'ともだち', '友だち', '友達', '遊び友達', '飲み友達', '酒飲み友達', '茶飲み友達',
    '学校友達', '女友達', '男友達', '幼友達'
  ];

  this.customPluralForms = [];
  this.customSingularForms = [];
  this.singularForms = new FormSet();
  this.pluralForms = new FormSet();

  this.attach = attach;

  this.addIrregular('神', '神神');
  this.addIrregular('人', '人人');
  this.addIrregular('年', '年年');
  this.addIrregular('月', '月月');
  this.addIrregular('日', '日日');
  this.addIrregular('星', '星星');
  this.addIrregular('島', '島島');
  this.addIrregular('我', '我我');
  this.addIrregular('山', '山山');
  this.addIrregular('国', '国国');
  this.addIrregular('所', '所所');
  this.addIrregular('隅', '隅隅');

  /**
   * Notes:
   * -たち exceptions: いたち, おいたち, ついたち, かたち, かおかたち, なりかたち, いでたち, はたち, からたち, なりたち
   * -達 exceptions: 伊達, 男伊達, 栄達, 上意下達, 熟達, 上達, 下意上達, 先達, 送達, 速達, 即日速達, 書留速達, 調達, 通達, 伝達, 到達, 配達, 牛乳配達, 新聞配達, 無料配達, 四通八達, 発達, 未発達, 御用達, 宮内庁御用達, 練達, 闊達
   * -等 exceptions: 一等, 下等, 何等, 均等, 勲等, 高等, 三等, 初等, 上等, 親等, 二親等, 数等, 対等, 中等, 同等, 特等, 二等, 品等, 不等, 平等, 悪平等, 男女平等, 不平等, 優等, 劣等
   */

  // Pluralize
  this.pluralForms.regularForms.push([/^(.+)$/i, '$1たち']);

  // Singularize
  this.singularForms.regularForms.push([/^(.+)たち$/i, function(a, mask) {
    if (['い', 'おい', 'つい', 'か', 'かおか', 'なりか', 'いで', 'は', 'から',
      'なり'].indexOf(mask) >= 0)
      return mask + 'たち';
    return mask;
  }]);
  this.singularForms.regularForms.push([/^(.+)達$/i, function(a, mask) {
    if (['伊', '伊', '栄', '上意下', '熟', '上', '下意上', '先', '送', '速',
      '即日速', '書留速', '調', '通', '伝', '到', '配', '牛乳配', '新聞配', '無料配',
      '四通八', '発', '未発', '御用', '宮内庁御用', '練', '闊'].indexOf(mask) >= 0)
      return mask + '達';
    return mask;
  }]);  // Singularize nouns ending by -等, but not exceptions.
  this.singularForms.regularForms.push([/^(.+)等$/i, function(a, mask) {
    if (['一', '下', '何', '均', '勲', '高', '三', '初', '親', '二親', '数', '対',
      '中', '同', '特', '二', '品', '不', '平', '悪平', '男女平', '不平', '優',
      '劣'].indexOf(mask) >= 0)
      return mask + '等';
    return mask;
  }]);
  this.singularForms.regularForms.push([/^(人間|わたくし|私|てまえ|手前|野郎|やろう|勇者|がき|ガキ|餓鬼|あくとう|悪党|猫|家来)(共|ども)$/i, '$1']);
  this.singularForms.regularForms.push([/^(神様|先生|あなた|大名|女中|奥様)(方|がた)$/i, '$1']);

  this.pluralize = function(token) {
    return this.ize(token, this.pluralForms, this.customPluralForms);
  };

  this.singularize = function(token) {
    return this.ize(token, this.singularForms, this.customSingularForms);
  };
};

util.inherits(NounInflector, SingularPluralInflector);

module.exports = NounInflector;

},{"../form_set":62,"../singular_plural_inflector":67,"util":149}],65:[function(require,module,exports){
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

var SingularPluralInflector = require('./singular_plural_inflector'),
    util = require('util'),
    FormSet = require('./form_set');

function attach() {
    var inflector = this;
    
    String.prototype.singularizeNoun = function() {
        return inflector.singularize(this);
    }
    
    String.prototype.pluralizeNoun = function() {
        return inflector.pluralize(this);
    }
}

var NounInflector = function() {
    this.ambiguous = [
        'bison', 'bream', 'carp', 'chassis', 'cod', 'corps', 'debris', 'deer',
        'diabetes', 'equipment', 'elk', 'fish', 'flounder', 'gallows', 'graffiti',
        'headquarters', 'herpes', 'highjinks', 'homework', 'information',
        'mackerel', 'mews', 'money', 'news', 'rice', 'rabies', 'salmon', 'series',
        'sheep', 'shrimp', 'species', 'swine', 'trout', 'tuna', 'whiting', 'wildebeest'
    ];
    
    this.customPluralForms = [];
    this.customSingularForms = [];    
    this.singularForms = new FormSet();
    this.pluralForms = new FormSet();

    this.attach = attach;

    this.addIrregular("child", "children");
    this.addIrregular("man", "men");
    this.addIrregular("person", "people");
    this.addIrregular("sex", "sexes");
    this.addIrregular("mouse", "mice");
    this.addIrregular("ox", "oxen");
    this.addIrregular("foot", "feet");
    this.addIrregular("tooth", "teeth");
    this.addIrregular("goose", "geese");
    this.addIrregular("ephemeris", "ephemerides");
    
    // see if it is possible to unify the creation of both the singular and
    // plural regexes or maybe even just have one list. with a complete list
    // of rules it may only be possible for some regular forms, but worth a shot    
    this.pluralForms.regularForms.push([/y$/i, 'ies']);
    this.pluralForms.regularForms.push([/ife$/i, 'ives']);
    this.pluralForms.regularForms.push([/(antenn|formul|nebul|vertebr|vit)a$/i, '$1ae']);    
    this.pluralForms.regularForms.push([/(octop|vir|radi|nucle|fung|cact|stimul)us$/i, '$1i']);    
    this.pluralForms.regularForms.push([/(buffal|tomat|tornad)o$/i, '$1oes']);    
    this.pluralForms.regularForms.push([/(sis)$/i, 'ses']);
    this.pluralForms.regularForms.push([/(matr|vert|ind|cort)(ix|ex)$/i, '$1ices']);
    this.pluralForms.regularForms.push([/(x|ch|ss|sh|s|z)$/i, '$1es']);
    this.pluralForms.regularForms.push([/^(?!talis|.*hu)(.*)man$/i, '$1men']);
    this.pluralForms.regularForms.push([/(.*)/i, '$1s']);

    this.singularForms.regularForms.push([/([^v])ies$/i, '$1y']);
    this.singularForms.regularForms.push([/ives$/i, 'ife']);
    this.singularForms.regularForms.push([/(antenn|formul|nebul|vertebr|vit)ae$/i, '$1a']);
    this.singularForms.regularForms.push([/(octop|vir|radi|nucle|fung|cact|stimul)(i)$/i, '$1us']);
    this.singularForms.regularForms.push([/(buffal|tomat|tornad)(oes)$/i, '$1o']);
    this.singularForms.regularForms.push([/(analy|naly|synop|parenthe|diagno|the)ses$/i, '$1sis']);
    this.singularForms.regularForms.push([/(vert|ind|cort)(ices)$/i, '$1ex']);
    // our pluralizer won''t cause this form of appendix (appendicies)
    // but we should handle it
    this.singularForms.regularForms.push([/(matr|append)(ices)$/i, '$1ix']);
    this.singularForms.regularForms.push([/(x|ch|ss|sh|s|z)es$/i, '$1']);
    this.singularForms.regularForms.push([/men$/i, 'man']);
    this.singularForms.regularForms.push([/s$/i, '']);
    
    this.pluralize = function (token) {
        return this.ize(token, this.pluralForms, this.customPluralForms);
    };
    
    this.singularize = function(token) {
        return this.ize(token, this.singularForms, this.customSingularForms);
    };
};

util.inherits(NounInflector, SingularPluralInflector);
    
module.exports = NounInflector;

},{"./form_set":62,"./singular_plural_inflector":67,"util":149}],66:[function(require,module,exports){
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

var util = require('util'),
    SingularPluralInflector = require('./singular_plural_inflector'),
    FormSet = require('./form_set');

function attach() {
    var inflector = this;
    
    String.prototype.singularizePresentVerb = function() {
        return inflector.singularize(this);
    }
    
    String.prototype.pluralizePresentVerb = function() {
        return inflector.pluralize(this);
    }
}

var VerbInflector = function() {
    this.ambiguous = [
        'will'
    ];
    
    this.attach = attach;
        
    this.customPluralForms = [];
    this.customSingularForms = [];    
    this.singularForms = new FormSet();
    this.pluralForms = new FormSet();

    this.addIrregular("am", "are");    
    this.addIrregular("is", "are");
    this.addIrregular("was", "were");
    this.addIrregular("has", "have");
    
    this.singularForms.regularForms.push([/ed$/i, 'ed']);
    this.singularForms.regularForms.push([/ss$/i, 'sses']);
    this.singularForms.regularForms.push([/x$/i, 'xes']);    
    this.singularForms.regularForms.push([/(h|z|o)$/i, '$1es']);
    this.singularForms.regularForms.push([/$zz/i, 'zzes']);
    this.singularForms.regularForms.push([/([^a|e|i|o|u])y$/i, '$1ies']);
    this.singularForms.regularForms.push([/$/i, 's']);

    this.pluralForms.regularForms.push([/sses$/i, 'ss']);
    this.pluralForms.regularForms.push([/xes$/i, 'x']);
    this.pluralForms.regularForms.push([/([cs])hes$/i, '$1h']);
    this.pluralForms.regularForms.push([/zzes$/i, 'zz']);
    this.pluralForms.regularForms.push([/([^h|z|o|i])es$/i, '$1e']);
    this.pluralForms.regularForms.push([/ies$/i, 'y']);//flies->fly
    this.pluralForms.regularForms.push([/e?s$/i, '']); 
};

util.inherits(VerbInflector, SingularPluralInflector);

module.exports = VerbInflector;

},{"./form_set":62,"./singular_plural_inflector":67,"util":149}],67:[function(require,module,exports){
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

var TenseInflector = function () {
};

TenseInflector.prototype.addSingular = function(pattern, replacement) {
    this.customSingularForms.push([pattern, replacement]);    
};

TenseInflector.prototype.addPlural = function(pattern, replacement) {
    this.customPluralForms.push([pattern, replacement]);
};

TenseInflector.prototype.ize = function (token, formSet, customForms) {
    var restoreCase = this.restoreCase(token);
    return restoreCase(this.izeRegExps(token, customForms) || this.izeAbiguous(token) ||
        this.izeRegulars(token, formSet) || this.izeRegExps(token, formSet.regularForms) ||
        token);
}

TenseInflector.prototype.izeAbiguous = function (token) {
    if(this.ambiguous.indexOf(token.toLowerCase()) > -1)
        return token.toLowerCase();

    return false;
}

TenseInflector.prototype.pluralize = function (token) {
    return this.ize(token, this.pluralForms, this.customPluralForms);
};

TenseInflector.prototype.singularize = function(token) {
    return this.ize(token, this.singularForms, this.customSingularForms);
};    

var uppercaseify = function(token) {
    return token.toUpperCase();
}
var capitalize = function(token) {
    return token[0].toUpperCase() + token.slice(1);
}
var lowercaseify = function(token) {
    return token.toLowerCase();
}

TenseInflector.prototype.restoreCase = function(token) {
    if (token[0] === token[0].toUpperCase()) {
        if (token[1] && token[1] === token[1].toLowerCase()) {
            return capitalize;
        } else {
            return uppercaseify;
        }
    } else {
        return lowercaseify;
    }
}

TenseInflector.prototype.izeRegulars = function(token, formSet) {
    token = token.toLowerCase();
    if(formSet.irregularForms.hasOwnProperty(token) && formSet.irregularForms[token])
        return formSet.irregularForms[token];

    return false;
}

TenseInflector.prototype.addForm = function(singularTable, pluralTable, singular, plural) {
    singular = singular.toLowerCase();
    plural = plural.toLowerCase();
    pluralTable[singular] = plural;
    singularTable[plural] = singular;
};

TenseInflector.prototype.addIrregular = function(singular, plural) {
    this.addForm(this.singularForms.irregularForms, this.pluralForms.irregularForms, singular, plural);
};

TenseInflector.prototype.izeRegExps = function(token, forms) {
        var i, form;
        for(i = 0; i < forms.length; i++) {
            form = forms[i];
            
            if(token.match(form[0]))
                return token.replace(form[0], form[1]);
        }
        
        return false;
    }

module.exports = TenseInflector;

},{}],68:[function(require,module,exports){
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
    tokenizer = new Tokenizer();

exports.setTokenizer = function(t) {
    if(!_.isFunction(t.tokenize))
        throw new Error('Expected a valid Tokenizer');
    tokenizer = t;
}

exports.ngrams = function(sequence, n, startSymbol, endSymbol) {
    return ngrams(sequence, n, startSymbol, endSymbol);
}

exports.bigrams = function(sequence, startSymbol, endSymbol) {
    return ngrams(sequence, 2, startSymbol, endSymbol);
}

exports.trigrams = function(sequence, startSymbol, endSymbol) {
    return ngrams(sequence, 3, startSymbol, endSymbol);
}

var ngrams = function(sequence, n, startSymbol, endSymbol) {
    var result = [];
    
    if (!_(sequence).isArray()) {
        sequence = tokenizer.tokenize(sequence);
    }

    var count = _.max([0, sequence.length - n + 1]);

    // Check for left padding    
    if(typeof startSymbol !== "undefined" && startSymbol !== null) {
        // Create an array of (n) start symbols
        var blanks = [];
        for(var i = 0 ; i < n ; i++) {
            blanks.push(startSymbol);
        }

        // Create the left padding
        for(var p = n - 1 ; p > 0 ; p--) {
            // Create a tuple of (p) start symbols and (n - p) words
            result.push(blanks.slice(0, p).concat(sequence.slice(0, n - p)));
        }
    }

    // Build the complete ngrams
    for (var i = 0; i < count; i++) {
        result.push(sequence.slice(i, i + n));
    }

    // Check for right padding
    if(typeof endSymbol !== "undefined" && endSymbol !== null) {
        // Create an array of (n) end symbols
        var blanks = [];
        for(var i = 0 ; i < n ; i++) {
            blanks.push(endSymbol);
        }

        // create the right padding
        for(var p = n - 1 ; p > 0 ; p--) {
            // Create a tuple of (p) start symbols and (n - p) words
            result.push(sequence.slice(sequence.length - p, sequence.length).concat(blanks.slice(0, n - p)));
        }
    }
    
    return result;
}


},{"../tokenizers/regexp_tokenizer":108,"underscore":147}],69:[function(require,module,exports){
/*
Copyright (c) 2014, Lee Wenzhu

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

var _ = require("underscore")._;

exports.ngrams = function(sequence, n, startSymbol, endSymbol) {
    return ngrams(sequence, n, startSymbol, endSymbol);
}

exports.bigrams = function(sequence, startSymbol, endSymbol) {
    return ngrams(sequence, 2, startSymbol, endSymbol);
}

exports.trigrams = function(sequence, startSymbol, endSymbol) {
    return ngrams(sequence, 3, startSymbol, endSymbol);
}

var ngrams = function(sequence, n, startSymbol, endSymbol) {
    var result = [], i;
    
    if (!_(sequence).isArray()) {
        sequence = sequence.split('');
    }

    var count = _.max([0, sequence.length - n + 1]);

    // Check for left padding    
    if(typeof startSymbol !== "undefined" && startSymbol !== null) {
        // Create an array of (n) start symbols
        var blanks = [];
        for(i = 0 ; i < n ; i++) {
            blanks.push(startSymbol);
        }

        // Create the left padding
        for(var p = n - 1 ; p > 0 ; p--) {
            // Create a tuple of (p) start symbols and (n - p) words
            result.push(blanks.slice(0, p).concat(sequence.slice(0, n - p)));
        }
    }

    // Build the complete ngrams
    for (i = 0; i < count; i++) {
        result.push(sequence.slice(i, i + n));
    }

    // Check for right padding
    if(typeof endSymbol !== "undefined" && endSymbol !== null) {
        // Create an array of (n) end symbols
        var blanks = [];
        for(var i = 0 ; i < n ; i++) {
            blanks.push(endSymbol);
        }

        // create the right padding
        for(var p = n - 1 ; p > 0 ; p--) {
            // Create a tuple of (p) start symbols and (n - p) words
            result.push(sequence.slice(sequence.length - p, sequence.length).concat(blanks.slice(0, n - p)));
        }
    }
    
    return result;
};


},{"underscore":147}],70:[function(require,module,exports){
/*
 Copyright (c) 2013, Kenneth Koch

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
 * The english normalizer will create a string in which all contractions are expanded to their 
 * full meaning (i.e. "we'll" becomes "we will"). 
 *
 * It currently works off a conversion table and falls back to a set of rules.
 * Since it is applied first, the conversion table provides an "override" for the rules.
 **/
var replacer = require('../util/utils').replacer;

var conversionTable = {
	"can't":"can not",
	"won't":"will not",
	"couldn't've":"could not have",
	"i'm":"I am",
	"how'd":"how did"
};

var rules = [
	{ regex: /([azAZ]*)n\'[tT]/g, output: "$1 not" },
	{ regex: /([azAZ]*)\'[sS]/g, output: "$1 is" },
	{ regex: /([azAZ]*)\'[lL][lL]/g, output: "$1 will" },
	{ regex: /([azAZ]*)\'[rR][eE]/g, output: "$1 are" },
	{ regex: /([azAZ]*)\'[vV][eE]/g, output: "$1 have" },
	{ regex: /([azAZ]*)\'[dD]/g, output: "$1 would" }
];

// Accepts a list of tokens to expand.
var normalize_tokens = function(tokens) {
	if(typeof tokens === "string") {
		tokens = [tokens];
	}
        var results = [];
	var rule_count = rules.length;
	var num_tokens = tokens.length;
        var i, token, r, rule;
    
        for (i = 0; i < num_tokens; i++) {
            token = tokens[i];
            // Check the conversion table
            if (conversionTable[token.toLowerCase()]) {
                results = results.concat(conversionTable[token.toLowerCase()].split(/\W+/));
            }
            
            // Apply the rules
            else {
                var matched = false;
                for ( r = 0; r < rule_count; r++) {
                    rule = rules[r];
                    if (token.match(rule.regex)) {
                        results = results.concat(token.replace(rule.regex, rule.output).split(/\W+/));
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    results.push(token);
                }
            }
        }

	return results;
};





// export the relevant stuff.
exports.normalize_tokens = normalize_tokens;





},{"../util/utils":128}],71:[function(require,module,exports){
/*
 Copyright (c) 2012, Guillaume Marty

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
 * Normalize Japanese inputs and expose function to perform several conversions.
 *
 * Note: The space character is treated like a roman character as it usually
 *   has the same width as them in Japanese texts.
 *
 * \@todo Replace characters range from ㈠ to ㉃, ㊀ to ㊰ and ㇰ to ㇿ.
 * \@todo Lazy initializations of conversionTables and converters.
 * \@todo Would fixHalfwidthKana be useful?
 *
 * Descriptions of functions exposed:
 * normalizeJapanese 「全角」英字・数字を「半角」、「半角」記・カタカナを「全角」に変換
 * converters.fullwidthToHalfwidth.alphabet    「全角」英字を「半角」に変換
 * converters.halfwidthToFullwidth.alphabet    「半角」英字を「全角」に変換
 * converters.fullwidthToHalfwidth.numbers     「全角」数字を「半角」に変換
 * converters.halfwidthToFullwidth.numbers     「半角」数字を「全角」に変換 「全角」スペースを「半角」
 * converters.fullwidthToHalfwidth.punctuation 「全角」記号を「半角」に変換 「半角」スペースを「全角」
 * converters.halfwidthToFullwidth.punctuation 「半角」記号を「全角」に変換
 * converters.fullwidthToHalfwidth.katakana    「全角カタカナ」を「半角カタカナ」に変換
 * converters.halfwidthToFullwidth.katakana    「半角カタカナ」を「全角カタカナ」に変換
 * converters.hiraganaToKatakana               「カタカナ」を「ひらがな」に変換
 * converters.katakanaToHiragana               「ひらがな」を「カタカナ」に変換
 */

var flip = require('../util/utils.js').flip;
var merge = require('../util/utils.js').merge;
var replacer = require('../util/utils').replacer;

// From http://fernweh.jp/b/mb_convert_kana_js/
var conversionTables = {
  fullwidthToHalfwidth: {
    alphabet: {
      'ａ': 'a',
      'ｂ': 'b',
      'ｃ': 'c',
      'ｄ': 'd',
      'ｅ': 'e',
      'ｆ': 'f',
      'ｇ': 'g',
      'ｈ': 'h',
      'ｉ': 'i',
      'ｊ': 'j',
      'ｋ': 'k',
      'ｌ': 'l',
      'ｍ': 'm',
      'ｎ': 'n',
      'ｏ': 'o',
      'ｐ': 'p',
      'ｑ': 'q',
      'ｒ': 'r',
      'ｓ': 's',
      'ｔ': 't',
      'ｕ': 'u',
      'ｖ': 'v',
      'ｗ': 'w',
      'ｘ': 'x',
      'ｙ': 'y',
      'ｚ': 'z',
      'Ａ': 'A',
      'Ｂ': 'B',
      'Ｃ': 'C',
      'Ｄ': 'D',
      'Ｅ': 'E',
      'Ｆ': 'F',
      'Ｇ': 'G',
      'Ｈ': 'H',
      'Ｉ': 'I',
      'Ｊ': 'J',
      'Ｋ': 'K',
      'Ｌ': 'L',
      'Ｍ': 'M',
      'Ｎ': 'N',
      'Ｏ': 'O',
      'Ｐ': 'P',
      'Ｑ': 'Q',
      'Ｒ': 'R',
      'Ｓ': 'S',
      'Ｔ': 'T',
      'Ｕ': 'U',
      'Ｖ': 'V',
      'Ｗ': 'W',
      'Ｘ': 'X',
      'Ｙ': 'Y',
      'Ｚ': 'Z',
      '　': ' ' // Fullwidth space
    },

    numbers: {
      '０': '0',
      '１': '1',
      '２': '2',
      '３': '3',
      '４': '4',
      '５': '5',
      '６': '6',
      '７': '7',
      '８': '8',
      '９': '9'
    },

    symbol: {
      '＿': '_',
      '－': '-',
      '，': ',',
      '；': ';',
      '：': ':',
      '！': '!',
      '？': '?',
      '．': '.',
      '（': '(',
      '）': ')',
      '［': '[',
      '］': ']',
      '｛': '{',
      '｝': '}',
      '＠': '@',
      '＊': '*',
      '＼': '\\',
      '／': '/',
      '＆': '&',
      '＃': '#',
      '％': '%',
      '｀': '`',
      '＾': '^',
      '＋': '+',
      '＜': '<',
      '＝': '=',
      '＞': '>',
      '｜': '|',
      // Never converted: '～': '~',
      '≪': '«',
      '≫': '»',
      '─': '-',
      '＄': '$',
      '＂': '"'
    },

    purePunctuation: {
      '、': '､',
      '。': '｡',
      '・': '･',
      '「': '｢',
      '」': '｣'
    },

    punctuation: {},

    katakana: {
      '゛': 'ﾞ',
      '゜': 'ﾟ',
      'ー': 'ｰ',

      'ヴ': 'ｳﾞ',
      'ガ': 'ｶﾞ',
      'ギ': 'ｷﾞ',
      'グ': 'ｸﾞ',
      'ゲ': 'ｹﾞ',
      'ゴ': 'ｺﾞ',
      'ザ': 'ｻﾞ',
      'ジ': 'ｼﾞ',
      'ズ': 'ｽﾞ',
      'ゼ': 'ｾﾞ',
      'ゾ': 'ｿﾞ',
      'ダ': 'ﾀﾞ',
      'ヂ': 'ﾁﾞ',
      'ヅ': 'ﾂﾞ',
      'デ': 'ﾃﾞ',
      'ド': 'ﾄﾞ',
      'バ': 'ﾊﾞ',
      'パ': 'ﾊﾟ',
      'ビ': 'ﾋﾞ',
      'ピ': 'ﾋﾟ',
      'ブ': 'ﾌﾞ',
      'プ': 'ﾌﾟ',
      'ベ': 'ﾍﾞ',
      'ペ': 'ﾍﾟ',
      'ボ': 'ﾎﾞ',
      'ポ': 'ﾎﾟ',

      'ァ': 'ｧ',
      'ア': 'ｱ',
      'ィ': 'ｨ',
      'イ': 'ｲ',
      'ゥ': 'ｩ',
      'ウ': 'ｳ',
      'ェ': 'ｪ',
      'エ': 'ｴ',
      'ォ': 'ｫ',
      'オ': 'ｵ',
      'カ': 'ｶ',
      'キ': 'ｷ',
      'ク': 'ｸ',
      'ケ': 'ｹ',
      'コ': 'ｺ',
      'サ': 'ｻ',
      'シ': 'ｼ',
      'ス': 'ｽ',
      'セ': 'ｾ',
      'ソ': 'ｿ',
      'タ': 'ﾀ',
      'チ': 'ﾁ',
      'ッ': 'ｯ',
      'ツ': 'ﾂ',
      'テ': 'ﾃ',
      'ト': 'ﾄ',
      'ナ': 'ﾅ',
      'ニ': 'ﾆ',
      'ヌ': 'ﾇ',
      'ネ': 'ﾈ',
      'ノ': 'ﾉ',
      'ハ': 'ﾊ',
      'ヒ': 'ﾋ',
      'フ': 'ﾌ',
      'ヘ': 'ﾍ',
      'ホ': 'ﾎ',
      'マ': 'ﾏ',
      'ミ': 'ﾐ',
      'ム': 'ﾑ',
      'メ': 'ﾒ',
      'モ': 'ﾓ',
      'ャ': 'ｬ',
      'ヤ': 'ﾔ',
      'ュ': 'ｭ',
      'ユ': 'ﾕ',
      'ョ': 'ｮ',
      'ヨ': 'ﾖ',
      'ラ': 'ﾗ',
      'リ': 'ﾘ',
      'ル': 'ﾙ',
      'レ': 'ﾚ',
      'ロ': 'ﾛ',
      'ワ': 'ﾜ',
      'ヲ': 'ｦ',
      'ン': 'ﾝ'
    }
  },

  halfwidthToFullwidth: {}
};

var fixFullwidthKana = {
  'ゝ゛': 'ゞ',
  'ヽ゛': 'ヾ',

  'う゛': 'ゔ',
  'か゛': 'が',
  'き゛': 'ぎ',
  'く゛': 'ぐ',
  'け゛': 'げ',
  'こ゛': 'ご',
  'さ゛': 'ざ',
  'し゛': 'じ',
  'す゛': 'ず',
  'せ゛': 'ぜ',
  'そ゛': 'ぞ',
  'た゛': 'だ',
  'ち゛': 'ぢ',
  'つ゛': 'づ',
  'て゛': 'で',
  'と゛': 'ど',
  'は゛': 'ば',
  'は゜': 'ぱ',
  'ひ゛': 'び',
  'ひ゜': 'ぴ',
  'ふ゛': 'ぶ',
  'ふ゜': 'ぷ',
  'へ゛': 'べ',
  'へ゜': 'ぺ',
  'ほ゛': 'ぼ',
  'ほ゜': 'ぽ',
  'っな': 'んな',
  'っに': 'んに',
  'っぬ': 'んぬ',
  'っね': 'んね',
  'っの': 'んの',

  'ウ゛': 'ヴ',
  'カ゛': 'ガ',
  'キ゛': 'ギ',
  'ク゛': 'グ',
  'ケ゛': 'ゲ',
  'コ゛': 'ゴ',
  'サ゛': 'ザ',
  'シ゛': 'ジ',
  'ス゛': 'ズ',
  'セ゛': 'ゼ',
  'ソ゛': 'ゾ',
  'タ゛': 'ダ',
  'チ゛': 'ヂ',
  'ツ゛': 'ヅ',
  'テ゛': 'デ',
  'ト゛': 'ド',
  'ハ゛': 'バ',
  'ハ゜': 'パ',
  'ヒ゛': 'ビ',
  'ヒ゜': 'ピ',
  'フ゛': 'ブ',
  'フ゜': 'プ',
  'ヘ゛': 'ベ',
  'ヘ゜': 'ペ',
  'ホ゛': 'ボ',
  'ホ゜': 'ポ',
  'ッナ': 'ンナ',
  'ッニ': 'ンニ',
  'ッヌ': 'ンヌ',
  'ッネ': 'ンネ',
  'ッノ': 'ンノ'
};

var fixCompositeSymbolsTable = {
  '㋀': '1月',
  '㋁': '2月',
  '㋂': '3月',
  '㋃': '4月',
  '㋄': '5月',
  '㋅': '6月',
  '㋆': '7月',
  '㋇': '8月',
  '㋈': '9月',
  '㋉': '10月',
  '㋊': '11月',
  '㋋': '12月',

  '㏠': '1日',
  '㏡': '2日',
  '㏢': '3日',
  '㏣': '4日',
  '㏤': '5日',
  '㏥': '6日',
  '㏦': '7日',
  '㏧': '8日',
  '㏨': '9日',
  '㏩': '10日',
  '㏪': '11日',
  '㏫': '12日',
  '㏬': '13日',
  '㏭': '14日',
  '㏮': '15日',
  '㏯': '16日',
  '㏰': '17日',
  '㏱': '18日',
  '㏲': '19日',
  '㏳': '20日',
  '㏴': '21日',
  '㏵': '22日',
  '㏶': '23日',
  '㏷': '24日',
  '㏸': '25日',
  '㏹': '26日',
  '㏺': '27日',
  '㏻': '28日',
  '㏼': '29日',
  '㏽': '30日',
  '㏾': '31日',

  '㍘': '0点',
  '㍙': '1点',
  '㍚': '2点',
  '㍛': '3点',
  '㍜': '4点',
  '㍝': '5点',
  '㍞': '6点',
  '㍟': '7点',
  '㍠': '8点',
  '㍡': '9点',
  '㍢': '10点',
  '㍣': '11点',
  '㍤': '12点',
  '㍥': '13点',
  '㍦': '14点',
  '㍧': '15点',
  '㍨': '16点',
  '㍩': '17点',
  '㍪': '18点',
  '㍫': '19点',
  '㍬': '20点',
  '㍭': '21点',
  '㍮': '22点',
  '㍯': '23点',
  '㍰': '24点',

  '㍻': '平成',
  '㍼': '昭和',
  '㍽': '大正',
  '㍾': '明治',
  '㍿': '株式会社',

  '㌀': 'アパート',
  '㌁': 'アルファ',
  '㌂': 'アンペア',
  '㌃': 'アール',
  '㌄': 'イニング',
  '㌅': 'インチ',
  '㌆': 'ウオン',
  '㌇': 'エスクード',
  '㌈': 'エーカー',
  '㌉': 'オンス',
  '㌊': 'オーム',
  '㌋': 'カイリ', //海里
  '㌌': 'カラット',
  '㌍': 'カロリー',
  '㌎': 'ガロン',
  '㌏': 'ガンマ',
  '㌐': 'ギガ',
  '㌑': 'ギニー',
  '㌒': 'キュリー',
  '㌓': 'ギルダー',
  '㌔': 'キロ',
  '㌕': 'キログラム',
  '㌖': 'キロメートル',
  '㌗': 'キロワット',
  '㌘': 'グラム',
  '㌙': 'グラムトン',
  '㌚': 'クルゼイロ',
  '㌛': 'クローネ',
  '㌜': 'ケース',
  '㌝': 'コルナ',
  '㌞': 'コーポ',
  '㌟': 'サイクル',
  '㌠': 'サンチーム',
  '㌡': 'シリング',
  '㌢': 'センチ',
  '㌣': 'セント',
  '㌤': 'ダース',
  '㌥': 'デシ',
  '㌦': 'ドル',
  '㌧': 'トン',
  '㌨': 'ナノ',
  '㌩': 'ノット',
  '㌪': 'ハイツ',
  '㌫': 'パーセント',
  '㌬': 'パーツ',
  '㌭': 'バーレル',
  '㌮': 'ピアストル',
  '㌯': 'ピクル',
  '㌰': 'ピコ',
  '㌱': 'ビル',
  '㌲': 'ファラッド',
  '㌳': 'フィート',
  '㌴': 'ブッシェル',
  '㌵': 'フラン',
  '㌶': 'ヘクタール',
  '㌷': 'ペソ',
  '㌸': 'ペニヒ',
  '㌹': 'ヘルツ',
  '㌺': 'ペンス',
  '㌻': 'ページ',
  '㌼': 'ベータ',
  '㌽': 'ポイント',
  '㌾': 'ボルト',
  '㌿': 'ホン',
  '㍀': 'ポンド',
  '㍁': 'ホール',
  '㍂': 'ホーン',
  '㍃': 'マイクロ',
  '㍄': 'マイル',
  '㍅': 'マッハ',
  '㍆': 'マルク',
  '㍇': 'マンション',
  '㍈': 'ミクロン',
  '㍉': 'ミリ',
  '㍊': 'ミリバール',
  '㍋': 'メガ',
  '㍌': 'メガトン',
  '㍍': 'メートル',
  '㍎': 'ヤード',
  '㍏': 'ヤール',
  '㍐': 'ユアン',
  '㍑': 'リットル',
  '㍒': 'リラ',
  '㍓': 'ルピー',
  '㍔': 'ルーブル',
  '㍕': 'レム',
  '㍖': 'レントゲン',
  '㍗': 'ワット'
};

// punctuation is pure_punctuation
conversionTables.fullwidthToHalfwidth.punctuation = merge(
    conversionTables.fullwidthToHalfwidth.symbol,
    conversionTables.fullwidthToHalfwidth.purePunctuation
)

// Fill in the conversion tables with the flipped tables.
conversionTables.halfwidthToFullwidth.alphabet = flip(conversionTables.fullwidthToHalfwidth.alphabet);
conversionTables.halfwidthToFullwidth.numbers = flip(conversionTables.fullwidthToHalfwidth.numbers);
conversionTables.halfwidthToFullwidth.symbol = flip(conversionTables.fullwidthToHalfwidth.symbol);
conversionTables.halfwidthToFullwidth.purePunctuation = flip(conversionTables.fullwidthToHalfwidth.purePunctuation);
conversionTables.halfwidthToFullwidth.punctuation = flip(conversionTables.fullwidthToHalfwidth.punctuation);
conversionTables.halfwidthToFullwidth.katakana = flip(conversionTables.fullwidthToHalfwidth.katakana);

// Build the normalization table.
conversionTables.normalize = merge(
    conversionTables.fullwidthToHalfwidth.alphabet,
    conversionTables.fullwidthToHalfwidth.numbers,
    conversionTables.fullwidthToHalfwidth.symbol,
    conversionTables.halfwidthToFullwidth.purePunctuation,
    conversionTables.halfwidthToFullwidth.katakana
    );

var converters = {
  fullwidthToHalfwidth: {
    alphabet: replacer(conversionTables.fullwidthToHalfwidth.alphabet),
    numbers: replacer(conversionTables.fullwidthToHalfwidth.numbers),
    symbol: replacer(conversionTables.fullwidthToHalfwidth.symbol),
    purePunctuation: replacer(conversionTables.fullwidthToHalfwidth.purePunctuation),
    punctuation: replacer(conversionTables.fullwidthToHalfwidth.punctuation),
    katakana: replacer(conversionTables.fullwidthToHalfwidth.katakana)
  },

  halfwidthToFullwidth: {
    alphabet: replacer(conversionTables.halfwidthToFullwidth.alphabet),
    numbers: replacer(conversionTables.halfwidthToFullwidth.numbers),
    symbol: replacer(conversionTables.halfwidthToFullwidth.symbol),
    purePunctuation: replacer(conversionTables.halfwidthToFullwidth.purePunctuation),
    punctuation: replacer(conversionTables.halfwidthToFullwidth.punctuation),
    katakana: replacer(conversionTables.halfwidthToFullwidth.katakana)
  },

  fixFullwidthKana: replacer(fixFullwidthKana),
  normalize: replacer(conversionTables.normalize)
};

var fixCompositeSymbols = replacer(fixCompositeSymbolsTable);


/**
 * Convert hiragana to fullwidth katakana.
 * According to http://jsperf.com/converting-japanese, these implementations are
 * faster than using lookup tables.
 *
 * @param {string} str A string.
 * @return {string} A string not containing hiragana.
 */
converters.hiraganaToKatakana = function(str) {
  str = converters.halfwidthToFullwidth.katakana(str);
  str = converters.fixFullwidthKana(str);

  str = str.replace(/ゝ/g, 'ヽ');
  str = str.replace(/ゞ/g, 'ヾ');
  //str = str.replace(/?/g, '𛀀'); // Letter archaic E

  str = str.replace(/[ぁ-ゖ]/g, function(str) {
    return String.fromCharCode(str.charCodeAt(0) + 96);
  });

  return str;
};


/**
 * Convert katakana to hiragana.
 *
 * @param {string} str A string.
 * @return {string} A string not containing katakana.
 */
converters.katakanaToHiragana = function(str) {
  str = converters.halfwidthToFullwidth.katakana(str);
  str = converters.fixFullwidthKana(str);

  str = str.replace(/ヽ/g, 'ゝ');
  str = str.replace(/ヾ/g, 'ゞ');
  //str = str.replace(/?/g, '𛀁'); // Letter archaic E

  str = str.replace(/[ァ-ヶ]/g, function(str) {
    return String.fromCharCode(str.charCodeAt(0) - 96);
  });

  return str;
};


/**
 * Fix kana and apply the following processes;
 * * Replace repeat characters
 * * Alphabet to halfwidth
 * * Numbers to halfwidth
 * * Punctuation to fullwidth
 * * Katakana to fullwidth
 * * Fix fullwidth kana
 * * Replace composite symbols
 *
 * @param {string} str
 * @return {string}
 */
var normalize_ja = function(str) {
  // Replace repeat characters.
  str = str
    .replace(/(..)々々/g, '$1$1')
    .replace(/(.)々/g, '$1$1');

  str = converters.normalize(str);
  str = converters.fixFullwidthKana(str);

  // Replace composite symbols.
  str = fixCompositeSymbols(str);

  return str;
};

exports.normalize_ja = normalize_ja;
exports.converters = converters;

},{"../util/utils":128,"../util/utils.js":128}],72:[function(require,module,exports){
/*
 Copyright (c) 2014, Kristoffer Brabrand

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
 * Remove commonly used diacritic marks from a string as these
 * are not used in a consistent manner. Leave only ä, ö, ü.
 */
var remove_diacritics = function(text) {
    text = text.replace('à', 'a');
    text = text.replace('À', 'A');
    text = text.replace('á', 'a');
    text = text.replace('Á', 'A');
    text = text.replace('â', 'a');
    text = text.replace('Â', 'A');
    text = text.replace('ç', 'c');
    text = text.replace('Ç', 'C');
    text = text.replace('è', 'e');
    text = text.replace('È', 'E');
    text = text.replace('é', 'e');
    text = text.replace('É', 'E');
    text = text.replace('ê', 'e');
    text = text.replace('Ê', 'E');
    text = text.replace('î', 'i');
    text = text.replace('Î', 'I');
    text = text.replace('ñ', 'n');
    text = text.replace('Ñ', 'N');
    text = text.replace('ó', 'o');
    text = text.replace('Ó', 'O');
    text = text.replace('ô', 'o');
    text = text.replace('Ô', 'O');
    text = text.replace('û', 'u');
    text = text.replace('Û', 'U');
    text = text.replace('š', 's');
    text = text.replace('Š', 'S');

    return text;
};

// export the relevant stuff.
exports.remove_diacritics = remove_diacritics;
},{}],73:[function(require,module,exports){
/*
 Copyright (c) 2012, Alexy Maslennikov

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
 * Script to remove diacritics. Original source was taken from
 * http://lehelk.com/2011/05/06/script-to-remove-diacritics/
 */
var diacriticsRemovalMap = [
    {'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
    {'base':'AA','letters':/[\uA732]/g},
    {'base':'AE','letters':/[\u00C6\u01FC\u01E2]/g},
    {'base':'AO','letters':/[\uA734]/g},
    {'base':'AU','letters':/[\uA736]/g},
    {'base':'AV','letters':/[\uA738\uA73A]/g},
    {'base':'AY','letters':/[\uA73C]/g},
    {'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
    {'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
    {'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
    {'base':'DZ','letters':/[\u01F1\u01C4]/g},
    {'base':'Dz','letters':/[\u01F2\u01C5]/g},
    {'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
    {'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
    {'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
    {'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
    {'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
    {'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
    {'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
    {'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
    {'base':'LJ','letters':/[\u01C7]/g},
    {'base':'Lj','letters':/[\u01C8]/g},
    {'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
    {'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
    {'base':'NJ','letters':/[\u01CA]/g},
    {'base':'Nj','letters':/[\u01CB]/g},
    {'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
    {'base':'OI','letters':/[\u01A2]/g},
    {'base':'OO','letters':/[\uA74E]/g},
    {'base':'OU','letters':/[\u0222]/g},
    {'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
    {'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
    {'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
    {'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
    {'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
    {'base':'TZ','letters':/[\uA728]/g},
    {'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
    {'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
    {'base':'VY','letters':/[\uA760]/g},
    {'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
    {'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
    {'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
    {'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
    {'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
    {'base':'aa','letters':/[\uA733]/g},
    {'base':'ae','letters':/[\u00E6\u01FD\u01E3]/g},
    {'base':'ao','letters':/[\uA735]/g},
    {'base':'au','letters':/[\uA737]/g},
    {'base':'av','letters':/[\uA739\uA73B]/g},
    {'base':'ay','letters':/[\uA73D]/g},
    {'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
    {'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
    {'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},
    {'base':'dz','letters':/[\u01F3\u01C6]/g},
    {'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
    {'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
    {'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
    {'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
    {'base':'hv','letters':/[\u0195]/g},
    {'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
    {'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
    {'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
    {'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
    {'base':'lj','letters':/[\u01C9]/g},
    {'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
    {'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
    {'base':'nj','letters':/[\u01CC]/g},
    {'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
    {'base':'oi','letters':/[\u01A3]/g},
    {'base':'ou','letters':/[\u0223]/g},
    {'base':'oo','letters':/[\uA74F]/g},
    {'base':'p','letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
    {'base':'q','letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
    {'base':'r','letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
    {'base':'s','letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
    {'base':'t','letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
    {'base':'tz','letters':/[\uA729]/g},
    {'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
    {'base':'v','letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
    {'base':'vy','letters':/[\uA761]/g},
    {'base':'w','letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
    {'base':'x','letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
    {'base':'y','letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
    {'base':'z','letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
];


module.exports = function(str) {
	var rules = diacriticsRemovalMap;
	for (var i = 0; i < rules.length; i++) {
		str = str.replace(rules[i].letters, rules[i].base);
	}
	return str;
};

},{}],74:[function(require,module,exports){
/*
Copyright (c) 2012, Alexy Maslenninkov

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

/*
 * Daitch-Mokotoff Soundex Coding
 *
 * The Daitch-Mokotoff Soundex System was created by Randy Daitch and Gary
 * Mokotoff of the Jewish Genealogical Society because they concluded the system
 * developed by Robert Russell in 1918, and in use today by the U.S. National
 * Archives and Records Administration (NARA) does not apply well to many Slavic
 * and Yiddish surnames.  It also includes refinements that are independent of
 * ethnic considerations.
 *
 * The rules for converting surnames into D-M Code numbers are listed below.
 * They are followed by the coding chart.
 *
 * 1. Names are coded to six digits, each digit representing a sound listed in
 * the coding chart (below).
 *
 * 2. When a name lacks enough coded sounds for six digits, use zeros to fill to
 * six digits. GOLDEN which has only four coded sounds [G-L-D-N] is coded as
 * 583600.
 *
 * 3. The letters A, E, I, O, U, J, and Y are always coded at the beginning of a
 * name as in Alpert 087930. In any other situation, they are ignored except
 * when two of them form a pair and the pair comes before a vowel, as in Breuer
 * 791900 but not Freud.
 *
 * 4. The letter H is coded at the beginning of a name, as in Haber 579000, or
 * preceding a vowel, as in Manheim 665600, otherwise it is not coded.
 *
 * 5. When adjacent sounds can combine to form a larger sound, they are given
 * the code number of the larger sound.  Mintz which is not coded MIN-T-Z but
 * MIN-TZ 664000.
 *
 * 6. When adjacent letters have the same code number, they are coded as one
 * sound, as in TOPF, which is not coded TO-P-F 377000 but TO-PF 370000.
 * Exceptions to this rule are the letter combinations MN and NM, whose letters
 * are coded separately, as in Kleinman, which is coded 586660 not 586600.
 *
 * 7. When a surname consists or more than one word, it is coded as if one word,
 * such as Ben Aron which is treated as Benaron.
 *
 * 8. Several letter and letter combinations pose the problem that they may
 * sound in one of two ways.  The letter and letter combinations CH, CK, C, J,
 * and RS are assigned two possible code numbers.
 *
 * For more info, see http://www.jewishgen.org/InfoFiles/soundex.html
 */

/**
 * D-M transformation table in the form of finite-state machine.
 * Every element of the table having member with zero index represents
 * legal FSM state; every non-zero key is the transition rule.
 *
 * Every legal state comprises tree values chosen according to the position
 * of the letter combination in the word:
 *   0: start of a word;
 *   1: before a vowel;
 *   2: any other situation.
 */
var codes = {
    A: {
        0: [0, -1, -1],
        I: [[0, 1, -1]],
        J: [[0, 1, -1]],
        Y: [[0, 1, -1]],
        U: [[0, 7, -1]]},
    B: [[7, 7, 7]],
    C: {
        0: [5, 5, 5],
        Z: {0: [4, 4, 4], S: [[4, 4, 4]]},
        S: {0: [4, 4, 4], Z: [[4, 4, 4]]},
        K: [[5, 5, 5], [45, 45, 45]],
        H: {0: [5, 5, 5], S: [[5, 54, 54]]}},
    D: {
        0: [3, 3, 3],
        T: [[3, 3, 3]],
        Z: {0: [4, 4, 4], H: [[4, 4, 4]], S: [[4, 4, 4]]},
        S: {0: [4, 4, 4], H: [[4, 4, 4]], Z: [[4, 4, 4]]},
        R: {S: [[4, 4, 4]], Z: [[4, 4, 4]]}},
    E: {
        0: [0, -1, -1],
        I: [[0, 1, -1]],
        J: [[0, 1, -1]],
        Y: [[0, 1, -1]],
        U: [[1, 1, -1]],
        W: [[1, 1, -1]]},
    F: {
        0: [7, 7, 7],
        B: [[7, 7, 7]]},
    G: [[5, 5, 5]],
    H: [[5, 5, -1]],
    I: {
        0: [0, -1, -1],
        A: [[1, -1, -1]],
        E: [[1, -1, -1]],
        O: [[1, -1, -1]],
        U: [[1, -1, -1]]},
    J: [[4, 4, 4]],
    K: {
        0: [5, 5, 5],
        H: [[5, 5, 5]],
        S: [[5, 54, 54]]},
    L: [[8, 8, 8]],
    M: {
        0: [6, 6, 6],
        N: [[66, 66, 66]]},
    N: {
        0: [6, 6, 6],
        M: [[66, 66, 66]]},
    O: {
        0: [0, -1, -1],
        I: [[0, 1, -1]],
        J: [[0, 1, -1]],
        Y: [[0, 1, -1]]},
    P: {
        0: [7, 7, 7],
        F: [[7, 7, 7]],
        H: [[7, 7, 7]]},
    Q: [[5, 5, 5]],
    R: {
        0: [9, 9, 9],
        Z: [[94, 94, 94], [94, 94, 94]],
        S: [[94, 94, 94], [94, 94, 94]]},
    S: {
        0: [4, 4, 4],
        Z: {0: [4, 4, 4], T: [[2, 43, 43]], C: {Z: [[2, 4, 4]], S: [[2, 4, 4]]}, D: [[2, 43, 43]]},
        D: [[2, 43, 43]],
        T: {0: [2, 43, 43], R: {Z: [[2, 4, 4]], S: [[2, 4, 4]]}, C: {H: [[2, 4, 4]]}, S: {H: [[2, 4, 4]], C: {H: [[2, 4, 4]]}}},
        C: {0: [2, 4, 4], H: {0: [4, 4, 4], T: {0: [2, 43, 43], S: {C: {H: [[2, 4, 4]]}, H: [[2, 4, 4]]}, C: {H: [[2, 4, 4]]}}, D: [[2, 43, 43]]}},
        H: {0: [4, 4, 4], T: {0: [2, 43, 43], C: {H: [[2, 4, 4]]}, S: {H: [[2, 4, 4]]}}, C: {H: [[2, 4, 4]]}, D: [[2, 43, 43]]}},
    T: {
        0: [3, 3, 3],
        C: {0: [4, 4, 4], H: [[4, 4, 4]]},
        Z: {0: [4, 4, 4], S: [[4, 4, 4]]},
        S: {0: [4, 4, 4], Z: [[4, 4, 4]], H: [[4, 4, 4]], C: {H: [[4, 4, 4]]}},
        T: {S: {0: [4, 4, 4], Z: [[4, 4, 4]], C: {H: [[4, 4, 4]]}}, C: {H: [[4, 4, 4]]}, Z: [[4, 4, 4]]},
        H: [[3, 3, 3]],
        R: {Z: [[4, 4, 4]], S: [[4, 4, 4]]}},
    U: {
        0: [0, -1, -1],
        E: [[0, -1, -1]],
        I: [[0, 1, -1]],
        J: [[0, 1, -1]],
        Y: [[0, 1, -1]]},
    V: [[7, 7, 7]],
    W: [[7, 7, 7]],
    X: [[5, 54, 54]],
    Y: [[1, -1, -1]],
    Z: {
        0: [4, 4, 4],
        D: {0: [2, 43, 43], Z: {0: [2, 4, 4], H: [[2, 4, 4]]}},
        H: {0: [4, 4, 4], D: {0: [2, 43, 43], Z: {H: [[2, 4, 4]]}}},
        S: {0: [4, 4, 4], H: [[4, 4, 4]], C: {H: [[4, 4, 4]]}}}
};


function process(word, codeLength) {
	codeLength = codeLength || 6;
    word = word.toUpperCase();
    var output = '';

    var pos = 0, lastCode = -1;
    while (pos < word.length) {
        var substr = word.slice(pos);
        var rules = findRules(substr);

        var code;
        if (pos == 0) {
            // at the beginning of the word
            code = rules.mapping[0];
        } else if (substr[rules.length] && findRules(substr[rules.length]).mapping[0] == 0) {
            // before a vowel
            code = rules.mapping[1];
        } else {
            // any other situation
            code = rules.mapping[2];
        }

        if ((code != -1) && (code != lastCode)) output += code;
        lastCode = code;
        pos += rules.length;

    }

    return normalizeLength(output, codeLength);
}


function findRules(str) {
    var state = codes[str[0]];
    var legalState = state || [[-1,-1,-1]],
        charsInvolved = 1;

    for (var offs = 1; offs < str.length; offs++) {
        if (!state || !state[str[offs]]) break;

        state = state[str[offs]];
        if (state[0]) {
            legalState = state;
            charsInvolved = offs + 1;
        }
    }

    return {
        length: charsInvolved,
        mapping: legalState[0]
    };
}


/**
 * Pad right with zeroes or cut excess symbols to fit length
 */
function normalizeLength(token, length) {
	length = length || 6;
	if (token.length < length) {
		token += (new Array(length - token.length + 1)).join('0');
	}
    return token.slice(0, length);
}

var Phonetic = require('./phonetic');
var soundex = new Phonetic();
soundex.process = process;
module.exports = soundex;


},{"./phonetic":77}],75:[function(require,module,exports){
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

var Phonetic = require('./phonetic');

var DoubleMetaphone = new Phonetic();
module.exports = DoubleMetaphone;

function isVowel(c) {
	return c && c.match(/[aeiouy]/i);
}

function truncate(string, length) {
    if(string.length >= length)
        string = string.substring(0, length);
        
    return string;
}

function process(token, maxLength) {
	token = token.toUpperCase();
	var primary = '', secondary = '';	
    var pos = 0;
    maxLength == maxLength || 32;

    function subMatch(startOffset, stopOffset, terms) {
        return subMatchAbsolute(pos + startOffset, pos + stopOffset, terms);
    }

    function subMatchAbsolute(startOffset, stopOffset, terms) {
        return terms.indexOf(token.substring(startOffset, stopOffset)) > -1;
    }

    function addSecondary(primaryAppendage, secondaryAppendage) {
    	primary += primaryAppendage;
    	secondary += secondaryAppendage;
    }

    function add(primaryAppendage) {
    	addSecondary(primaryAppendage, primaryAppendage);
    }

    function addCompressedDouble(c, encoded) {
    	if(token[pos + 1] == c)
    		pos++;
    	add(encoded || c);
    }

    function handleC() {

        if(pos >= 1 && !isVowel(token[pos - 2]) 
                && token[pos - 1] == 'A' && token[pos + 1] == 'H'
                    && (token[pos + 2] != 'I' && token[pos + 2] != 'I')
                        || subMatch(-2, 4, ['BACHER', 'MACHER'])) {
            add('K');
            pos++;
        } else if(pos == 0 && token.substring(1, 6) == 'EASAR') {
            add('S');
            add('S');
            add('R');
            pos += 6;
        } else if(token.substring(pos + 1, pos + 4) == 'HIA') {
            add('K');
            pos++;
        } else if(token[pos + 1] == 'H') {
            if(pos > 0 && token.substring(pos + 2, pos + 4) == 'AE') {
                addSecondary('K', 'X');
                pos++;
            } else if(pos == 0 
                        && (subMatch(1, 6, ['HARAC', 'HARIS']) 
                            || subMatch(1, 4, ['HOR', 'HUM', 'HIA', 'HEM']))
                        && token.substring(pos + 1, pos + 5) != 'HORE') {
                add('K');
                pos++;
            } else {
                if((subMatchAbsolute(0, 3, ['VAN', 'VON']) || token.substring(0,  3) == 'SCH')
                    || subMatch(-2, 4, ['ORCHES', 'ARCHIT', 'ORCHID'])
                    || subMatch(2, 3, ['T', 'S'])
                    || ((subMatch(-1, 0, ['A', 'O', 'U', 'E']) || pos == 0) 
                        && subMatch(2, 3, ['B', 'F', 'H', 'L', 'M', 'N', 'R', 'V', 'W']))) {
                    add('K');
                } else if(pos > 0) {

                    if(token.substring(0, 2) == 'MC') {
                        add('K');
                    } else {
                        addSecondary('X', 'K');   
                    }
                } else {
                    add('X');
                }

                pos++;
            } 
        } else if(token.substring(pos, pos + 2) == 'CZ' 
                && token.substring(pos - 2, pos + 1) != 'WICZ') {
            addSecondary('S', 'X');
            pos++;
        } else if(token.substring(pos, pos + 3) == 'CIA') {
            add('X');
            pos += 2;
        } else if(token[pos + 1] == 'C' && pos != 1 && token[0] != 'M') {
            if(['I', 'E', 'H'].indexOf(token[pos + 2]) > -1 
                    && token.substring(pos + 2, pos + 4) != 'HU') {
                if(pos == 1 && token[pos - 1] == 'A'
                        || subMatch(-1, 4, ['UCCEE', 'UCCES'])) {
                    add('KS');
                } else {
                   add('X');
                }

               pos +=2;
            } else {
                add('K');
                pos++;
            }
        } else if(['K', 'G', 'Q'].indexOf(token[pos + 1]) > -1) {
            add('K');
            pos++;
        } else if(['E', 'I', 'Y'].indexOf(token[pos + 1]) > -1) {
            if(subMatch(1, 3, ['IA', 'IE', 'IO'])) {
                addSecondary('S', 'X');   
            } else {
                add('S');
            }
            pos++;
        } else {            
            add('K');
            if(token[pos + 1] == ' ' && ['C', 'Q', 'G'].indexOf(token[pos + 2])) {
                pos += 2;
            } else if(['C', 'K', 'Q'].indexOf(token[pos + 1]) > -1
                    && !subMatch(1, 3, ['CE', 'CI'])) {
                pos++;
            } 
        }
    }

    function handleD() {
    	if(token[pos + 1] == 'G') {
    		if(['I', 'E', 'Y'].indexOf(token[pos + 2]) > -1)  {
    			add('J');
    			pos += 2;
    		} else {
    			add('TK');
    			pos++;
    		}
	    } else if(token[pos + 1] == 'T') {
    		add('T');
	    	pos++;    		
    	} else
    		addCompressedDouble('D', 'T');
    }

    function handleG() {
        if(token[pos + 1] == 'H') {
            if(pos > 0 && !isVowel(token[pos - 1])) {
                add('K');
                pos++;
            } else if(pos == 0) {
                if(token[pos + 2] == 'I') {
                    add('J');
                } else {
                    add('K');
                }
                pos++;
            } else if(pos > 1 
                && (['B', 'H', 'D'].indexOf(token[pos - 2]) > -1
                    || ['B', 'H', 'D'].indexOf(token[pos - 3]) > -1
                    || ['B', 'H'].indexOf(token[pos - 4]) > -1)) {
                pos++;
            } else {
                if(pos > 2
                        && token[pos - 1] == 'U'
                        && ['C', 'G', 'L', 'R', 'T'].indexOf(token[pos - 3]) > -1) {
                    add('F');
                } else if(token[pos - 1] != 'I') {
                    add('K');
                }

                pos++;
            }
        } else if(token[pos + 1] == 'N') {
            if(pos == 1 && startsWithVowel && !slavoGermanic) {
                addSecondary('KN', 'N');
            } else {
                if(token.substring(pos + 2, pos + 4) != 'EY'
                        && (token[pos + 1] != 'Y'
                            && !slavoGermanic)) {
                    addSecondary('N', 'KN');
                } else
                    add('KN');
            }
            pos++;
        } else if(token.substring(pos + 1, pos + 3) == 'LI' && !slavoGermanic) {
            addSecondary('KL', 'L');
            pos++;
        } else if(pos == 0 && (token[pos + 1] == 'Y'                
                || subMatch(1, 3, ['ES', 'EP', 'EB', 'EL', 'EY', 'IB', 'IL', 'IN', 'IE', 'EI', 'ER']))) {
            addSecondary('K', 'J')
        } else {
            addCompressedDouble('G', 'K');
        }
    }

    function handleH() {
		// keep if starts a word or is surrounded by vowels
		if((pos == 0 || isVowel(token[pos - 1])) && isVowel(token[pos + 1])) {
			add('H');
			pos++;
		}    	
    }    

    function handleJ() {
        var jose = (token.substring(pos + 1, pos + 4) == 'OSE');

        if(san || jose) {
            if((pos == 0 && token[pos + 4] == ' ') 
                    || san) {
                add('H');            
            } else
                add('J', 'H');
        } else {
            if(pos == 0/* && !jose*/) {
                addSecondary('J', 'A');
            } else if(isVowel(token[pos - 1]) && !slavoGermanic 
                    && (token[pos + 1] == 'A' || token[pos + 1] == 'O')) {
                addSecondary('J', 'H');
            } else if(pos == token.length - 1) {
                addSecondary('J', ' ');
            } else
                addCompressedDouble('J');
        }
    }

    function handleL() {
    	if(token[pos + 1] == 'L') {
    		if(pos == token.length - 3 && (
    					subMatch(-1, 3, ['ILLO', 'ILLA', 'ALLE']) || (
    						token.substring(pos - 1, pos + 3) == 'ALLE' &&
    						(subMatch(-2, -1, ['AS', 'OS']) > -1 ||
    						['A', 'O'].indexOf(token[token.length - 1]) > -1)))) {
    			addSecondary('L', '');
    			pos++;
    			return;
    		}
    		pos++;	
    	}
    	add('L');
    }

    function handleM() {
    	addCompressedDouble('M');
    	if(token[pos - 1] == 'U' && token[pos + 1] == 'B' && 
    			((pos == token.length - 2  || token.substring(pos + 2, pos + 4) == 'ER')))
    		pos++;
    }

    function handleP() {
    	if(token[pos + 1] == 'H') {
    		add('F');
    		pos++;	
    	} else {
    		addCompressedDouble('P');
    		    		
			if(token[pos + 1] == 'B')
    			pos++;
    	}
    }

    function handleR() {
    	if(pos == token.length - 1 && !slavoGermanic
    			&& token.substring(pos - 2, pos) == 'IE'
    			&& !subMatch(-4, -3, ['ME', 'MA'])) {
    		addSecondary('', 'R');
    	} else
	    	addCompressedDouble('R');    		
    }

    function handleS() {
        if(pos == 0 && token.substring(0, 5) == 'SUGAR') {
            addSecondary('X', 'S');
        } else if(token[pos + 1] == 'H') {
            if(subMatch(2, 5, ['EIM', 'OEK', 'OLM', 'OLZ'])) {
                add('S');
            } else {
                add('X');
            }
            pos++;
        } else if(subMatch(1, 3, ['IO', 'IA'])) {
            if(slavoGermanic) {
                add('S');
            } else {
                addSecondary('S', 'X');
            }
            pos++;
        } else if((pos == 0 && ['M', 'N', 'L', 'W'].indexOf(token[pos + 1]) > -1) 
                || token[pos + 1] == 'Z') {
            addSecondary('S', 'X');
            if(token[pos + 1] == 'Z')
                pos++;
        } else if(token.substring(pos, pos + 2) == 'SC') {
            if(token[pos + 2] == 'H') {
                if(subMatch(3, 5, ['ER', 'EN'])) {
                    addSecondary('X', 'SK');
                } else if(subMatch(3, 5, ['OO', 'UY', 'ED', 'EM'])) {
                    add('SK');
                } else if(pos == 0 && !isVowel(token[3]) && token[3] != 'W') {
                    addSecondary('X', 'S');
                } else {
                    add('X');   
                } 
            } else if(['I', 'E', 'Y'].indexOf(token[pos + 2]) > -1) {
                add('S');
            } else {
                add('SK');
            }

            pos += 2;            
        } else if(pos == token.length - 1
                && subMatch(-2, 0, ['AI', 'OI'])) {
            addSecondary('', 'S');            
        } else if(token[pos + 1] != 'L' && (
                token[pos - 1] != 'A' && token[pos - 1] != 'I')) {
            addCompressedDouble('S');
            if(token[pos + 1] == 'Z')
                pos++;
        }
    }

    function handleT() {
        if(token.substring(pos + 1, pos + 4) == 'ION') {
            add('XN');
            pos += 3;
        } else if(subMatch(1, 3, ['IA', 'CH'])) {
            add('X');
            pos += 2;
        } else if(token[pos + 1] == 'H' 
                || token.substring(1, 2) == 'TH') {
            if(subMatch(2, 4, ['OM', 'AM']) 
                    || ['VAN ', 'VON '].indexOf(token.substring(0, 4)) > -1
                    || token.substring(0, 3) == 'SCH') {
                add('T');            
            } else
                addSecondary('0', 'T');
            pos++;
        } else {
            addCompressedDouble('T');

            if(token[pos + 1] == 'D')
                pos++;
        }
    }

    function handleX() {
    	if(pos == 0) {
    		add('S');
    	} else if(!(pos == token.length - 1 
	    		&& (['IAU', 'EAU', 'IEU'].indexOf(token.substring(pos - 3, pos)) > -1
	    			|| ['AU', 'OU'].indexOf(token.substring(pos - 2, pos)) > -1))) {
    		add('KS');
    	}
    }

    function handleW() {
        if(pos == 0) {
            if(token[1] == 'H') {
                add('A');
            } else if (isVowel(token[1])) {
                addSecondary('A', 'F');
            }
        } else if((pos == token.length - 1 && isVowel(token[pos - 1]) 
                    || subMatch(-1, 4, ['EWSKI', 'EWSKY', 'OWSKI', 'OWSKY'])
                    || token.substring(0, 3) == 'SCH')) {
                addSecondary('', 'F');
                pos++;
        } else if(['ICZ', 'ITZ'].indexOf(token.substring(pos + 1, pos + 4)) > -1) {
            addSecondary('TS', 'FX');
            pos += 3;
        }
    }

    function handleZ() {
        if(token[pos + 1] == 'H') {
            add('J');
            pos++;            
        } else if(subMatch(1, 3, ['ZO', 'ZI', 'ZA']) 
                || (slavoGermanic && pos > 0 && token[pos - 1] != 'T')) {
            addSecondary('S', 'TS');
            pos++; 
        } else
            addCompressedDouble('Z', 'S');
    }

    var san = (token.substring(0, 3) == 'SAN');
    var startsWithVowel = isVowel(token[0]);
    var slavoGermanic = token.match(/(W|K|CZ|WITZ)/);

    if(subMatch(0, 2, ['GN', 'KN', 'PN', 'WR', 'PS'])) {
    	pos++;
    }

    while(pos < token.length) {

    	switch(token[pos]) {
	        case 'A': case 'E': case 'I': case 'O': case 'U': case 'Y': 	        
	        case 'Ê': case 'É': case 'É': case'À':
		        if(pos == 0)
		        	add('A');
		        break;
		    case 'B':
		    	addCompressedDouble('B', 'P');
		    	break;
            case 'C':
                handleC();
                break;
	        case 'Ç':
	            add("S");
	            break;
	        case 'D':
	        	handleD();
	        	break;
	        case 'F': case 'K': case 'N':
	        	addCompressedDouble(token[pos]);
	        	break;
            case 'G':
                handleG();
                break;
	        case 'H':
	        	handleH();
	        	break;
            case 'J':
                handleJ();
                break;
	        case 'L':
	        	handleL();
	        	break;
	        case 'M':
	        	handleM();
	        	break;
	        case 'Ñ':
	        	add('N');
	        	break;
	        case 'P':
	        	handleP();
	        	break;
	        case 'Q':
	        	addCompressedDouble('Q', 'K');
	        	break;
	        case 'R':
	        	handleR();
	        	break;
            case 'S':
                handleS();
                break;
            case 'T':
                handleT();
                break;
	        case 'V':
	        	addCompressedDouble('V', 'F');
	        	break;
            case 'W':
                handleW();
                break;
	        case 'X':
	        	handleX();
	        	break;
	        case 'Z':
	        	handleZ();
	        	break;
    	}

        if(primary.length >= maxLength && secondary.length >= maxLength) {
            break;
        }

    	pos++;
    }

    return [truncate(primary, maxLength), truncate(secondary, maxLength)];
}

function compare(stringA, stringB) {
    var encodingsA = process(stringA),
        encodingsB = process(stringB);

    return encodingsA[0] == encodingsB[0] || 
        encodingsA[1] == encodingsB[1];
};

DoubleMetaphone.compare = compare
DoubleMetaphone.process = process;
DoubleMetaphone.isVowel = isVowel;

},{"./phonetic":77}],76:[function(require,module,exports){
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

var Phonetic = require('./phonetic');

function dedup(token) {
    return token.replace(/([^c])\1/g, '$1');
}

function dropInitialLetters(token) {
    if(token.match(/^(kn|gn|pn|ae|wr)/))
        return token.substr(1, token.length - 1);
        
    return token;
}

function dropBafterMAtEnd(token) {
    return token.replace(/mb$/, 'm');
}

function cTransform(token) {
    

    token = token.replace(/([^s]|^)(c)(h)/g, '$1x$3').trim();


    token = token.replace(/cia/g, 'xia');
    token = token.replace(/c(i|e|y)/g, 's$1');
    token = token.replace(/c/g, 'k'); 
    
    return token;
}

function dTransform(token) {
    token = token.replace(/d(ge|gy|gi)/g, 'j$1');
    token = token.replace(/d/g, 't');
    
    return token;
}

function dropG(token) {
    token = token.replace(/gh(^$|[^aeiou])/g, 'h$1');
    token = token.replace(/g(n|ned)$/g, '$1');    
    
    return token;
}

function transformG(token) {
    token = token.replace(/gh/g, 'f'); 
    token = token.replace(/([^g]|^)(g)(i|e|y)/g, '$1j$3');
    token = token.replace(/gg/g, 'g');
    token = token.replace(/g/g, 'k');    
    
    return token;
}

function dropH(token) {
    return token.replace(/([aeiou])h([^aeiou]|$)/g, '$1$2');
}

function transformCK(token) {
    return token.replace(/ck/g, 'k');
}
function transformPH(token) {
    return token.replace(/ph/g, 'f');
}

function transformQ(token) {
    return token.replace(/q/g, 'k');
}

function transformS(token) {
    return token.replace(/s(h|io|ia)/g, 'x$1');
}

function transformT(token) {
    token = token.replace(/t(ia|io)/g, 'x$1');
    token = token.replace(/th/, '0');
    
    return token;
}

function dropT(token) {
    return token.replace(/tch/g, 'ch');
}

function transformV(token) {
    return token.replace(/v/g, 'f');
}

function transformWH(token) {
    return token.replace(/^wh/, 'w');
}

function dropW(token) {
    return token.replace(/w([^aeiou]|$)/g, '$1');
}

function transformX(token) {
    token = token.replace(/^x/, 's');
    token = token.replace(/x/g, 'ks');
    return token;
}

function dropY(token) {
    return token.replace(/y([^aeiou]|$)/g, '$1');
}

function transformZ(token) {
    return token.replace(/z/, 's');
}

function dropVowels(token) {
    return token.charAt(0) + token.substr(1, token.length).replace(/[aeiou]/g, '');
}

var Metaphone = new Phonetic();
module.exports = Metaphone;

Metaphone.process = function(token, maxLength) {
    maxLength == maxLength || 32;
    token = token.toLowerCase();
    token = dedup(token);
    token = dropInitialLetters(token);
    token = dropBafterMAtEnd(token);
    token = transformCK(token);
    token = cTransform(token);
    token = dTransform(token);
    token = dropG(token);
    token = transformG(token);
    token = dropH(token);
    token = transformPH(token);
    token = transformQ(token);
    token = transformS(token);
    token = transformX(token);    
    token = transformT(token);
    token = dropT(token);
    token = transformV(token);
    token = transformWH(token);
    token = dropW(token);
    token = dropY(token);
    token = transformZ(token);
    token = dropVowels(token);
    
    token.toUpperCase();
    if(token.length >= maxLength)
        token = token.substring(0, maxLength);        

    return token.toUpperCase();
};

// expose functions for testing    
Metaphone.dedup = dedup;
Metaphone.dropInitialLetters = dropInitialLetters;
Metaphone.dropBafterMAtEnd = dropBafterMAtEnd;
Metaphone.cTransform = cTransform;
Metaphone.dTransform = dTransform;
Metaphone.dropG = dropG;
Metaphone.transformG = transformG;
Metaphone.dropH = dropH;
Metaphone.transformCK = transformCK;
Metaphone.transformPH = transformPH;
Metaphone.transformQ = transformQ;
Metaphone.transformS = transformS;
Metaphone.transformT = transformT;
Metaphone.dropT = dropT;
Metaphone.transformV = transformV;
Metaphone.transformWH = transformWH;
Metaphone.dropW = dropW;
Metaphone.transformX = transformX;
Metaphone.dropY = dropY;
Metaphone.transformZ = transformZ;
Metaphone.dropVowels = dropVowels;

},{"./phonetic":77}],77:[function(require,module,exports){
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

var stopwords = require('../util/stopwords');
var Tokenizer = require('../tokenizers/aggressive_tokenizer'),
    tokenizer = new Tokenizer();

module.exports = function() {
    this.compare = function(stringA, stringB) {
        return this.process(stringA) == this.process(stringB);
    };

    this.attach = function() {
	var phonetic = this;

        String.prototype.soundsLike = function(compareTo) {
            return phonetic.compare(this, compareTo);
        }
        
        String.prototype.phonetics = function() {
            return phonetic.process(this);
        }
	
        String.prototype.tokenizeAndPhoneticize = function(keepStops) {
            var phoneticizedTokens = [];
            
            tokenizer.tokenize(this).forEach(function(token) {
                if(keepStops || stopwords.words.indexOf(token) < 0)
                    phoneticizedTokens.push(token.phonetics());
            });
            
            return phoneticizedTokens;
        }
    };
};

},{"../tokenizers/aggressive_tokenizer":98,"../util/stopwords":118}],78:[function(require,module,exports){
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

var Phonetic = require('./phonetic');

function transformLipps(token) {
    return token.replace(/[bfpv]/g, '1');
}

function transformThroats(token) {
    return token.replace(/[cgjkqsxz]/g, '2');
}

function transformToungue(token) {
    return token.replace(/[dt]/g, '3');
}

function transformL(token) {
    return token.replace(/l/g, '4');
}

function transformHum(token) {
    return token.replace(/[mn]/g, '5');
}

function transformR(token) {
    return token.replace(/r/g, '6');
}

function condense(token) {
    return token.replace(/(\d)?\1+/g, '$1');
}

function padRight0(token) {
    if(token.length < 4)
        return token + Array(4 - token.length).join('0');
    else
        return token;
}

function transform(token) {
    return transformLipps(transformThroats(
        transformToungue(transformL(transformHum(transformR(token))))));
}

var SoundEx = new Phonetic();
module.exports = SoundEx;

SoundEx.process = function(token, maxLength) {
    token = token.toLowerCase();    
    var transformed = condense(transform(token.substr(1, token.length - 1))); // anything that isn't a digit goes
    // deal with duplicate INITIAL consonant SOUNDS
    transformed = transformed.replace(new RegExp("^" + transform(token.charAt(0))), '');
    return token.charAt(0).toUpperCase() + padRight0(transformed.replace(/\D/g, '')).substr(0, (maxLength && maxLength - 1) || 3);
};

// export for tests;
SoundEx.transformLipps = transformLipps;
SoundEx.transformThroats = transformThroats;
SoundEx.transformToungue = transformToungue;
SoundEx.transformL = transformL;
SoundEx.transformHum = transformHum;
SoundEx.transformR = transformR;
SoundEx.condense = condense;
SoundEx.padRight0 = padRight0;

},{"./phonetic":77}],79:[function(require,module,exports){
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

exports.rules = {
    "a": [
        {
            "continuation": false, 
            "intact": true, 
            "pattern": "ia", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": true, 
            "pattern": "a", 
            "size": "1"
        }
    ], 
    "b": [
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "bb", 
            "size": "1"
        }
    ], 
    "c": [
        {
            "appendage": "s", 
            "continuation": false, 
            "intact": false, 
            "pattern": "ytic", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ic", 
            "size": "2"
       }, 
        {
            "appendage": "t", 
            "continuation": true, 
            "intact": false, 
            "pattern": "nc", 
            "size": "1"
        }
    ], 
    "d": [
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "dd", 
            "size": "1"
        }, 
        {
            "appendage": "y", 
            "continuation": true, 
            "intact": false, 
            "pattern": "ied", 
            "size": "3"
        }, 
        {
            "appendage": "ss", 
            "continuation": false, 
            "intact": false, 
            "pattern": "ceed", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "eed", 
            "size": "1"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ed", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "hood", 
            "size": "4"
        }
    ], 
    "e": [
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "e", 
            "size": "1"
        }
    ], 
    "f": [
        {
            "appendage": "v", 
            "continuation": false, 
            "intact": false, 
            "pattern": "lief", 
            "size": "1"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "if", 
            "size": "2"
        }
    ], 
    "g": [
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ing", 
            "size": "3"
        }, 
        {
            "appendage": "y", 
            "continuation": false, 
            "intact": false, 
            "pattern": "iag", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ag", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "gg", 
            "size": "1"
        }
    ], 
    "h": [
        {
            "continuation": false, 
            "intact": true, 
            "pattern": "th", 
            "size": "2"
        }, 
        {
            "appendage": "ct", 
            "continuation": false, 
            "intact": false, 
            "pattern": "guish", 
            "size": "5"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ish", 
            "size": "3"
        }
    ], 
    "i": [
        {
            "continuation": false, 
            "intact": true, 
            "pattern": "i", 
            "size": "1"
        }, 
        {
            "appendage": "y", 
            "continuation": true, 
            "intact": false, 
            "pattern": "i", 
            "size": "1"
        }
    ], 
    "j": [
        {
            "appendage": "d", 
            "continuation": false, 
            "intact": false, 
            "pattern": "ij", 
            "size": "1"
        }, 
        {
            "appendage": "s", 
            "continuation": false, 
            "intact": false, 
            "pattern": "fuj", 
            "size": "1"
        }, 
        {
            "appendage": "d", 
            "continuation": false, 
            "intact": false, 
            "pattern": "uj", 
            "size": "1"
        }, 
        {
            "appendage": "d", 
            "continuation": false, 
            "intact": false, 
            "pattern": "oj", 
            "size": "1"
        }, 
        {
            "appendage": "r", 
            "continuation": false, 
            "intact": false, 
            "pattern": "hej", 
            "size": "1"
        }, 
        {
            "appendage": "t", 
            "continuation": false, 
            "intact": false, 
            "pattern": "verj", 
            "size": "1"
        }, 
        {
            "appendage": "t", 
            "continuation": false, 
            "intact": false, 
            "pattern": "misj", 
            "size": "2"
        }, 
        {
            "appendage": "d", 
            "continuation": false, 
            "intact": false, 
            "pattern": "nj", 
            "size": "1"
        }, 
        {
            "appendage": "s", 
            "continuation": false, 
            "intact": false, 
            "pattern": "j", 
            "size": "1"
        }
    ], 
    "l": [
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ifiabl", 
            "size": "6"
        }, 
        {
            "appendage": "y", 
            "continuation": false, 
            "intact": false, 
            "pattern": "iabl", 
            "size": "4"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "abl", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ibl", 
            "size": "3"
        }, 
        {
            "appendage": "l", 
            "continuation": true, 
            "intact": false, 
            "pattern": "bil", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "cl", 
            "size": "1"
        }, 
        {
            "appendage": "y", 
            "continuation": false, 
            "intact": false, 
            "pattern": "iful", 
            "size": "4"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ful", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ul", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ial", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ual", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "al", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ll", 
            "size": "1"
        }
    ], 
    "m": [
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ium", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": true, 
            "pattern": "um", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ism", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "mm", 
            "size": "1"
        }
    ], 
    "n": [
        {
            "appendage": "j", 
            "continuation": true, 
            "intact": false, 
            "pattern": "sion", 
            "size": "4"
        }, 
        {
            "appendage": "ct", 
            "continuation": false, 
            "intact": false, 
            "pattern": "xion", 
            "size": "4"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ion", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ian", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "an", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "een", 
            "size": "0"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "en", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "nn", 
            "size": "1"
        }
    ], 
    "p": [
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ship", 
            "size": "4"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "pp", 
            "size": "1"
        }
    ], 
    "r": [
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "er", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ear", 
            "size": "0"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ar", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "or", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ur", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "rr", 
            "size": "1"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "tr", 
            "size": "1"
        }, 
        {
            "appendage": "y", 
            "continuation": true, 
            "intact": false, 
            "pattern": "ier", 
            "size": "3"
        }
    ], 
    "s": [
        {
            "appendage": "y", 
            "continuation": true, 
            "intact": false, 
            "pattern": "ies", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "sis", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "is", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ness", 
            "size": "4"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ss", 
            "size": "0"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ous", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": true, 
            "pattern": "us", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": true, 
            "pattern": "s", 
            "size": "1"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "s", 
            "size": "0"
        }
    ], 
    "t": [
        {
            "appendage": "y", 
            "continuation": false, 
            "intact": false, 
            "pattern": "plicat", 
            "size": "4"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "at", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ment", 
            "size": "4"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ent", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ant", 
            "size": "3"
        }, 
        {
            "appendage": "b", 
            "continuation": false, 
            "intact": false, 
            "pattern": "ript", 
            "size": "2"
        }, 
        {
            "appendage": "b", 
            "continuation": false, 
            "intact": false, 
            "pattern": "orpt", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "duct", 
            "size": "1"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "sumpt", 
            "size": "2"
        }, 
        {
            "appendage": "iv", 
            "continuation": false, 
            "intact": false, 
            "pattern": "cept", 
            "size": "2"
        }, 
        {
            "appendage": "v", 
            "continuation": false, 
            "intact": false, 
            "pattern": "olut", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "sist", 
            "size": "0"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ist", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "tt", 
            "size": "1"
        }
    ], 
    "u": [
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "iqu", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ogu", 
            "size": "1"
        }
    ], 
    "v": [
        {
            "appendage": "j", 
            "continuation": true, 
            "intact": false, 
            "pattern": "siv", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "eiv", 
            "size": "0"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "iv", 
            "size": "2"
        }
    ], 
    "y": [
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "bly", 
            "size": "1"
        }, 
        {
            "appendage": "y", 
            "continuation": true, 
            "intact": false, 
            "pattern": "ily", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ply", 
            "size": "0"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ly", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ogy", 
            "size": "1"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "phy", 
            "size": "1"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "omy", 
            "size": "1"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "opy", 
            "size": "1"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ity", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ety", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "lty", 
            "size": "2"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "istry", 
            "size": "5"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ary", 
            "size": "3"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "ory", 
            "size": "3"
        }, 
        {
            "continuation": false, 
            "intact": false, 
            "pattern": "ify", 
            "size": "3"
        }, 
        {
            "appendage": "t", 
            "continuation": true, 
            "intact": false, 
            "pattern": "ncy", 
            "size": "2"
        }, 
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "acy", 
            "size": "3"
        }
    ], 
    "z": [
        {
            "continuation": true, 
            "intact": false, 
            "pattern": "iz", 
            "size": "2"
        }, 
        {
            "appendage": "s", 
            "continuation": false, 
            "intact": false, 
            "pattern": "yz", 
            "size": "1"
        }
    ]
};


},{}],80:[function(require,module,exports){
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

var Stemmer = require('./stemmer');
var ruleTable = require('./lancaster_rules').rules;

function acceptable(candidate) {
    if (candidate.match(/^[aeiou]/))
        return (candidate.length > 1);
    else
        return (candidate.length > 2 && candidate.match(/[aeiouy]/));
}

// take a token, look up the applicatble rule section and attempt some stemming!
function applyRuleSection(token, intact) {
    var section = token.substr( - 1);
    var rules = ruleTable[section];

    if (rules) {
        for (var i = 0; i < rules.length; i++) {
            if ((intact || !rules[i].intact)
            // only apply intact rules to intact tokens
            && token.substr(0 - rules[i].pattern.length) == rules[i].pattern) {
                // hack off only as much as the rule indicates
                var result = token.substr(0, token.length - rules[i].size);

                // if the rules wants us to apply an appendage do so
                if (rules[i].appendage)
                    result += rules[i].appendage;

                if (acceptable(result)) {
                    token = result;

                    // see what the rules wants to do next
                    if (rules[i].continuation) {
                        // this rule thinks there still might be stem left. keep at it.
                        // since we've applied a change we'll pass false in for intact
                        return applyRuleSection(result, false);
                    } else {
                        // the rule thinks we're done stemming. drop out.
                        return result;
                    }
                }
            }
        }
    }

    return token;
}

var LancasterStemmer = new Stemmer();
module.exports = LancasterStemmer;

LancasterStemmer.stem = function(token) {
    return applyRuleSection(token.toLowerCase(), true);
}
},{"./lancaster_rules":79,"./stemmer":88}],81:[function(require,module,exports){
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

var Stemmer = require('./stemmer');

// denote groups of consecutive consonants with a C and consecutive vowels
// with a V.
function categorizeGroups(token) {
    return token.replace(/[^aeiouy]+y/g, 'CV').replace(/[aeiou]+/g, 'V').replace(/[^V]+/g, 'C');
}

// denote single consonants with a C and single vowels with a V
function categorizeChars(token) {
    return token.replace(/[^aeiouy]y/g, 'CV').replace(/[aeiou]/g, 'V').replace(/[^V]/g, 'C');
}

// calculate the "measure" M of a word. M is the count of VC sequences dropping
// an initial C if it exists and a trailing V if it exists.
function measure(token) {
    if(!token)
    	return -1;

    return categorizeGroups(token).replace(/^C/, '').replace(/V$/, '').length / 2;
}

// determine if a token end with a double consonant i.e. happ
function endsWithDoublCons(token) {
    return token.match(/([^aeiou])\1$/);
}

// replace a pattern in a word. if a replacement occurs an optional callback
// can be called to post-process the result. if no match is made NULL is
// returned.
function attemptReplace(token, pattern, replacement, callback) {
    var result = null;
    
    if((typeof pattern == 'string') && token.substr(0 - pattern.length) == pattern)
        result = token.replace(new RegExp(pattern + '$'), replacement);
    else if((pattern instanceof RegExp) && token.match(pattern))
        result = token.replace(pattern, replacement);
        
    if(result && callback)
        return callback(result);
    else
        return result;
}

// attempt to replace a list of patterns/replacements on a token for a minimum
// measure M.
function attemptReplacePatterns(token, replacements, measureThreshold) {
    var replacement = token;

    for(var i = 0; i < replacements.length; i++) {   
    	if(measureThreshold == null || measure(attemptReplace(token, replacements[i][0], replacements[i][1])) > measureThreshold) {
    	    replacement = attemptReplace(replacement, replacements[i][0], replacements[i][2]) || replacement;
        }
    }
    
    return replacement;
}

// replace a list of patterns/replacements on a word. if no match is made return
// the original token.
function replacePatterns(token, replacements, measureThreshold) {
    return attemptReplacePatterns(token, replacements, measureThreshold) || token;
}

// TODO: this should replace all of the messy replacement stuff above
function replaceRegex(token, regex, includeParts, minimumMeasure) {
    var parts;
    var result = '';

    if(regex.test(token)) {
        parts = regex.exec(token);

        includeParts.forEach(function(i) {
            result += parts[i];
        });
    }

    if(measure(result) > minimumMeasure) {
        return result;
    }

    return null;
}

// step 1a as defined for the porter stemmer algorithm. 
function step1a(token) {    
    if(token.match(/(ss|i)es$/)) {
        return token.replace(/(ss|i)es$/, '$1');
    }

    if(token.substr(-1) == 's' && token.substr(-2, 1) != 's' && token.length > 2) {
        return token.replace(/s?$/, '');
    }

    return token;
}

// step 1b as defined for the porter stemmer algorithm. 
function step1b(token) {   
    if(token.substr(-3) == 'eed') {
        if(measure(token.substr(0, token.length - 3)) > 0)
            return token.replace(/eed$/, 'ee');
    } else {
        var result = attemptReplace(token, /(ed|ing)$/, '', function(token) {
            if(categorizeGroups(token).indexOf('V') >= 0) {
                result = attemptReplacePatterns(token, [['at', '', 'ate'],  ['bl', '', 'ble'], ['iz', '', 'ize']]);

                if(result != token) {
        		    return result;
        		} else {
        		  if(endsWithDoublCons(token) && token.match(/[^lsz]$/)) {
        			 return token.replace(/([^aeiou])\1$/, '$1');
                    }

        		  if(measure(token) == 1 && categorizeChars(token).substr(-3) == 'CVC' && token.match(/[^wxy]$/)) {
        			 return token + 'e';
                    }
        		}                

        		return token;
    	    }
    	    
    	    return null;
    	});
    	
    	if(result) {
    	    return result;
        }
    }

    return token;   
}

// step 1c as defined for the porter stemmer algorithm. 
function step1c(token) {
    var categorizedGroups = categorizeGroups(token);

    if(token.substr(-1) == 'y' && categorizedGroups.substr(0, categorizedGroups.length - 1).indexOf('V') > -1) {
        return token.replace(/y$/, 'i');
    }

    return token;
}

// step 2 as defined for the porter stemmer algorithm. 
function step2(token) {
    token = replacePatterns(token, [['ational', '', 'ate'], ['tional', '', 'tion'], ['enci', '', 'ence'], ['anci', '', 'ance'],
        ['izer', '', 'ize'], ['abli', '', 'able'], ['bli', '', 'ble'], ['alli', '', 'al'], ['entli', '', 'ent'], ['eli', '', 'e'],
        ['ousli', '', 'ous'], ['ization', '', 'ize'], ['ation', '', 'ate'], ['ator', '', 'ate'],['alism', '', 'al'],
        ['iveness', '', 'ive'], ['fulness', '', 'ful'], ['ousness', '', 'ous'], ['aliti', '', 'al'],
        ['iviti', '', 'ive'], ['biliti', '', 'ble'], ['logi', '', 'log']], 0);

    return token;
}

// step 3 as defined for the porter stemmer algorithm. 
function step3(token) {
    return replacePatterns(token, [['icate', '', 'ic'], ['ative', '', ''], ['alize', '', 'al'],
				   ['iciti', '', 'ic'], ['ical', '', 'ic'], ['ful', '', ''], ['ness', '', '']], 0);
}

// step 4 as defined for the porter stemmer algorithm. 
function step4(token) {
    return replaceRegex(token, /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/, [1], 1) || 
        replaceRegex(token, /^(.+?)(s|t)(ion)$/, [1, 2], 1) ||
        token; 
}

// step 5a as defined for the porter stemmer algorithm. 
function step5a(token) {
    var m = measure(token.replace(/e$/, ''));



    if(m > 1 || (m == 1 && !(categorizeChars(token).substr(-4, 3) == 'CVC' && token.match(/[^wxy].$/)))) {
        token = token.replace(/e$/, '');
    }

    return token;
}

// step 5b as defined for the porter stemmer algorithm. 
function step5b(token) {
    if(measure(token) > 1) {
       return token.replace(/ll$/, 'l'); 
    }
    
    return token;
}

var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;


// perform full stemming algorithm on a single word
PorterStemmer.stem = function(token) {
    if(token.length < 3) return token;
    return step5b(step5a(step4(step3(step2(step1c(step1b(step1a(token.toLowerCase())))))))).toString();
};

//exports for tests
PorterStemmer.categorizeGroups = categorizeGroups;
PorterStemmer.measure = measure;
PorterStemmer.step1a = step1a;
PorterStemmer.step1b = step1b;
PorterStemmer.step1c = step1c;
PorterStemmer.step2 = step2;
PorterStemmer.step3 = step3;
PorterStemmer.step4 = step4;
PorterStemmer.step5a = step5a;
PorterStemmer.step5b = step5b;

},{"./stemmer":88}],82:[function(require,module,exports){
/*
Copyright (c) 2012, David Przybilla, Chris Umbel

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

var Stemmer = require('./stemmer_es');

var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;


function isVowel(letter){
	return (letter == 'a' || letter == 'e' || letter == 'i' || letter == 'o' || letter == 'u' || letter == 'á' || letter == 'é' ||
			letter == 'í' || letter == 'ó' || letter == 'ú');
};

function getNextVowelPos(token,start){
	length=token.length
			for (var i = start; i < length; i++)
				if (isVowel(token[i])) return i;
			return length;
};

function getNextConsonantPos(token,start){
	length=token.length
			for (var i = start; i < length; i++)
				if (!isVowel(token[i])) return i;
			return length;
};


function endsin(token, suffix) {
	if (token.length < suffix.length) return false;
	return (token.slice(-suffix.length) == suffix);
};

function endsinArr(token, suffixes) {
	for(var i=0;i<suffixes.length;i++){
		if (endsin(token, suffixes[i])) return suffixes[i];
	}
	return '';
};

function removeAccent(token) {
	var str=token.replace(/á/gi,'a');
	str=str.replace(/é/gi,'e');
	str=str.replace(/í/gi,'i');
	str=str.replace(/ó/gi,'o');
	str=str.replace(/ú/gi,'u');
	return str;
};

// perform full stemming algorithm on a single word
PorterStemmer.stem = function(token) {
	token = token.toLowerCase();

	if (token.length<3){
		return token;
	}

	var r1,r2,rv,len= token.length;
	//looking for regions after vowels

	for(var i=0; i< token.length-1 && r1==len;i++){
 		if(isVowel(token[i]) && !isVowel(token[i+1]) ){
 			r1=i+2;
 		}

	}

	for(var i=r1; i< token.length-1 && r2==len;i++){
		if(isVowel(token[i]) && !isVowel(token[i+1])){
			r2=i+2;
		}
	}

	if (len > 3) {
			if(isVowel(token[1])) {
				// If the second letter is a consonant, RV is the region after the next following vowel
				rv = getNextVowelPos(token, 2) +1;
			} else if (isVowel(token[0]) && isVowel(token[1])) {
				// or if the first two letters are vowels, RV is the region after the next consonant
				rv = getNextConsonantPos(token, 2) + 1;
			} else {
				//otherwise (consonant-vowel case) RV is the region after the third letter. But RV is the end of the word if these positions cannot be found.
				rv = 3;
			}
		}

	var r1_txt = token.substring(r1-1);
	var r2_txt = token.substring(r2-1);
	var rv_txt = token.substring(rv-1);


	var token_orig = token;

	// Step 0: Attached pronoun
	var pronoun_suf = new Array('me', 'se', 'sela', 'selo', 'selas', 'selos', 'la', 'le', 'lo', 'las', 'les', 'los', 'nos');
	var pronoun_suf_pre1 = new Array('éndo', 'ándo', 'ár', 'ér', 'ír');
	var pronoun_suf_pre2 = new Array('ando', 'iendo', 'ar', 'er', 'ir');
	var suf = endsinArr(token, pronoun_suf);


	if (suf!='') {

		var pre_suff = endsinArr(rv_txt.slice(0,-suf.length),pronoun_suf_pre1);

		if (pre_suff != '') {

				token = removeAccent(token.slice(0,-suf.length));
		} else {
			var pre_suff = endsinArr(rv_txt.slice(0,-suf.length),pronoun_suf_pre2);

			if (pre_suff != '' ||
				(endsin(token, 'yendo' ) &&
				(token.slice(-suf.length-6,1) == 'u'))) {
				token = token.slice(0,-suf.length);
			}
		}
	}

		if (token != token_orig) {
			r1_txt = token.substring(r1-1);
			r2_txt = token.substring(r2-1);
			rv_txt = token.substring(rv-1);
		}
		var token_after0 = token;

		if ((suf = endsinArr(r2_txt, new Array('anza', 'anzas', 'ico', 'ica', 'icos', 'icas', 'ismo', 'ismos', 'able', 'ables', 'ible', 'ibles', 'ista', 'istas', 'oso', 'osa', 'osos', 'osas', 'amiento', 'amientos', 'imiento', 'imientos'))) != '') {
			token = token.slice(0, -suf.length);
		} else if ((suf = endsinArr(r2_txt, new  Array('icadora', 'icador', 'icación', 'icadoras', 'icadores', 'icaciones', 'icante', 'icantes', 'icancia', 'icancias', 'adora', 'ador', 'ación', 'adoras', 'adores', 'aciones', 'ante', 'antes', 'ancia', 'ancias'))) != '') {
			token = token.slice(0,  -suf.length);
		} else if ((suf = endsinArr(r2_txt, new  Array('logía', 'logías'))) != '') {
			token = token.slice(0,  -suf.length)+ 'log';
		} else if ((suf =endsinArr(r2_txt, new  Array('ución', 'uciones'))) != '') {
			token = token.slice(0,  -suf.length) + 'u';
		} else if ((suf = endsinArr(r2_txt, new  Array('encia', 'encias'))) != '') {
			token = token.slice(0,  -suf.length)+ 'ente';
		} else if ((suf = endsinArr(r2_txt, new  Array('ativamente', 'ivamente', 'osamente', 'icamente', 'adamente'))) != '') {
			token = token.slice(0,  -suf.length);
		} else if ((suf = endsinArr(r1_txt, new  Array('amente'))) != '') {
			token = token.slice(0,  -suf.length);
		} else if ((suf = endsinArr(r2_txt, new  Array('antemente', 'ablemente', 'iblemente', 'mente'))) != '') {
			token = token.slice(0,  -suf.length);
		} else if ((suf = endsinArr(r2_txt, new  Array('abilidad', 'abilidades', 'icidad', 'icidades', 'ividad', 'ividades', 'idad', 'idades'))) != '') {
			token = token.slice(0,  -suf.length);
		} else if ((suf = endsinArr(r2_txt, new  Array('ativa', 'ativo', 'ativas', 'ativos', 'iva', 'ivo', 'ivas', 'ivos'))) != '') {
			token = token.slice(0,  -suf.length);
		}

		if (token != token_after0) {
			r1_txt = token.substring(r1-1);
			r2_txt = token.substring(r2-1);
			rv_txt = token.substring(rv-1);
		}
		var token_after1 = token;

		if (token_after0 == token_after1) {
			// Do step 2a if no ending was removed by step 1.
			if ((suf = endsinArr(rv_txt, new Array('ya', 'ye', 'yan', 'yen', 'yeron', 'yendo', 'yo', 'yó', 'yas', 'yes', 'yais', 'yamos'))) != '' && (token.substring(suf.length-1,1) == 'u')) {
				token = token.slice(0, -suf.length);
			}

			if (token != token_after1) {
				r1_txt = token.substring(r1-1);
				r2_txt = token.substring(r2-1);
				rv_txt = token.substring(rv-1);
			}
			var token_after2a = token;

			// Do Step 2b if step 2a was done, but failed to remove a suffix.
			if (token_after2a == token_after1) {

				if ((suf = endsinArr(rv_txt,new Array('en', 'es', 'éis', 'emos'))) != '') {
					token = token.slice(0,-suf.length);
					if (endsin(token, 'gu')) {
						token = token.slice(0,-1);
					}
				} else if ((suf = endsinArr(rv_txt, new Array('arían', 'arías', 'arán', 'arás', 'aríais', 'aría', 'aréis', 'aríamos', 'aremos', 'ará', 'aré', 'erían', 'erías', 'erán', 'erás', 'eríais', 'ería', 'eréis', 'eríamos', 'eremos', 'erá', 'eré', 'irían', 'irías', 'irán', 'irás', 'iríais', 'iría', 'iréis', 'iríamos', 'iremos', 'irá', 'iré', 'aba', 'ada', 'ida', 'ía', 'ara', 'iera', 'ad', 'ed', 'id', 'ase', 'iese', 'aste', 'iste', 'an', 'aban', 'ían', 'aran', 'ieran', 'asen', 'iesen', 'aron', 'ieron', 'ado', 'ido', 'ando', 'iendo', 'ió', 'ar', 'er', 'ir', 'as', 'abas', 'adas', 'idas', 'ías', 'aras', 'ieras', 'ases', 'ieses', 'ís', 'áis', 'abais', 'íais', 'arais', 'ierais', '  aseis', 'ieseis', 'asteis', 'isteis', 'ados', 'idos', 'amos', 'ábamos', 'íamos', 'imos', 'áramos', 'iéramos', 'iésemos', 'ásemos'))) != '') {

					token = token.slice(0, -suf.length);

				}
			}
		}

		// Always do step 3.
		r1_txt = token.substring(r1-1);
		r2_txt = token.substring(r2-1);
		rv_txt = token.substring(rv-1);

		if ((suf = endsinArr(rv_txt, new Array('os', 'a', 'o', 'á', 'í', 'ó'))) != '') {
			token = token.slice(0, -suf.length);
		} else if ((suf = endsinArr(rv_txt ,new Array('e','é'))) != '') {
			token = token.slice(0,-1);
			rv_txt = token.substring(rv-1);
			if (endsin(rv_txt,'u') && endsin(token,'gu')) {
				token = token.slice(0,-1);
			}
		}

		return removeAccent(token);

};

},{"./stemmer_es":89}],83:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel
Farsi Porter Stemmer by Fardin Koochaki <me@fardinak.com>

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

var Stemmer = require('./stemmer_fa');

var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;

// disabled stemming for Farsi
// Farsi stemming will be supported soon
PorterStemmer.stem = function(token) {
    return token;
};
},{"./stemmer_fa":90}],84:[function(require,module,exports){
'use strict';

/*
Copyright (c) 2014, Ismaël Héry

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

/*
 * Spec for the French Porter Stemmer can be found at:
 * http://snowball.tartarus.org/algorithms/french/stemmer.html
 */

var Stemmer = require('./stemmer_fr');

var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;

// Export
PorterStemmer.stem = stem;

// Exports for test purpose
PorterStemmer.prelude = prelude;
PorterStemmer.regions = regions;
PorterStemmer.endsinArr = endsinArr;

/**
 * Stem a word thanks to Porter Stemmer rules
 * @param  {String} token Word to be stemmed
 * @return {String}       Stemmed word
 */
function stem(token) {
  token = prelude(token.toLowerCase());

  if (token.length == 1)
    return token;

  var regs = regions(token);

  var r1_txt, r2_txt, rv_txt;
  r1_txt = token.substring(regs.r1);
  r2_txt = token.substring(regs.r2);
  rv_txt = token.substring(regs.rv);

  // Step 1
  var beforeStep1 = token;
  var suf, pref2, pref3, letterBefore, letter2Before, i;
  var doStep2a = false;

  if ((suf = endsinArr(r2_txt, ['ance', 'iqUe', 'isme', 'able', 'iste', 'eux', 'ances', 'iqUes', 'ismes', 'ables', 'istes'])) != '') {
    token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(token, ['icatrice', 'icateur', 'ication', 'icatrices', 'icateurs', 'ications'])) != '') {
    if (endsinArr(r2_txt, ['icatrice', 'icateur', 'ication', 'icatrices', 'icateurs', 'ications']) != '') {
      token = token.slice(0, -suf.length); // delete
    } else {
      token = token.slice(0, -suf.length) + 'iqU'; // replace by iqU
    }
  } else if ((suf = endsinArr(r2_txt, ['atrice', 'ateur', 'ation', 'atrices', 'ateurs', 'ations'])) != '') {
    token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(r2_txt, ['logie', 'logies'])) != '') {
    token = token.slice(0, -suf.length) + 'log'; // replace with log
  } else if ((suf = endsinArr(r2_txt, ['usion', 'ution', 'usions', 'utions'])) != '') {
    token = token.slice(0, -suf.length) + 'u'; // replace with u
  } else if ((suf = endsinArr(r2_txt, ['ence', 'ences'])) != '') {
    token = token.slice(0, -suf.length) + 'ent'; // replace with ent
  }
  // ement(s)
  else if ((suf = endsinArr(r1_txt, ['issement', 'issements'])) != '') {
    if (!isVowel(token[token.length - suf.length - 1])) {
      token = token.slice(0, -suf.length); // delete
      r1_txt = token.substring(regs.r1);
      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    }
  } else if ((suf = endsinArr(r2_txt, ['ativement', 'ativements'])) != '') {
    token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(r2_txt, ['ivement', 'ivements'])) != '') {
    token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(token, ['eusement', 'eusements'])) != '') {
    if ((suf = endsinArr(r2_txt, ['eusement', 'eusements'])) != '')
      token = token.slice(0, -suf.length); // delete
    else if ((suf = endsinArr(r1_txt, ['eusement', 'eusements'])) != '')
      token = token.slice(0, -suf.length) + 'eux'; // replace by eux
    else if ((suf = endsinArr(rv_txt, ['ement', 'ements'])) != '')
      token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(r2_txt, ['ablement', 'ablements', 'iqUement', 'iqUements'])) != '') {
    token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(rv_txt, ['ièrement', 'ièrements', 'Ièrement', 'Ièrements'])) != '') {
    token = token.slice(0, -suf.length) + 'i'; // replace by i
  } else if ((suf = endsinArr(rv_txt, ['ement', 'ements'])) != '') {
    token = token.slice(0, -suf.length); // delete
  }
  // ité(s)
  else if ((suf = endsinArr(token, ['icité', 'icités'])) != '') {
    if (endsinArr(r2_txt, ['icité', 'icités']) != '')
      token = token.slice(0, -suf.length); // delete
    else
      token = token.slice(0, -suf.length) + 'iqU'; // replace by iqU
  } else if ((suf = endsinArr(token, ['abilité', 'abilités'])) != '') {
    if (endsinArr(r2_txt, ['abilité', 'abilités']) != '')
      token = token.slice(0, -suf.length); // delete
    else
      token = token.slice(0, -suf.length) + 'abl'; // replace by abl
  } else if ((suf = endsinArr(r2_txt, ['ité', 'ités'])) != '') {
    token = token.slice(0, -suf.length); // delete if in R2
  } else if ((suf = endsinArr(token, ['icatif', 'icative', 'icatifs', 'icatives'])) != '') {
    if ((suf = endsinArr(r2_txt, ['icatif', 'icative', 'icatifs', 'icatives'])) != '') {
      token = token.slice(0, -suf.length); // delete
      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    }
    if ((suf = endsinArr(r2_txt, ['atif', 'ative', 'atifs', 'atives'])) != '') {
      token = token.slice(0, -suf.length - 2) + 'iqU'; // replace with iqU
      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    }
  } else if ((suf = endsinArr(r2_txt, ['atif', 'ative', 'atifs', 'atives'])) != '') {
    token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(r2_txt, ['if', 'ive', 'ifs', 'ives'])) != '') {
    token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(token, ['eaux'])) != '') {
    token = token.slice(0, -suf.length) + 'eau'; // replace by eau
  } else if ((suf = endsinArr(r1_txt, ['aux'])) != '') {
    token = token.slice(0, -suf.length) + 'al'; // replace by al
  } else if ((suf = endsinArr(r2_txt, ['euse', 'euses'])) != '') {
    token = token.slice(0, -suf.length); // delete
  } else if ((suf = endsinArr(r1_txt, ['euse', 'euses'])) != '') {
    token = token.slice(0, -suf.length) + 'eux'; // replace by eux
  } else if ((suf = endsinArr(rv_txt, ['amment'])) != '') {
    token = token.slice(0, -suf.length) + 'ant'; // replace by ant
    doStep2a = true;
  } else if ((suf = endsinArr(rv_txt, ['emment'])) != '') {
    token = token.slice(0, -suf.length) + 'ent'; // replace by ent
    doStep2a = true;
  } else if ((suf = endsinArr(rv_txt, ['ment', 'ments'])) != '') {
    // letter before must be a vowel in RV
    letterBefore = token[token.length - suf.length - 1];
    if (isVowel(letterBefore) && endsin(rv_txt, letterBefore + suf)) {
      token = token.slice(0, -suf.length); // delete
      doStep2a = true;
    }
  }

  // re compute regions
  r1_txt = token.substring(regs.r1);
  r2_txt = token.substring(regs.r2);
  rv_txt = token.substring(regs.rv);

  // Step 2a
  var beforeStep2a = token;
  var step2aDone = false;
  if (beforeStep1 === token || doStep2a) {
    step2aDone = true;
    if ((suf = endsinArr(rv_txt, ['îmes', 'ît', 'îtes', 'i', 'ie', 'Ie', 'ies', 'ir', 'ira', 'irai', 'iraIent', 'irais', 'irait', 'iras', 'irent', 'irez', 'iriez', 'irions', 'irons', 'iront', 'is', 'issaIent', 'issais', 'issait', 'issant', 'issante', 'issantes', 'issants', 'isse', 'issent', 'isses', 'issez', 'issiez', 'issions', 'issons', 'it'])) != '') {
      letterBefore = token[token.length - suf.length - 1];
      if (!isVowel(letterBefore) && endsin(rv_txt, letterBefore + suf))
        token = token.slice(0, -suf.length); // delete
    }
  }

  // Step 2b
  if (step2aDone && token === beforeStep2a) {
    if ((suf = endsinArr(rv_txt, ['é', 'ée', 'ées', 'és', 'èrent', 'er', 'era', 'erai', 'eraIent', 'erais', 'erait', 'eras', 'erez', 'eriez', 'erions', 'erons', 'eront', 'ez', 'iez', 'Iez'])) != '') {
      token = token.slice(0, -suf.length); // delete
      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    } else if ((suf = endsinArr(rv_txt, ['ions'])) != '' && endsinArr(r2_txt, ['ions'])) {
      token = token.slice(0, -suf.length); // delete
      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    }
    // add 'Ie' suffix to pass test for 'évanouie'
    else if ((suf = endsinArr(rv_txt, ['âmes', 'ât', 'âtes', 'a', 'ai', 'aIent', 'ais', 'ait', 'ant', 'ante', 'antes', 'ants', 'as', 'asse', 'assent', 'asses', 'assiez', 'assions'])) != '') {
      token = token.slice(0, -suf.length); // delete

      letterBefore = token[token.length - 1];
      if (letterBefore === 'e' && endsin(rv_txt, 'e' + suf))
        token = token.slice(0, -1);

      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    }
  }

  // Step 3
  if (!(token === beforeStep1)) {
    if (token[token.length - 1] === 'Y')
      token = token.slice(0, -1) + 'i';
    if (token[token.length - 1] === 'ç')
      token = token.slice(0, -1) + 'c';
  } // Step 4
  else {
    letterBefore = token[token.length - 1];
    letter2Before = token[token.length - 2];

    if (letterBefore === 's' && ['a', 'i', 'o', 'u', 'è', 's'].indexOf(letter2Before) == -1) {
      token = token.slice(0, -1);
      r1_txt = token.substring(regs.r1);
      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    }

    if ((suf = endsinArr(r2_txt, ['ion'])) != '') {
      letterBefore = token[token.length - suf.length - 1];
      if (letterBefore === 's' || letterBefore === 't') {
        token = token.slice(0, -suf.length); // delete
        r1_txt = token.substring(regs.r1);
        r2_txt = token.substring(regs.r2);
        rv_txt = token.substring(regs.rv);
      }
    }

    if ((suf = endsinArr(rv_txt, ['ier', 'ière', 'Ier', 'Ière'])) != '') {
      token = token.slice(0, -suf.length) + 'i'; // replace by i
      r1_txt = token.substring(regs.r1);
      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    }
    if ((suf = endsinArr(rv_txt, 'e')) != '') {
      token = token.slice(0, -suf.length); // delete
      r1_txt = token.substring(regs.r1);
      r2_txt = token.substring(regs.r2);
      rv_txt = token.substring(regs.rv);
    }
    if ((suf = endsinArr(rv_txt, 'ë')) != '') {
      if (token.slice(token.length - 3, -1) === 'gu')
        token = token.slice(0, -suf.length); // delete
    }
  }

  // Step 5
  if ((suf = endsinArr(token, ['enn', 'onn', 'ett', 'ell', 'eill'])) != '') {
    token = token.slice(0, -1); // delete last letter
  }

  // Step 6
  i = token.length - 1;
  while (i > 0) {
    if (!isVowel(token[i])) {
      i--;
    } else if (i !== token.length - 1 && (token[i] === 'é' || token[i] === 'è')) {
      token = token.substring(0, i) + 'e' + token.substring(i + 1, token.length);
      break;
    } else {
      break;
    }
  }

  return token.toLowerCase();

};

/**
 * Compute r1, r2, rv regions as required by french porter stemmer algorithm
 * @param  {String} token Word to compute regions on
 * @return {Object}       Regions r1, r2, rv as offsets from the begining of the word
 */
function regions(token) {
  var r1, r2, rv, len;
  var i;

  r1 = r2 = rv = len = token.length;

  // R1 is the region after the first non-vowel following a vowel,
  for (var i = 0; i < len - 1 && r1 == len; i++) {
    if (isVowel(token[i]) && !isVowel(token[i + 1])) {
      r1 = i + 2;
    }
  }
  // Or is the null region at the end of the word if there is no such non-vowel.

  // R2 is the region after the first non-vowel following a vowel in R1
  for (i = r1; i < len - 1 && r2 == len; i++) {
    if (isVowel(token[i]) && !isVowel(token[i + 1])) {
      r2 = i + 2;
    }
  }
  // Or is the null region at the end of the word if there is no such non-vowel.

  // RV region
  var three = token.slice(0, 3);
  if (isVowel(token[0]) && isVowel(token[1])) {
    rv = 3;
  }
  if (three === 'par' || three == 'col' || three === 'tap')
    rv = 3;
  // the region after the first vowel not at the beginning of the word or null
  else {
    for (i = 1; i < len - 1 && rv == len; i++) {
      if (isVowel(token[i])) {
        rv = i + 1;
      }
    }
  }

  return {
    r1: r1,
    r2: r2,
    rv: rv
  };
};

/**
 * Pre-process/prepare words as required by french porter stemmer algorithm
 * @param  {String} token Word to be prepared
 * @return {String}       Prepared word
 */
function prelude(token) {
  token = token.toLowerCase();

  var result = '';
  var i = 0;

  // special case for i = 0 to avoid '-1' index
  if (token[i] === 'y' && isVowel(token[i + 1])) {
    result += token[i].toUpperCase();
  } else {
    result += token[i];
  }

  for (i = 1; i < token.length; i++) {
    if ((token[i] === 'u' || token[i] === 'i') && isVowel(token[i - 1]) && isVowel(token[i + 1])) {
      result += token[i].toUpperCase();
    } else if (token[i] === 'y' && (isVowel(token[i - 1]) || isVowel(token[i + 1]))) {
      result += token[i].toUpperCase();
    } else if (token[i] === 'u' && token[i - 1] === 'q') {
      result += token[i].toUpperCase();
    } else {
      result += token[i];
    }
  }

  return result;
};

/**
 * Return longest matching suffixes for a token or '' if no suffix match
 * @param  {String} token    Word to find matching suffix
 * @param  {Array} suffixes  Array of suffixes to test matching
 * @return {String}          Longest found matching suffix or ''
 */
function endsinArr(token, suffixes) {
  var i, longest = '';
  for (i = 0; i < suffixes.length; i++) {
    if (endsin(token, suffixes[i]) && suffixes[i].length > longest.length)
      longest = suffixes[i];
  }

  return longest;
};


function isVowel(letter) {
  return (letter == 'a' || letter == 'e' || letter == 'i' || letter == 'o' || letter == 'u' || letter == 'y' || letter == 'â' || letter == 'à' || letter == 'ë' ||
    letter == 'é' || letter == 'ê' || letter == 'è' || letter == 'ï' || letter == 'î' || letter == 'ô' || letter == 'û' || letter == 'ù');
};

function endsin(token, suffix) {
  if (token.length < suffix.length) return false;
  return (token.slice(-suffix.length) == suffix);
};
},{"./stemmer_fr":91}],85:[function(require,module,exports){
/*
Copyright (c) 2012, Leonardo Fenu, Chris Umbel

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

var Stemmer = require('./stemmer_it');

var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;


function isVowel(letter){
	return (letter == 'a' || letter == 'e' || letter == 'i' || letter == 'o' || letter == 'u' || letter == 'à' ||
			letter == 'è' || letter == 'ì' || letter == 'ò' || letter == 'ù');
};

function getNextVowelPos(token,start){
	start = start + 1;
	var length = token.length;
	for (var i = start; i < length; i++) {
		if (isVowel(token[i])) {
			return i;
		}
	}
	return length;
};

function getNextConsonantPos(token,start){
	length=token.length
			for (var i = start; i < length; i++)
				if (!isVowel(token[i])) return i;
			return length;
};


function endsin(token, suffix) {
	if (token.length < suffix.length) return false;
	return (token.slice(-suffix.length) == suffix);
};

function endsinArr(token, suffixes) {
	for(var i=0;i<suffixes.length;i++){
		if (endsin(token, suffixes[i])) return suffixes[i];
	}
	return '';
};

function replaceAcute(token) {
	var str=token.replace(/á/gi,'à');
	str=str.replace(/é/gi,'è');
	str=str.replace(/í/gi,'ì');
	str=str.replace(/ó/gi,'ò');
	str=str.replace(/ú/gi,'ù');
	return str;
};

function vowelMarking(token) {
	function replacer(match, p1, p2, p3){
  		return p1+p2.toUpperCase()+p3;
	};	
	str=token.replace(/([aeiou])(i|u)([aeiou])/g, replacer);	
	return str;
}


// perform full stemming algorithm on a single word
PorterStemmer.stem = function(token) {
	
	token = token.toLowerCase();
	token = replaceAcute(token);
	token = token.replace(/qu/g,'qU');	
	token = vowelMarking(token);
	
	if (token.length<3){
		return token;
	}

	var r1 = r2 = rv = len = token.length;
	// R1 is the region after the first non-vowel following a vowel, 
	for(var i=0; i < token.length-1 && r1==len;i++){
 		if(isVowel(token[i]) && !isVowel(token[i+1]) ){
 			r1=i+2;
 		}
	}
	// Or is the null region at the end of the word if there is no such non-vowel.  

	// R2 is the region after the first non-vowel following a vowel in R1
	for(var i=r1; i< token.length-1 && r2==len;i++){
		if(isVowel(token[i]) && !isVowel(token[i+1])){
			r2=i+2;
		}
	}

	// Or is the null region at the end of the word if there is no such non-vowel. 

	// If the second letter is a consonant, RV is the region after the next following vowel, 
	
	// RV as follow

	if (len > 3) {
		if(!isVowel(token[1])) {
			// If the second letter is a consonant, RV is the region after the next following vowel
			rv = getNextVowelPos(token, 1) +1;
		} else if (isVowel(token[0]) && isVowel(token[1])) { 
			// or if the first two letters are vowels, RV is the region after the next consonant
			rv = getNextConsonantPos(token, 2) + 1;
		} else {
			//otherwise (consonant-vowel case) RV is the region after the third letter. But RV is the end of the word if these positions cannot be found.
			rv = 3;
		}
	}

	var r1_txt = token.substring(r1);
	var r2_txt = token.substring(r2);
	var rv_txt = token.substring(rv);

	var token_orig = token;

	// Step 0: Attached pronoun

	var pronoun_suf = new Array('glieli','glielo','gliene','gliela','gliele','sene','tene','cela','cele','celi','celo','cene','vela','vele','veli','velo','vene','mela','mele','meli','melo','mene','tela','tele','teli','telo','gli','ci', 'la','le','li','lo','mi','ne','si','ti','vi');	
	var pronoun_suf_pre1 = new Array('ando','endo');	
	var pronoun_suf_pre2 = new Array('ar', 'er', 'ir');
	var suf = endsinArr(token, pronoun_suf);

	if (suf!='') {
		var pre_suff1 = endsinArr(rv_txt.slice(0,-suf.length),pronoun_suf_pre1);
		var pre_suff2 = endsinArr(rv_txt.slice(0,-suf.length),pronoun_suf_pre2);	
		
		if (pre_suff1 != '') {
			token = token.slice(0,-suf.length);
		}
		if (pre_suff2 != '') {
			token = token.slice(0,  -suf.length)+ 'e';
		}
	}

	if (token != token_orig) {
		r1_txt = token.substring(r1);
		r2_txt = token.substring(r2);
		rv_txt = token.substring(rv);
	}

	var token_after0 = token;

	// Step 1:  Standard suffix removal
	
	if ((suf = endsinArr(r2_txt, new  Array('ativamente','abilamente','ivamente','osamente','icamente'))) != '') {
		token = token.slice(0, -suf.length);	// delete
	} else if ((suf = endsinArr(r2_txt, new  Array('icazione','icazioni','icatore','icatori','azione','azioni','atore','atori'))) != '') {
		token = token.slice(0,  -suf.length);	// delete
	} else if ((suf = endsinArr(r2_txt, new  Array('logia','logie'))) != '') {
		token = token.slice(0,  -suf.length)+ 'log'; // replace with log
	} else if ((suf =endsinArr(r2_txt, new  Array('uzione','uzioni','usione','usioni'))) != '') {
		token = token.slice(0,  -suf.length) + 'u'; // replace with u
	} else if ((suf = endsinArr(r2_txt, new  Array('enza','enze'))) != '') {
		token = token.slice(0,  -suf.length)+ 'ente'; // replace with ente
	} else if ((suf = endsinArr(rv_txt, new  Array('amento', 'amenti', 'imento', 'imenti'))) != '') {
		token = token.slice(0,  -suf.length);	// delete
	} else if ((suf = endsinArr(r1_txt, new  Array('amente'))) != '') {
		token = token.slice(0,  -suf.length); // delete
	} else if ((suf = endsinArr(r2_txt, new Array('atrice','atrici','abile','abili','ibile','ibili','mente','ante','anti','anza','anze','iche','ichi','ismo','ismi','ista','iste','isti','istà','istè','istì','ico','ici','ica','ice','oso','osi','osa','ose'))) != '') {
		token = token.slice(0,  -suf.length); // delete
	} else if ((suf = endsinArr(r2_txt, new  Array('abilità', 'icità', 'ività', 'ità'))) != '') {
		token = token.slice(0,  -suf.length); // delete
	} else if ((suf = endsinArr(r2_txt, new  Array('icativa','icativo','icativi','icative','ativa','ativo','ativi','ative','iva','ivo','ivi','ive'))) != '') {
		token = token.slice(0,  -suf.length);
	}
	
	
	if (token != token_after0) {
		r1_txt = token.substring(r1);
		r2_txt = token.substring(r2);
		rv_txt = token.substring(rv);
	}
	

	var token_after1 = token;
	
	// Step 2:  Verb suffixes

	if (token_after0 == token_after1) {
		if ((suf = endsinArr(rv_txt, new Array('erebbero','irebbero','assero','assimo','eranno','erebbe','eremmo','ereste','eresti','essero','iranno','irebbe','iremmo','ireste','iresti','iscano','iscono','issero','arono','avamo','avano','avate','eremo','erete','erono','evamo','evano','evate','iremo','irete','irono','ivamo','ivano','ivate','ammo','ando','asse','assi','emmo','enda','ende','endi','endo','erai','Yamo','iamo','immo','irai','irei','isca','isce','isci','isco','erei','uti','uto','ita','ite','iti','ito','iva','ivi','ivo','ono','uta','ute','ano','are','ata','ate','ati','ato','ava','avi','avo','erà','ere','erò','ete','eva','evi','evo','irà','ire','irò','ar','ir'))) != '') {
			token = token.slice(0, -suf.length);
		}
	}

	
	r1_txt = token.substring(r1);
	r2_txt = token.substring(r2);
	rv_txt = token.substring(rv);

	// Always do step 3. 

	if ((suf = endsinArr(rv_txt, new Array('ia', 'ie', 'ii', 'io', 'ià', 'iè','iì', 'iò','a','e','i','o','à','è','ì','ò'))) != '') {
		token = token.slice(0, -suf.length);
	} 

	r1_txt = token.substring(r1);
	r2_txt = token.substring(r2);
	rv_txt = token.substring(rv);
	
	if ((suf =endsinArr(rv_txt, new  Array('ch'))) != '') {
		token = token.slice(0,  -suf.length) + 'c'; // replace with c
	} else if ((suf =endsinArr(rv_txt, new  Array('gh'))) != '') {
		token = token.slice(0,  -suf.length) + 'g'; // replace with g
	}

	
	r1_txt = token.substring(r1);
	r2_txt = token.substring(r2);
	rv_txt = token.substring(rv);

	return token.toLowerCase();

};
},{"./stemmer_it":92}],86:[function(require,module,exports){
/*
Copyright (c) 2014, Kristoffer Brabrand

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

var Stemmer = require('./stemmer_no');

// Get the part of the token after the first non-vowel following a vowel
function getR1(token) {
    var match = token.match(/[aeiouyæåø]{1}[^aeiouyæåø]([A-Za-z0-9_æøåÆØÅäÄöÖüÜ]+)/);

    if (match) {
        var preR1Length = match.index + 2;

        if (preR1Length < 3 && preR1Length > 0) {
            return token.slice(3);
        } else if (preR1Length >= 3) {
            return match[1];
        } else {
            return token;
        }
    }

    return null;
}

function step1(token) {
    // Perform step 1a-c
    var step1aResult = step1a(token),
        step1bResult = step1b(token),
        step1cResult = step1c(token);

    // Returne the shortest result string (from 1a, 1b and 1c)
    if (step1aResult.length < step1bResult.length) {
        return (step1aResult.length < step1cResult.length) ? step1aResult : step1cResult;
    } else {
        return (step1bResult.length < step1cResult.length) ? step1bResult : step1cResult;
    }
}

// step 1a as defined for the porter stemmer algorithm.
function step1a(token) {
    var r1 = getR1(token);

    if (!r1) {
        return token;
    }

    var r1Match = r1.match(/(a|e|ede|ande|ende|ane|ene|hetene|en|heten|ar|er|heter|as|es|edes|endes|enes|hetenes|ens|hetens|ers|ets|et|het|ast)$/);

    if (r1Match) {
        return token.replace(new RegExp(r1Match[1] + '$'), '');
    }

    return token;
}

// step 1b as defined for the porter stemmer algorithm.
function step1b(token) {
    var r1 = getR1(token);

    if (!r1) {
        return token;
    }

    if (token.match(/(b|c|d|f|g|h|j|l|m|n|o|p|r|t|v|y|z)s$/)) {
        return token.slice(0, -1);
    }

    if (token.match(/([^aeiouyæåø]k)s$/)) {
        return token.slice(0, -1);
    }

    return token;
}

// step 1c as defined for the porter stemmer algorithm.
function step1c(token) {
    var r1 = getR1(token);

    if (!r1) {
        return token;
    }

    if (r1.match(/(erte|ert)$/)) {
        return token.replace(/(erte|ert)$/, 'er');
    }

    return token;
}

// step 2 as defined for the porter stemmer algorithm.
function step2(token) {
    var r1 = getR1(token);

    if (!r1) {
        return token;
    }

    if (r1.match(/(d|v)t$/)) {
        return token.slice(0, -1);
    }

    return token;
}

// step 3 as defined for the porter stemmer algorithm.
function step3(token) {
    var r1 = getR1(token);

    if (!r1)
        return token;

    var r1Match = r1.match(/(leg|eleg|ig|eig|lig|elig|els|lov|elov|slov|hetslov)$/);

    if (r1Match) {
        return token.replace(new RegExp(r1Match[1] + '$'), '');
    }

    return token;
}

var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;

// perform full stemming algorithm on a single word
PorterStemmer.stem = function(token) {
    return step3(step2(step1(token.toLowerCase()))).toString();
};

//exports for tests
PorterStemmer.getR1  = getR1;
PorterStemmer.step1  = step1;
PorterStemmer.step1a = step1a;
PorterStemmer.step1b = step1b;
PorterStemmer.step1c = step1c;
PorterStemmer.step2  = step2;
PorterStemmer.step3  = step3;
},{"./stemmer_no":94}],87:[function(require,module,exports){
/*
Copyright (c) 2012, Polyakov Vladimir, Chris Umbel

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

var Stemmer = require('./stemmer_ru');

var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;

function attemptReplacePatterns(token, patterns) {
	var replacement = null;
	var i = 0, isReplaced = false;
	while ((i < patterns.length) && !isReplaced) {
		if (patterns[i][0].test(token)) {
			replacement = token.replace(patterns[i][0], patterns[i][1]);
			isReplaced = true;
		}
		i++;
	}
	return replacement;
};

function perfectiveGerund(token) {
	var result = attemptReplacePatterns(token, [
			[/[ая]в(ши|шись)$/g, ''],
			[/(ив|ивши|ившись|ывши|ывшись|ыв)$/g, '']
		]);
	return result;
};

function adjectival(token) {
	var result = adjective(token);
	if (result != null) {
		var pariticipleResult = participle(result);
		result = pariticipleResult ? pariticipleResult : result;
	}
	return result;
};

function adjective(token) {
	var result = attemptReplacePatterns(token, [
			[/(ее|ие|ые|ое|ими|ыми|ей|ий|ый|ой|ем|им|ым|ом|его|ого|ему|ому|их|ых|ую|юю|ая|яя|ою|ею)$/g, '']
		]);
	return result;
};

function participle(token) {
	var result = attemptReplacePatterns(token, [
		[/([ая])(ем|нн|вш|ющ|щ)$/g, '$1'],
		[/(ивш|ывш|ующ)$/g, '']
	]);
	return result;
};

function reflexive(token) {
	var result = attemptReplacePatterns(token, [
		[/(ся|сь)$/g, '']
	]);
	return result;
};

function verb(token) {
	var result = attemptReplacePatterns(token, [
		[/([ая])(ла|на|ете|йте|ли|й|л|ем|н|ло|но|ет|ют|ны|ть|ешь|нно)$/g, '$1'],
		[/(ила|ыла|ена|ейте|уйте|ите|или|ыли|ей|уй|ил|ыл|им|ым|ен|ило|ыло|ено|ят|ует|ит|ыт|ены|ить|ыть|ишь|ую|ю)$/g, '']
	]);
	return result;
};

function noun(token) {
	var result = attemptReplacePatterns(token, [
		[/(а|ев|ов|ие|ье|е|иями|ями|ами|еи|ии|и|ией|ей|ой|ий|й|иям|ям|ием|ем|ам|ом|о|у|ах|иях|ях|ы|ь|ию|ью|ю|ия|ья|я)$/g, '']
	]);
	return result;
};

function superlative (token) {
	var result = attemptReplacePatterns(token, [
		[/(ейш|ейше)$/g, '']
	]);
	return result;
};

function derivational (token) {
	var result = attemptReplacePatterns(token, [
		[/(ост|ость)$/g, '']
	]);
	return result;
};

// perform full stemming algorithm on a single word
PorterStemmer.stem = function(token) {
	token = token.toLowerCase().replace(/ё/g, 'е');
	var volwesRegexp = /^(.*?[аеиоюяуыиэ])(.*)$/g;
	var RV = volwesRegexp.exec(token);
	if (!RV || RV.length < 3) {
		return token;
	}
	var head = RV[1];
	RV = RV[2];
	volwesRegexp.lastIndex = 0;
	var R2 = volwesRegexp.exec(RV);
	var result = perfectiveGerund(RV);
	if (result === null) {
		var resultReflexive = reflexive(RV) || RV;
		result = adjectival(resultReflexive);
		if (result === null) {
			result = verb(resultReflexive);
			if (result === null) {
				result = noun(resultReflexive);
				if (result === null) {
					result = resultReflexive;
				}
			}
		}
	}
	result = result.replace(/и$/g, '');
	var derivationalResult = result
	if (R2 && R2[2]) {
		derivationalResult = derivational(R2[2]);
		if (derivationalResult != null) {
			derivationalResult = derivational(result);
		} else {
			derivationalResult = result;
		}
	}

	var superlativeResult = superlative(derivationalResult) || derivationalResult;

	superlativeResult = superlativeResult.replace(/(н)н/g, '$1');
	superlativeResult = superlativeResult.replace(/ь$/g, '');
	return head + superlativeResult;
};

},{"./stemmer_ru":96}],88:[function(require,module,exports){
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

var stopwords = require('../util/stopwords');
var Tokenizer = require('../tokenizers/aggressive_tokenizer');

module.exports = function() {
    var stemmer = this;

    stemmer.stem = function(token) {
        return token;
    };

    stemmer.addStopWord = function(stopWord) {
        stopwords.words.push(stopWord);
    };

    stemmer.addStopWords = function(moreStopWords) {
        stopwords.words = stopwords.words.concat(moreStopWords);
    };

    stemmer.tokenizeAndStem = function(text, keepStops) {
        var stemmedTokens = [];
        
        new Tokenizer().tokenize(text).forEach(function(token) {
            if(keepStops || stopwords.words.indexOf(token) == -1)
                stemmedTokens.push(stemmer.stem(token));
        });
        
        return stemmedTokens;
    };

    stemmer.attach = function() {
        String.prototype.stem = function() {
            return stemmer.stem(this);
        };
        
        String.prototype.tokenizeAndStem = function(keepStops) {
            return stemmer.tokenizeAndStem(this, keepStops);
        };
    };
}

},{"../tokenizers/aggressive_tokenizer":98,"../util/stopwords":118}],89:[function(require,module,exports){
/*
Copyright (c) 2012, David Przybilla, Chris Umbel

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

var stopwords = require('../util/stopwords_es');
var Tokenizer = require('../tokenizers/aggressive_tokenizer_es');

module.exports = function() {
    var stemmer = this;

    stemmer.stem = function(token) {
        return token;
    };

    stemmer.tokenizeAndStem = function(text, keepStops) {
        var stemmedTokens = [];
        
        new Tokenizer().tokenize(text).forEach(function(token) {
            if (keepStops || stopwords.words.indexOf(token) == -1) {
                var resultToken = token.toLowerCase();
                if (resultToken.match(new RegExp('[a-záéíóúüñ0-9]+', 'gi'))) {
                    resultToken = stemmer.stem(resultToken);
                }
                stemmedTokens.push(resultToken);
            }
        });
        
        return stemmedTokens;
    };

    stemmer.attach = function() {
        String.prototype.stem = function() {
            return stemmer.stem(this);
        };
        
        String.prototype.tokenizeAndStem = function(keepStops) {
            return stemmer.tokenizeAndStem(this, keepStops);
        };
    };
}

},{"../tokenizers/aggressive_tokenizer_es":99,"../util/stopwords_es":119}],90:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel
Farsi Stemmer by Fardin Koochaki <me@fardinak.com>

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

var stopwords = require('../util/stopwords_fa');
var Tokenizer = require('../tokenizers/aggressive_tokenizer_fa');

module.exports = function() {
    var stemmer = this;

    stemmer.stem = function(token) {
        return token;
    };

    stemmer.tokenizeAndStem = function(text, keepStops) {
        var stemmedTokens = [];
        
        new Tokenizer().tokenize(text).forEach(function(token) {
            if(keepStops || stopwords.words.indexOf(token) == -1)
                stemmedTokens.push(stemmer.stem(token));
        });
        
        return stemmedTokens;
    };

    stemmer.attach = function() {
        String.prototype.stem = function() {
            return stemmer.stem(this);
        };
        
        String.prototype.tokenizeAndStem = function(keepStops) {
            return stemmer.tokenizeAndStem(this, keepStops);
        };
    };
}

},{"../tokenizers/aggressive_tokenizer_fa":100,"../util/stopwords_fa":120}],91:[function(require,module,exports){
/*
Copyright (c) 2014, Ismaël Héry

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

var stopwords = require('../util/stopwords_fr');
var Tokenizer = require('../tokenizers/aggressive_tokenizer_fr');

module.exports = function() {
   var stemmer = this;

   stemmer.stem = function(token) {
      return token;
   };

   stemmer.tokenizeAndStem = function(text, keepStops) {
      var stemmedTokens = [];

      new Tokenizer().tokenize(text).forEach(function(token) {
         if (keepStops || stopwords.words.indexOf(token) == -1) {
            var resultToken = token.toLowerCase();
            if (resultToken.match(/[a-zâàëéêèïîôûùç0-9]/gi)) {
               resultToken = stemmer.stem(resultToken);
            }
            stemmedTokens.push(resultToken);
         }
      });

      return stemmedTokens;
   };

   stemmer.attach = function() {
      String.prototype.stem = function() {
         return stemmer.stem(this);
      };

      String.prototype.tokenizeAndStem = function(keepStops) {
         return stemmer.tokenizeAndStem(this, keepStops);
      };
   };
}

},{"../tokenizers/aggressive_tokenizer_fr":101,"../util/stopwords_fr":121}],92:[function(require,module,exports){
var stopwords = require('../util/stopwords_it');
var Tokenizer = require('../tokenizers/aggressive_tokenizer_it');

module.exports = function() {
    var stemmer = this;

    stemmer.stem = function(token) {
        return token;
    };

    stemmer.tokenizeAndStem = function(text, keepStops) {
        var stemmedTokens = [];
        
        new Tokenizer().tokenize(text).forEach(function(token) {
            if (keepStops || stopwords.words.indexOf(token) == -1) {
                var resultToken = token.toLowerCase();
                if (resultToken.match(/[a-zàèìòù0-9]/gi)) {
                    resultToken = stemmer.stem(resultToken);
                }
                stemmedTokens.push(resultToken);
            }
        });
        
        return stemmedTokens;
    };

    stemmer.attach = function() {
        String.prototype.stem = function() {
            return stemmer.stem(this);
        };
        
        String.prototype.tokenizeAndStem = function(keepStops) {
            return stemmer.tokenizeAndStem(this, keepStops);
        };
    };
}
},{"../tokenizers/aggressive_tokenizer_it":102,"../util/stopwords_it":122}],93:[function(require,module,exports){
/*
 Copyright (c) 2012, Guillaume Marty

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
 * A very basic stemmer that performs the following steps:
 * * Stem katakana.
 * Inspired by:
 * http://svn.apache.org/repos/asf/lucene/dev/trunk/lucene/analysis/kuromoji/src/java/org/apache/lucene/analysis/ja/JapaneseKatakanaStemFilter.java
 *
 * This script assumes input is normalized using normalizer_ja().
 *
 * \@todo Use .bind() in StemmerJa.prototype.attach().
 */

var Tokenizer = require('../tokenizers/tokenizer_ja');
var stopwords = require('../util/stopwords_ja');



/**
 * @constructor
 */
var StemmerJa = function() {
};


/**
 * Tokenize and stem a text.
 * Stop words are excluded except if the second argument is true.
 *
 * @param {string} text
 * @param {boolean} keepStops Whether to keep stop words from the output or not.
 * @return {Array.<string>}
 */
StemmerJa.prototype.tokenizeAndStem = function(text, keepStops) {
  var self = this;
  var stemmedTokens = [];
  var tokens = new Tokenizer().tokenize(text);

  // This is probably faster than an if at each iteration.
  if (keepStops) {
    tokens.forEach(function(token) {
      var resultToken = token.toLowerCase();
      resultToken = self.stem(resultToken);
      stemmedTokens.push(resultToken);
    });
  } else {
    tokens.forEach(function(token) {
      if (stopwords.indexOf(token) == -1) {
        var resultToken = token.toLowerCase();
        resultToken = self.stem(resultToken);
        stemmedTokens.push(resultToken);
      }
    });
  }

  return stemmedTokens;
};


/**
 * Stem a term.
 *
 * @param {string} token
 * @return {string}
 */
StemmerJa.prototype.stem = function(token) {
  token = this.stemKatakana(token);

  return token;
};


/**
 * Remove the final prolonged sound mark on katakana if length is superior to
 * a threshold.
 *
 * @param {string} token A katakana string to stem.
 * @return {string} A katakana string stemmed.
 */
StemmerJa.prototype.stemKatakana = function(token) {
  var HIRAGANA_KATAKANA_PROLONGED_SOUND_MARK = 'ー';
  var DEFAULT_MINIMUM_LENGTH = 4;

  if (token.length >= DEFAULT_MINIMUM_LENGTH
      && token.slice(-1) === HIRAGANA_KATAKANA_PROLONGED_SOUND_MARK
      && this.isKatakana(token)) {
    token = token.slice(0, token.length - 1);
  }
  return token;
};


/**
 * Is a string made of fullwidth katakana only?
 * This implementation is the fastest I know:
 * http://jsperf.com/string-contain-katakana-only/2
 *
 * @param {string} str A string.
 * @return {boolean} True if the string has katakana only.
 */
StemmerJa.prototype.isKatakana = function(str) {
  return !!str.match(/^[゠-ヿ]+$/);
};

// Expose an attach function that will patch String with new methods.
StemmerJa.prototype.attach = function() {
  var self = this;

  String.prototype.stem = function() {
    return self.stem(this);
  };

  String.prototype.tokenizeAndStem = function(keepStops) {
    return self.tokenizeAndStem(this, keepStops);
  };
};

module.exports = StemmerJa;

},{"../tokenizers/tokenizer_ja":110,"../util/stopwords_ja":123}],94:[function(require,module,exports){
/*
Copyright (c) 2014, Kristoffer Brabrand

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

var stopwords = require('../util/stopwords_no');
var Tokenizer = require('../tokenizers/aggressive_tokenizer_no');

module.exports = function() {
    var stemmer = this;

    stemmer.stem = function(token) {
        return token;
    };

    stemmer.addStopWord = function(stopWord) {
        stopwords.words.push(stopWord);
    };

    stemmer.addStopWords = function(moreStopWords) {
        stopwords.words = stopwords.words.concat(moreStopWords);
    };

    stemmer.tokenizeAndStem = function(text, keepStops) {
        var stemmedTokens = [];

        new Tokenizer().tokenize(text).forEach(function(token) {
            if(keepStops || stopwords.words.indexOf(token.toLowerCase()) == -1)
                stemmedTokens.push(stemmer.stem(token));
        });

        return stemmedTokens;
    };

    stemmer.attach = function() {
        String.prototype.stem = function() {
            return stemmer.stem(this);
        };

        String.prototype.tokenizeAndStem = function(keepStops) {
            return stemmer.tokenizeAndStem(this, keepStops);
        };
    };
}

},{"../tokenizers/aggressive_tokenizer_no":104,"../util/stopwords_no":124}],95:[function(require,module,exports){
/*
Copyright (c) 2013, Paweł Łaskarzewski

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

var stopwords = require('../util/stopwords_pl');
var Tokenizer = require('../tokenizers/aggressive_tokenizer_pl');

module.exports = function() {
    var stemmer = this;

    stemmer.stem = function(token) {
        return token;
    };

    stemmer.tokenizeAndStem = function(text, keepStops) {
        var stemmedTokens = [];

        new Tokenizer().tokenize(text).forEach(function(token) {
            if (keepStops || stopwords.words.indexOf(token) == -1) {
                var resultToken = token.toLowerCase();
                if (resultToken.match(new RegExp('[a-zążśźęćńół0-9]+', 'gi'))) {
                    resultToken = stemmer.stem(resultToken);
                }
                stemmedTokens.push(resultToken);
            }
        });

        return stemmedTokens;
    };

    stemmer.attach = function() {
        String.prototype.stem = function() {
            return stemmer.stem(this);
        };

        String.prototype.tokenizeAndStem = function(keepStops) {
            return stemmer.tokenizeAndStem(this, keepStops);
        };
    };
}

},{"../tokenizers/aggressive_tokenizer_pl":105,"../util/stopwords_pl":125}],96:[function(require,module,exports){
/*
Copyright (c) 2012, Polyakov Vladimir, Chris Umbel

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

var stopwords = require('../util/stopwords_ru');
var Tokenizer = require('../tokenizers/aggressive_tokenizer_ru');

module.exports = function() {
    var stemmer = this;

    stemmer.stem = function(token) {
        return token;
    };

    stemmer.tokenizeAndStem = function(text, keepStops) {
        var stemmedTokens = [];
        
        new Tokenizer().tokenize(text).forEach(function(token) {
            if (keepStops || stopwords.words.indexOf(token) == -1) {
                var resultToken = token.toLowerCase();
                if (resultToken.match(new RegExp('[а-яё0-9]+', 'gi'))) {
                    resultToken = stemmer.stem(resultToken);
                }
                stemmedTokens.push(resultToken);
            }
        });
        
        return stemmedTokens;
    };

    stemmer.attach = function() {
        String.prototype.stem = function() {
            return stemmer.stem(this);
        };
        
        String.prototype.tokenizeAndStem = function(keepStops) {
            return stemmer.tokenizeAndStem(this, keepStops);
        };
    };
}

},{"../tokenizers/aggressive_tokenizer_ru":107,"../util/stopwords_ru":126}],97:[function(require,module,exports){
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
},{"../tokenizers/regexp_tokenizer":108,"../util/stopwords":118,"buffer":12,"fs":11,"underscore":147}],98:[function(require,module,exports){
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

var Tokenizer = require('./tokenizer'),
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);    
};
util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    return this.trim(text.split(/\W+/));
};

},{"./tokenizer":109,"util":149}],99:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel,David Przybilla

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
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);    
};
util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    return this.trim(text.split(/[^a-zA-Zá-úÁ-ÚñÑüÜ]+/));
};

},{"./tokenizer":109,"util":149}],100:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel
Farsi Aggressive Tokenizer by Fardin Koochaki <me@fardinak.com>

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
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);    
};
util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.clearEmptyString = function(array) {
	return array.filter(function(a) {
		return a != '';
	});
};

AggressiveTokenizer.prototype.clearText = function(text) {
	return text.replace(new RegExp('\.\:\+\-\=\(\)\"\'\!\?\،\,\؛\;', 'g'), ' ');
};

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    text = this.clearText(text);
    return this.clearEmptyString(text.split(/\s+/));
};

},{"./tokenizer":109,"util":149}],101:[function(require,module,exports){
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

var Tokenizer = require('./tokenizer'),
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);    
};
util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    return this.trim(text.split(/[^a-z0-9äâàéèëêïîöôùüûœç]+/i));
};

},{"./tokenizer":109,"util":149}],102:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel,David Przybilla

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
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);    
};
util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    return this.trim(text.split(/\W+/));
};

},{"./tokenizer":109,"util":149}],103:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel, Martijn de Boer

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
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);
};
util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    return this.trim(text.split(/[^a-zA-Z0-9_']+/));
};

},{"./tokenizer":109,"util":149}],104:[function(require,module,exports){
/*
Copyright (c) 2014, Kristoffer Brabrand

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
    normalizer = require('../normalizers/normalizer_no'),
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);
};
util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.tokenize = function(text) {
    text = normalizer.remove_diacritics(text);

    // break a string up into an array of tokens by anything non-word
    return this.trim(text.split(/[^A-Za-z0-9_æøåÆØÅäÄöÖüÜ]+/));
};

},{"../normalizers/normalizer_no":72,"./tokenizer":109,"util":149}],105:[function(require,module,exports){
/*
Copyright (c) 2013, Paweł Łaskarzewski

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
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);
};

util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.withoutEmpty = function(array) {
	return array.filter(function(a) {return a;});
};

AggressiveTokenizer.prototype.clearText = function(text) {
	return text.replace(/[^a-zążśźęćńół0-9]/gi, ' ').replace(/[\s\n]+/g, ' ').trim();
};

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    return this.withoutEmpty(this.clearText(text).split(' '));
};

},{"./tokenizer":109,"util":149}],106:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel,David Przybilla

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
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);
};
util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.withoutEmpty = function(array) {
	return array.filter(function(a) {return a;});
};

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    return this.withoutEmpty(this.trim(text.split(/[^a-zA-Zà-úÀ-Ú]/)));
};

},{"./tokenizer":109,"util":149}],107:[function(require,module,exports){
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

var Tokenizer = require('./tokenizer'),
    util = require('util');

var AggressiveTokenizer = function() {
    Tokenizer.call(this);    
};

util.inherits(AggressiveTokenizer, Tokenizer);

module.exports = AggressiveTokenizer;

AggressiveTokenizer.prototype.withoutEmpty = function(array) {
	return array.filter(function(a) {return a;});
};

AggressiveTokenizer.prototype.clearText = function(text) {
	return text.replace(/[^a-zа-яё0-9]/gi, ' ').replace(/[\s\n]+/g, ' ').trim();
};

AggressiveTokenizer.prototype.tokenize = function(text) {
    // break a string up into an array of tokens by anything non-word
    return this.withoutEmpty(this.clearText(text).split(' '));
};

},{"./tokenizer":109,"util":149}],108:[function(require,module,exports){
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

},{"./tokenizer":109,"underscore":147,"util":149}],109:[function(require,module,exports){
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

},{}],110:[function(require,module,exports){
// Original copyright:
/*
 Copyright (c) 2008, Taku Kudo

 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 * Neither the name of the <ORGANIZATION> nor the names of its
 contributors may be used to endorse or promote products derived from this
 software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// This version:
/*
 Copyright (c) 2012, Guillaume Marty

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

// TinySegmenter 0.1 -- Super compact Japanese tokenizer in Javascript
// (c) 2008 Taku Kudo <taku@chasen.org>
// TinySegmenter is freely distributable under the terms of a new BSD licence.
// For details, see http://chasen.org/~taku/software/TinySegmenter/LICENCE.txt

var Tokenizer = require('./tokenizer'),
    normalize = require('../normalizers/normalizer_ja').normalize_ja,
    util = require('util');



/**
 * @constructor
 */
var TokenizerJa = function() {
  this.chartype_ = [
    [/[〇一二三四五六七八九十百千万億兆]/, 'M'],
    [/[一-鿌〆]/, 'H'],
    [/[ぁ-ゟ]/, 'I'],
    [/[゠-ヿ]/, 'K'],
    [/[a-zA-Z]/, 'A'],
    [/[0-9]/, 'N']
  ];

  this.BIAS__ = -332;
  this.BC1__ = {'HH': 6, 'II': 2461, 'KH': 406, 'OH': -1378};
  this.BC2__ = {'AA': -3267, 'AI': 2744, 'AN': -878, 'HH': -4070, 'HM': -1711, 'HN': 4012, 'HO': 3761, 'IA': 1327, 'IH': -1184, 'II': -1332, 'IK': 1721, 'IO': 5492, 'KI': 3831, 'KK': -8741, 'MH': -3132, 'MK': 3334, 'OO': -2920};
  this.BC3__ = {'HH': 996, 'HI': 626, 'HK': -721, 'HN': -1307, 'HO': -836, 'IH': -301, 'KK': 2762, 'MK': 1079, 'MM': 4034, 'OA': -1652, 'OH': 266};
  this.BP1__ = {'BB': 295, 'OB': 304, 'OO': -125, 'UB': 352};
  this.BP2__ = {'BO': 60, 'OO': -1762};
  this.BQ1__ = {'BHH': 1150, 'BHM': 1521, 'BII': -1158, 'BIM': 886, 'BMH': 1208, 'BNH': 449, 'BOH': -91, 'BOO': -2597, 'OHI': 451, 'OIH': -296, 'OKA': 1851, 'OKH': -1020, 'OKK': 904, 'OOO': 2965};
  this.BQ2__ = {'BHH': 118, 'BHI': -1159, 'BHM': 466, 'BIH': -919, 'BKK': -1720, 'BKO': 864, 'OHH': -1139, 'OHM': -181, 'OIH': 153, 'UHI': -1146};
  this.BQ3__ = {'BHH': -792, 'BHI': 2664, 'BII': -299, 'BKI': 419, 'BMH': 937, 'BMM': 8335, 'BNN': 998, 'BOH': 775, 'OHH': 2174, 'OHM': 439, 'OII': 280, 'OKH': 1798, 'OKI': -793, 'OKO': -2242, 'OMH': -2402, 'OOO': 11699};
  this.BQ4__ = {'BHH': -3895, 'BIH': 3761, 'BII': -4654, 'BIK': 1348, 'BKK': -1806, 'BMI': -3385, 'BOO': -12396, 'OAH': 926, 'OHH': 266, 'OHK': -2036, 'ONN': -973};
  this.BW1__ = {'，と': 660, '，同': 727, 'B1あ': 1404, 'B1同': 542, '、と': 660, '、同': 727, '｣と': 1682, 'あっ': 1505, 'いう': 1743, 'いっ': -2055, 'いる': 672, 'うし': -4817, 'うん': 665, 'から': 3472, 'がら': 600, 'こう': -790, 'こと': 2083, 'こん': -1262, 'さら': -4143, 'さん': 4573, 'した': 2641, 'して': 1104, 'すで': -3399, 'そこ': 1977, 'それ': -871, 'たち': 1122, 'ため': 601, 'った': 3463, 'つい': -802, 'てい': 805, 'てき': 1249, 'でき': 1127, 'です': 3445, 'では': 844, 'とい': -4915, 'とみ': 1922, 'どこ': 3887, 'ない': 5713, 'なっ': 3015, 'など': 7379, 'なん': -1113, 'にし': 2468, 'には': 1498, 'にも': 1671, 'に対': -912, 'の一': -501, 'の中': 741, 'ませ': 2448, 'まで': 1711, 'まま': 2600, 'まる': -2155, 'やむ': -1947, 'よっ': -2565, 'れた': 2369, 'れで': -913, 'をし': 1860, 'を見': 731, '亡く': -1886, '京都': 2558, '取り': -2784, '大き': -2604, '大阪': 1497, '平方': -2314, '引き': -1336, '日本': -195, '本当': -2423, '毎日': -2113, '目指': -724};
  this.BW2__ = {'11': -669, '．．': -11822, '――': -5730, '−−': -13175, 'いう': -1609, 'うか': 2490, 'かし': -1350, 'かも': -602, 'から': -7194, 'かれ': 4612, 'がい': 853, 'がら': -3198, 'きた': 1941, 'くな': -1597, 'こと': -8392, 'この': -4193, 'させ': 4533, 'され': 13168, 'さん': -3977, 'しい': -1819, 'しか': -545, 'した': 5078, 'して': 972, 'しな': 939, 'その': -3744, 'たい': -1253, 'たた': -662, 'ただ': -3857, 'たち': -786, 'たと': 1224, 'たは': -939, 'った': 4589, 'って': 1647, 'っと': -2094, 'てい': 6144, 'てき': 3640, 'てく': 2551, 'ては': -3110, 'ても': -3065, 'でい': 2666, 'でき': -1528, 'でし': -3828, 'です': -4761, 'でも': -4203, 'とい': 1890, 'とこ': -1746, 'とと': -2279, 'との': 720, 'とみ': 5168, 'とも': -3941, 'ない': -2488, 'なが': -1313, 'など': -6509, 'なの': 2614, 'なん': 3099, 'にお': -1615, 'にし': 2748, 'にな': 2454, 'によ': -7236, 'に対': -14943, 'に従': -4688, 'に関': -11388, 'のか': 2093, 'ので': -7059, 'のに': -6041, 'のの': -6125, 'はい': 1073, 'はが': -1033, 'はず': -2532, 'ばれ': 1813, 'まし': -1316, 'まで': -6621, 'まれ': 5409, 'めて': -3153, 'もい': 2230, 'もの': -10713, 'らか': -944, 'らし': -1611, 'らに': -1897, 'りし': 651, 'りま': 1620, 'れた': 4270, 'れて': 849, 'れば': 4114, 'ろう': 6067, 'われ': 7901, 'を通': -11877, 'んだ': 728, 'んな': -4115, '一人': 602, '一方': -1375, '一日': 970, '一部': -1051, '上が': -4479, '会社': -1116, '出て': 2163, '分の': -7758, '同党': 970, '同日': -913, '大阪': -2471, '委員': -1250, '少な': -1050, '年度': -8669, '年間': -1626, '府県': -2363, '手権': -1982, '新聞': -4066, '日新': -722, '日本': -7068, '日米': 3372, '曜日': -601, '朝鮮': -2355, '本人': -2697, '東京': -1543, '然と': -1384, '社会': -1276, '立て': -990, '第に': -1612, '米国': -4268};
  this.BW3__ = {'あた': -2194, 'あり': 719, 'ある': 3846, 'い．': -1185, 'い。': -1185, 'いい': 5308, 'いえ': 2079, 'いく': 3029, 'いた': 2056, 'いっ': 1883, 'いる': 5600, 'いわ': 1527, 'うち': 1117, 'うと': 4798, 'えと': 1454, 'か．': 2857, 'か。': 2857, 'かけ': -743, 'かっ': -4098, 'かに': -669, 'から': 6520, 'かり': -2670, 'が，': 1816, 'が、': 1816, 'がき': -4855, 'がけ': -1127, 'がっ': -913, 'がら': -4977, 'がり': -2064, 'きた': 1645, 'けど': 1374, 'こと': 7397, 'この': 1542, 'ころ': -2757, 'さい': -714, 'さを': 976, 'し，': 1557, 'し、': 1557, 'しい': -3714, 'した': 3562, 'して': 1449, 'しな': 2608, 'しま': 1200, 'す．': -1310, 'す。': -1310, 'する': 6521, 'ず，': 3426, 'ず、': 3426, 'ずに': 841, 'そう': 428, 'た．': 8875, 'た。': 8875, 'たい': -594, 'たの': 812, 'たり': -1183, 'たる': -853, 'だ．': 4098, 'だ。': 4098, 'だっ': 1004, 'った': -4748, 'って': 300, 'てい': 6240, 'てお': 855, 'ても': 302, 'です': 1437, 'でに': -1482, 'では': 2295, 'とう': -1387, 'とし': 2266, 'との': 541, 'とも': -3543, 'どう': 4664, 'ない': 1796, 'なく': -903, 'など': 2135, 'に，': -1021, 'に、': -1021, 'にし': 1771, 'にな': 1906, 'には': 2644, 'の，': -724, 'の、': -724, 'の子': -1000, 'は，': 1337, 'は、': 1337, 'べき': 2181, 'まし': 1113, 'ます': 6943, 'まっ': -1549, 'まで': 6154, 'まれ': -793, 'らし': 1479, 'られ': 6820, 'るる': 3818, 'れ，': 854, 'れ、': 854, 'れた': 1850, 'れて': 1375, 'れば': -3246, 'れる': 1091, 'われ': -605, 'んだ': 606, 'んで': 798, 'カ月': 990, '会議': 860, '入り': 1232, '大会': 2217, '始め': 1681, '市': 965, '新聞': -5055, '日，': 974, '日、': 974, '社会': 2024};
  this.TC1__ = {'AAA': 1093, 'HHH': 1029, 'HHM': 580, 'HII': 998, 'HOH': -390, 'HOM': -331, 'IHI': 1169, 'IOH': -142, 'IOI': -1015, 'IOM': 467, 'MMH': 187, 'OOI': -1832};
  this.TC2__ = {'HHO': 2088, 'HII': -1023, 'HMM': -1154, 'IHI': -1965, 'KKH': 703, 'OII': -2649};
  this.TC3__ = {'AAA': -294, 'HHH': 346, 'HHI': -341, 'HII': -1088, 'HIK': 731, 'HOH': -1486, 'IHH': 128, 'IHI': -3041, 'IHO': -1935, 'IIH': -825, 'IIM': -1035, 'IOI': -542, 'KHH': -1216, 'KKA': 491, 'KKH': -1217, 'KOK': -1009, 'MHH': -2694, 'MHM': -457, 'MHO': 123, 'MMH': -471, 'NNH': -1689, 'NNO': 662, 'OHO': -3393};
  this.TC4__ = {'HHH': -203, 'HHI': 1344, 'HHK': 365, 'HHM': -122, 'HHN': 182, 'HHO': 669, 'HIH': 804, 'HII': 679, 'HOH': 446, 'IHH': 695, 'IHO': -2324, 'IIH': 321, 'III': 1497, 'IIO': 656, 'IOO': 54, 'KAK': 4845, 'KKA': 3386, 'KKK': 3065, 'MHH': -405, 'MHI': 201, 'MMH': -241, 'MMM': 661, 'MOM': 841};
  this.TQ1__ = {'BHHH': -227, 'BHHI': 316, 'BHIH': -132, 'BIHH': 60, 'BIII': 1595, 'BNHH': -744, 'BOHH': 225, 'BOOO': -908, 'OAKK': 482, 'OHHH': 281, 'OHIH': 249, 'OIHI': 200, 'OIIH': -68};
  this.TQ2__ = {'BIHH': -1401, 'BIII': -1033, 'BKAK': -543, 'BOOO': -5591};
  this.TQ3__ = {'BHHH': 478, 'BHHM': -1073, 'BHIH': 222, 'BHII': -504, 'BIIH': -116, 'BIII': -105, 'BMHI': -863, 'BMHM': -464, 'BOMH': 620, 'OHHH': 346, 'OHHI': 1729, 'OHII': 997, 'OHMH': 481, 'OIHH': 623, 'OIIH': 1344, 'OKAK': 2792, 'OKHH': 587, 'OKKA': 679, 'OOHH': 110, 'OOII': -685};
  this.TQ4__ = {'BHHH': -721, 'BHHM': -3604, 'BHII': -966, 'BIIH': -607, 'BIII': -2181, 'OAAA': -2763, 'OAKK': 180, 'OHHH': -294, 'OHHI': 2446, 'OHHO': 480, 'OHIH': -1573, 'OIHH': 1935, 'OIHI': -493, 'OIIH': 626, 'OIII': -4007, 'OKAK': -8156};
  this.TW1__ = {'につい': -4681, '東京都': 2026};
  this.TW2__ = {'ある程': -2049, 'いった': -1256, 'ころが': -2434, 'しょう': 3873, 'その後': -4430, 'だって': -1049, 'ていた': 1833, 'として': -4657, 'ともに': -4517, 'もので': 1882, '一気に': -792, '初めて': -1512, '同時に': -8097, '大きな': -1255, '対して': -2721, '社会党': -3216};
  this.TW3__ = {'いただ': -1734, 'してい': 1314, 'として': -4314, 'につい': -5483, 'にとっ': -5989, 'に当た': -6247, 'ので，': -727, 'ので、': -727, 'のもの': -600, 'れから': -3752, '十二月': -2287};
  this.TW4__ = {'いう．': 8576, 'いう。': 8576, 'からな': -2348, 'してい': 2958, 'たが，': 1516, 'たが、': 1516, 'ている': 1538, 'という': 1349, 'ました': 5543, 'ません': 1097, 'ようと': -4258, 'よると': 5865};
  this.UC1__ = {'A': 484, 'K': 93, 'M': 645, 'O': -505};
  this.UC2__ = {'A': 819, 'H': 1059, 'I': 409, 'M': 3987, 'N': 5775, 'O': 646};
  this.UC3__ = {'A': -1370, 'I': 2311};
  this.UC4__ = {'A': -2643, 'H': 1809, 'I': -1032, 'K': -3450, 'M': 3565, 'N': 3876, 'O': 6646};
  this.UC5__ = {'H': 313, 'I': -1238, 'K': -799, 'M': 539, 'O': -831};
  this.UC6__ = {'H': -506, 'I': -253, 'K': 87, 'M': 247, 'O': -387};
  this.UP1__ = {'O': -214};
  this.UP2__ = {'B': 69, 'O': 935};
  this.UP3__ = {'B': 189};
  this.UQ1__ = {'BH': 21, 'BI': -12, 'BK': -99, 'BN': 142, 'BO': -56, 'OH': -95, 'OI': 477, 'OK': 410, 'OO': -2422};
  this.UQ2__ = {'BH': 216, 'BI': 113, 'OK': 1759};
  this.UQ3__ = {'BA': -479, 'BH': 42, 'BI': 1913, 'BK': -7198, 'BM': 3160, 'BN': 6427, 'BO': 14761, 'OI': -827, 'ON': -3212};
  this.UW1__ = {'，': 156, '、': 156, '｢': -463, 'あ': -941, 'う': -127, 'が': -553, 'き': 121, 'こ': 505, 'で': -201, 'と': -547, 'ど': -123, 'に': -789, 'の': -185, 'は': -847, 'も': -466, 'や': -470, 'よ': 182, 'ら': -292, 'り': 208, 'れ': 169, 'を': -446, 'ん': -137, '・': -135, '主': -402, '京': -268, '区': -912, '午': 871, '国': -460, '大': 561, '委': 729, '市': -411, '日': -141, '理': 361, '生': -408, '県': -386, '都': -718};
  this.UW2__ = {'，': -829, '、': -829, '〇': 892, '｢': -645, '｣': 3145, 'あ': -538, 'い': 505, 'う': 134, 'お': -502, 'か': 1454, 'が': -856, 'く': -412, 'こ': 1141, 'さ': 878, 'ざ': 540, 'し': 1529, 'す': -675, 'せ': 300, 'そ': -1011, 'た': 188, 'だ': 1837, 'つ': -949, 'て': -291, 'で': -268, 'と': -981, 'ど': 1273, 'な': 1063, 'に': -1764, 'の': 130, 'は': -409, 'ひ': -1273, 'べ': 1261, 'ま': 600, 'も': -1263, 'や': -402, 'よ': 1639, 'り': -579, 'る': -694, 'れ': 571, 'を': -2516, 'ん': 2095, 'ア': -587, 'カ': 306, 'キ': 568, 'ッ': 831, '三': -758, '不': -2150, '世': -302, '中': -968, '主': -861, '事': 492, '人': -123, '会': 978, '保': 362, '入': 548, '初': -3025, '副': -1566, '北': -3414, '区': -422, '大': -1769, '天': -865, '太': -483, '子': -1519, '学': 760, '実': 1023, '小': -2009, '市': -813, '年': -1060, '強': 1067, '手': -1519, '揺': -1033, '政': 1522, '文': -1355, '新': -1682, '日': -1815, '明': -1462, '最': -630, '朝': -1843, '本': -1650, '東': -931, '果': -665, '次': -2378, '民': -180, '気': -1740, '理': 752, '発': 529, '目': -1584, '相': -242, '県': -1165, '立': -763, '第': 810, '米': 509, '自': -1353, '行': 838, '西': -744, '見': -3874, '調': 1010, '議': 1198, '込': 3041, '開': 1758, '間': -1257};
  this.UW3__ = {'1': -800, '，': 4889, '−': -1723, '、': 4889, '々': -2311, '〇': 5827, '｣': 2670, '〓': -3573, 'あ': -2696, 'い': 1006, 'う': 2342, 'え': 1983, 'お': -4864, 'か': -1163, 'が': 3271, 'く': 1004, 'け': 388, 'げ': 401, 'こ': -3552, 'ご': -3116, 'さ': -1058, 'し': -395, 'す': 584, 'せ': 3685, 'そ': -5228, 'た': 842, 'ち': -521, 'っ': -1444, 'つ': -1081, 'て': 6167, 'で': 2318, 'と': 1691, 'ど': -899, 'な': -2788, 'に': 2745, 'の': 4056, 'は': 4555, 'ひ': -2171, 'ふ': -1798, 'へ': 1199, 'ほ': -5516, 'ま': -4384, 'み': -120, 'め': 1205, 'も': 2323, 'や': -788, 'よ': -202, 'ら': 727, 'り': 649, 'る': 5905, 'れ': 2773, 'わ': -1207, 'を': 6620, 'ん': -518, 'ア': 551, 'グ': 1319, 'ス': 874, 'ッ': -1350, 'ト': 521, 'ム': 1109, 'ル': 1591, 'ロ': 2201, 'ン': 278, '・': -3794, '一': -1619, '下': -1759, '世': -2087, '両': 3815, '中': 653, '主': -758, '予': -1193, '二': 974, '人': 2742, '今': 792, '他': 1889, '以': -1368, '低': 811, '何': 4265, '作': -361, '保': -2439, '元': 4858, '党': 3593, '全': 1574, '公': -3030, '六': 755, '共': -1880, '円': 5807, '再': 3095, '分': 457, '初': 2475, '別': 1129, '前': 2286, '副': 4437, '力': 365, '動': -949, '務': -1872, '化': 1327, '北': -1038, '区': 4646, '千': -2309, '午': -783, '協': -1006, '口': 483, '右': 1233, '各': 3588, '合': -241, '同': 3906, '和': -837, '員': 4513, '国': 642, '型': 1389, '場': 1219, '外': -241, '妻': 2016, '学': -1356, '安': -423, '実': -1008, '家': 1078, '小': -513, '少': -3102, '州': 1155, '市': 3197, '平': -1804, '年': 2416, '広': -1030, '府': 1605, '度': 1452, '建': -2352, '当': -3885, '得': 1905, '思': -1291, '性': 1822, '戸': -488, '指': -3973, '政': -2013, '教': -1479, '数': 3222, '文': -1489, '新': 1764, '日': 2099, '旧': 5792, '昨': -661, '時': -1248, '曜': -951, '最': -937, '月': 4125, '期': 360, '李': 3094, '村': 364, '東': -805, '核': 5156, '森': 2438, '業': 484, '氏': 2613, '民': -1694, '決': -1073, '法': 1868, '海': -495, '無': 979, '物': 461, '特': -3850, '生': -273, '用': 914, '町': 1215, '的': 7313, '直': -1835, '省': 792, '県': 6293, '知': -1528, '私': 4231, '税': 401, '立': -960, '第': 1201, '米': 7767, '系': 3066, '約': 3663, '級': 1384, '統': -4229, '総': 1163, '線': 1255, '者': 6457, '能': 725, '自': -2869, '英': 785, '見': 1044, '調': -562, '財': -733, '費': 1777, '車': 1835, '軍': 1375, '込': -1504, '通': -1136, '選': -681, '郎': 1026, '郡': 4404, '部': 1200, '金': 2163, '長': 421, '開': -1432, '間': 1302, '関': -1282, '雨': 2009, '電': -1045, '非': 2066, '駅': 1620};
  this.UW4__ = {'，': 3930, '．': 3508, '―': -4841, '、': 3930, '。': 3508, '〇': 4999, '｢': 1895, '｣': 3798, '〓': -5156, 'あ': 4752, 'い': -3435, 'う': -640, 'え': -2514, 'お': 2405, 'か': 530, 'が': 6006, 'き': -4482, 'ぎ': -3821, 'く': -3788, 'け': -4376, 'げ': -4734, 'こ': 2255, 'ご': 1979, 'さ': 2864, 'し': -843, 'じ': -2506, 'す': -731, 'ず': 1251, 'せ': 181, 'そ': 4091, 'た': 5034, 'だ': 5408, 'ち': -3654, 'っ': -5882, 'つ': -1659, 'て': 3994, 'で': 7410, 'と': 4547, 'な': 5433, 'に': 6499, 'ぬ': 1853, 'ね': 1413, 'の': 7396, 'は': 8578, 'ば': 1940, 'ひ': 4249, 'び': -4134, 'ふ': 1345, 'へ': 6665, 'べ': -744, 'ほ': 1464, 'ま': 1051, 'み': -2082, 'む': -882, 'め': -5046, 'も': 4169, 'ゃ': -2666, 'や': 2795, 'ょ': -1544, 'よ': 3351, 'ら': -2922, 'り': -9726, 'る': -14896, 'れ': -2613, 'ろ': -4570, 'わ': -1783, 'を': 13150, 'ん': -2352, 'カ': 2145, 'コ': 1789, 'セ': 1287, 'ッ': -724, 'ト': -403, 'メ': -1635, 'ラ': -881, 'リ': -541, 'ル': -856, 'ン': -3637, '・': -4371, 'ー': -11870, '一': -2069, '中': 2210, '予': 782, '事': -190, '井': -1768, '人': 1036, '以': 544, '会': 950, '体': -1286, '作': 530, '側': 4292, '先': 601, '党': -2006, '共': -1212, '内': 584, '円': 788, '初': 1347, '前': 1623, '副': 3879, '力': -302, '動': -740, '務': -2715, '化': 776, '区': 4517, '協': 1013, '参': 1555, '合': -1834, '和': -681, '員': -910, '器': -851, '回': 1500, '国': -619, '園': -1200, '地': 866, '場': -1410, '塁': -2094, '士': -1413, '多': 1067, '大': 571, '子': -4802, '学': -1397, '定': -1057, '寺': -809, '小': 1910, '屋': -1328, '山': -1500, '島': -2056, '川': -2667, '市': 2771, '年': 374, '庁': -4556, '後': 456, '性': 553, '感': 916, '所': -1566, '支': 856, '改': 787, '政': 2182, '教': 704, '文': 522, '方': -856, '日': 1798, '時': 1829, '最': 845, '月': -9066, '木': -485, '来': -442, '校': -360, '業': -1043, '氏': 5388, '民': -2716, '気': -910, '沢': -939, '済': -543, '物': -735, '率': 672, '球': -1267, '生': -1286, '産': -1101, '田': -2900, '町': 1826, '的': 2586, '目': 922, '省': -3485, '県': 2997, '空': -867, '立': -2112, '第': 788, '米': 2937, '系': 786, '約': 2171, '経': 1146, '統': -1169, '総': 940, '線': -994, '署': 749, '者': 2145, '能': -730, '般': -852, '行': -792, '規': 792, '警': -1184, '議': -244, '谷': -1000, '賞': 730, '車': -1481, '軍': 1158, '輪': -1433, '込': -3370, '近': 929, '道': -1291, '選': 2596, '郎': -4866, '都': 1192, '野': -1100, '銀': -2213, '長': 357, '間': -2344, '院': -2297, '際': -2604, '電': -878, '領': -1659, '題': -792, '館': -1984, '首': 1749, '高': 2120};
  this.UW5__ = {'1': -514, '，': 465, '．': -299, 'E2': -32768, '］': -2762, '、': 465, '。': -299, '｢': 363, 'あ': 1655, 'い': 331, 'う': -503, 'え': 1199, 'お': 527, 'か': 647, 'が': -421, 'き': 1624, 'ぎ': 1971, 'く': 312, 'げ': -983, 'さ': -1537, 'し': -1371, 'す': -852, 'だ': -1186, 'ち': 1093, 'っ': 52, 'つ': 921, 'て': -18, 'で': -850, 'と': -127, 'ど': 1682, 'な': -787, 'に': -1224, 'の': -635, 'は': -578, 'べ': 1001, 'み': 502, 'め': 865, 'ゃ': 3350, 'ょ': 854, 'り': -208, 'る': 429, 'れ': 504, 'わ': 419, 'を': -1264, 'ん': 327, 'イ': 241, 'ル': 451, 'ン': -343, '中': -871, '京': 722, '会': -1153, '党': -654, '務': 3519, '区': -901, '告': 848, '員': 2104, '大': -1296, '学': -548, '定': 1785, '嵐': -1304, '市': -2991, '席': 921, '年': 1763, '思': 872, '所': -814, '挙': 1618, '新': -1682, '日': 218, '月': -4353, '査': 932, '格': 1356, '機': -1508, '氏': -1347, '田': 240, '町': -3912, '的': -3149, '相': 1319, '省': -1052, '県': -4003, '研': -997, '社': -278, '空': -813, '統': 1955, '者': -2233, '表': 663, '語': -1073, '議': 1219, '選': -1018, '郎': -368, '長': 786, '間': 1191, '題': 2368, '館': -689};
  this.UW6__ = {'1': -270, '，': 227, '．': 808, 'E1': 306, '、': 227, '。': 808, 'あ': -307, 'う': 189, 'か': 241, 'が': -73, 'く': -121, 'こ': -200, 'じ': 1782, 'す': 383, 'た': -428, 'っ': 573, 'て': -1014, 'で': 101, 'と': -105, 'な': -253, 'に': -149, 'の': -417, 'は': -236, 'も': -206, 'り': 187, 'る': -135, 'を': 195, 'ル': -673, 'ン': -496, '一': -277, '中': 201, '件': -800, '会': 624, '前': 302, '区': 1792, '員': -1212, '委': 798, '学': -960, '市': 887, '広': -695, '後': 535, '業': -697, '相': 753, '社': -507, '福': 974, '空': -822, '者': 1811, '連': 463, '郎': 1082};

  return this;
};

util.inherits(TokenizerJa, Tokenizer);


/**
 * @param {string} str
 * @return {string}
 * @private
 */
TokenizerJa.prototype.ctype_ = function(str) {
  for (var i = 0, length = this.chartype_.length; i < length; i++) {
    if (str.match(this.chartype_[i][0])) {
      return this.chartype_[i][1];
    }
  }
  return 'O';
};


/**
 * @param {string} v
 * @return {number}
 * @private
 */
TokenizerJa.prototype.ts_ = function(v) {
  if (v) { return v; }
  return 0;
};


/**
 * Remove punctuations signs from tokens.
 *
 * @param {Array.<string>} tokens An array of tokens.
 * @return {Array.<string>} An array of tokens.
 * @private
 */
TokenizerJa.prototype.removePuncTokens = function(tokens) {
  return tokens
      .map(function(token) {
        return token.replace(/[＿－・，、；：！？．。（）［］｛｝｢｣＠＊＼／＆＃％｀＾＋＜＝＞｜～≪≫─＄＂_\-･,､;:!?.｡()[\]{}「」@*\/&#%`^+<=>|~«»$"\s]+/g, '');
      })
      .filter(function(token) {
        return token != '';
      });
};


/**
 * @param {string} text
 * @return {Array.<string>}
 */
TokenizerJa.prototype.tokenize = function(text) {
  if (text == null || text == undefined || text == '') {
    return [];
  }
  text = normalize(text);
  var result = [];
  var seg = ['B3', 'B2', 'B1'];
  var ctype = ['O', 'O', 'O'];
  var o = text.split('');
  var i;
  var length;
  for (i = 0, length = o.length; i < length; ++i) {
    seg.push(o[i]);
    ctype.push(this.ctype_(o[i]));
  }
  seg.push('E1');
  seg.push('E2');
  seg.push('E3');
  ctype.push('O');
  ctype.push('O');
  ctype.push('O');
  var word = seg[3];
  var p1 = 'U';
  var p2 = 'U';
  var p3 = 'U';
  for (i = 4, length = seg.length - 3; i < length; ++i) {
    var score = this.BIAS__;
    var w1 = seg[i - 3];
    var w2 = seg[i - 2];
    var w3 = seg[i - 1];
    var w4 = seg[i];
    var w5 = seg[i + 1];
    var w6 = seg[i + 2];
    var c1 = ctype[i - 3];
    var c2 = ctype[i - 2];
    var c3 = ctype[i - 1];
    var c4 = ctype[i];
    var c5 = ctype[i + 1];
    var c6 = ctype[i + 2];
    score += this.ts_(this.UP1__[p1]);
    score += this.ts_(this.UP2__[p2]);
    score += this.ts_(this.UP3__[p3]);
    score += this.ts_(this.BP1__[p1 + p2]);
    score += this.ts_(this.BP2__[p2 + p3]);
    score += this.ts_(this.UW1__[w1]);
    score += this.ts_(this.UW2__[w2]);
    score += this.ts_(this.UW3__[w3]);
    score += this.ts_(this.UW4__[w4]);
    score += this.ts_(this.UW5__[w5]);
    score += this.ts_(this.UW6__[w6]);
    score += this.ts_(this.BW1__[w2 + w3]);
    score += this.ts_(this.BW2__[w3 + w4]);
    score += this.ts_(this.BW3__[w4 + w5]);
    score += this.ts_(this.TW1__[w1 + w2 + w3]);
    score += this.ts_(this.TW2__[w2 + w3 + w4]);
    score += this.ts_(this.TW3__[w3 + w4 + w5]);
    score += this.ts_(this.TW4__[w4 + w5 + w6]);
    score += this.ts_(this.UC1__[c1]);
    score += this.ts_(this.UC2__[c2]);
    score += this.ts_(this.UC3__[c3]);
    score += this.ts_(this.UC4__[c4]);
    score += this.ts_(this.UC5__[c5]);
    score += this.ts_(this.UC6__[c6]);
    score += this.ts_(this.BC1__[c2 + c3]);
    score += this.ts_(this.BC2__[c3 + c4]);
    score += this.ts_(this.BC3__[c4 + c5]);
    score += this.ts_(this.TC1__[c1 + c2 + c3]);
    score += this.ts_(this.TC2__[c2 + c3 + c4]);
    score += this.ts_(this.TC3__[c3 + c4 + c5]);
    score += this.ts_(this.TC4__[c4 + c5 + c6]);
    //score += this.ts_(this.TC5__[c4 + c5 + c6]);
    score += this.ts_(this.UQ1__[p1 + c1]);
    score += this.ts_(this.UQ2__[p2 + c2]);
    score += this.ts_(this.UQ3__[p3 + c3]);
    score += this.ts_(this.BQ1__[p2 + c2 + c3]);
    score += this.ts_(this.BQ2__[p2 + c3 + c4]);
    score += this.ts_(this.BQ3__[p3 + c2 + c3]);
    score += this.ts_(this.BQ4__[p3 + c3 + c4]);
    score += this.ts_(this.TQ1__[p2 + c1 + c2 + c3]);
    score += this.ts_(this.TQ2__[p2 + c2 + c3 + c4]);
    score += this.ts_(this.TQ3__[p3 + c1 + c2 + c3]);
    score += this.ts_(this.TQ4__[p3 + c2 + c3 + c4]);
    var p = 'O';
    if (score > 0) {
      result.push(word);
      word = '';
      p = 'B';
    }
    p1 = p2;
    p2 = p3;
    p3 = p;
    word += seg[i];
  }
  result.push(word);

  result = this.removePuncTokens(result);

  return result;
};

module.exports = TokenizerJa;

},{"../normalizers/normalizer_ja":71,"./tokenizer":109,"util":149}],111:[function(require,module,exports){
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

var contractions2 = [
    /(.)('ll|'re|'ve|n't|'s|'m|'d)\b/ig,
    /\b(can)(not)\b/ig,
    /\b(D)('ye)\b/ig,
    /\b(Gim)(me)\b/ig,
    /\b(Gon)(na)\b/ig,
    /\b(Got)(ta)\b/ig,
    /\b(Lem)(me)\b/ig,
    /\b(Mor)('n)\b/ig,
    /\b(T)(is)\b/ig,
    /\b(T)(was)\b/ig,
    /\b(Wan)(na)\b/ig];

var contractions3 = [
    /\b(Whad)(dd)(ya)\b/ig,
    /\b(Wha)(t)(cha)\b/ig
];

var TreebankWordTokenizer = function() {
};

util.inherits(TreebankWordTokenizer, Tokenizer);

TreebankWordTokenizer.prototype.tokenize = function(text) {
    contractions2.forEach(function(regexp) {
	text = text.replace(regexp,"$1 $2");
    });
    
    contractions3.forEach(function(regexp) {
	text = text.replace(regexp,"$1 $2 $3");
    });

    // most punctuation
    text = text.replace(/([^\w\.\'\-\/\+\<\>,&])/g, " $1 ");

    // commas if followed by space
    text = text.replace(/(,\s)/g, " $1");

    // single quotes if followed by a space
    text = text.replace(/('\s)/g, " $1");

    // periods before newline or end of string
    text = text.replace(/\. *(\n|$)/g, " . ");
    
    return  _.without(text.split(/\s+/), '');	
};

module.exports = TreebankWordTokenizer;

},{"./tokenizer":109,"underscore":147,"util":149}],112:[function(require,module,exports){
/*
 Copyright (c) 2012, Guillaume Marty

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
 * A transliteration of Katakana & Hiragana to roman characters using the
 * modified Hepburn system.
 * Rules based on CLDR transform rule set `Katakana-Latin-BGN.xml` but with
 * several bugs fixed:
 *  * Missing ū
 *  * Missing tsu + voiced kana
 *  * typos on my~ transliterations
 *  * support for long vowel sign
 *  * support for final small tsu
 *  * support for u + small vowels
 *  * support for su/shi/ji + small vowels
 *  * support for tchi/tsu/te/to + small vowels
 *  * support for fu + small vowels
 *  * support for katakana middle dot
 *
 * \@todo Take iteration marks into account.
 */

var replacer = require('../../util/utils').replacer;

var transliterationTable1 = {
  'ウァ': 'wa', // KATAKANA LETTER U + SMALL A
  'ウィ': 'wi', // KATAKANA LETTER U + SMALL I
  'ウェ': 'we', // KATAKANA LETTER U + SMALL E
  'ウォ': 'wo', // KATAKANA LETTER U + SMALL O
  'ウー': 'ū', // KATAKANA LETTER VU + PROLONGED SOUND MARK

  'ヴァ': 'va', // KATAKANA LETTER VU + SMALL A
  'ヴィ': 'vi', // KATAKANA LETTER VU + SMALL I
  'ヴェ': 've', // KATAKANA LETTER VU + SMALL E
  'ヴォ': 'vo', // KATAKANA LETTER VU + SMALL O
  'ヴュ': 'vyu', // KATAKANA LETTER VU + SMALL YU

  'うぁ': 'wa', // HIRAGANA LETTER U + SMALL A
  'うぃ': 'wi', // HIRAGANA LETTER U + SMALL I
  'うぇ': 'we', // HIRAGANA LETTER U + SMALL E
  'うぉ': 'wo', // HIRAGANA LETTER U + SMALL O
  'うー': 'ū', // HIRAGANA LETTER VU + PROLONGED SOUND MARK

  'ゔぁ': 'va', // HIRAGANA LETTER VU + SMALL A
  'ゔぃ': 'vi', // HIRAGANA LETTER VU + SMALL I
  'ゔぇ': 've', // HIRAGANA LETTER VU + SMALL E
  'ゔぉ': 'vo', // HIRAGANA LETTER VU + SMALL O
  'ゔゅ': 'vyu' // HIRAGANA LETTER VU + SMALL YU
};

var transliterationTable2 = {
  'イェ': 'ye', // KATAKANA LETTER I + SMALL E

  'ア': 'a', // KATAKANA LETTER A
  'イ': 'i', // KATAKANA LETTER I
  'ウウ': 'ū', // KATAKANA LETTER U + U
  'ウ': 'u', // KATAKANA LETTER U
  'エ': 'e', // KATAKANA LETTER E
  'オウ': 'ō', // KATAKANA LETTER O + U
  'オ': 'o', // KATAKANA LETTER O

  'クァ': 'kwa', // KATAKANA LETTER KU + SMALL A
  'クィ': 'kwi', // KATAKANA LETTER KU + SMALL I
  'クェ': 'kwe', // KATAKANA LETTER KU + SMALL E
  'クォ': 'kwo', // KATAKANA LETTER KU + SMALL O

  'カ': 'ka', // KATAKANA LETTER KA
  'キョウ': 'kyō', // KATAKANA LETTER KI + SMALL YO + U
  'キュウ': 'kyū', // KATAKANA LETTER KI + SMALL YU + U
  'キャ': 'kya', // KATAKANA LETTER KI + SMALL YA
  'キョ': 'kyo', // KATAKANA LETTER KI + SMALL YO
  'キュ': 'kyu', // KATAKANA LETTER KI + SMALL YU
  'キ': 'ki', // KATAKANA LETTER KI
  'ク': 'ku', // KATAKANA LETTER KU
  'ケ': 'ke', // KATAKANA LETTER KE
  'コウ': 'kō', // KATAKANA LETTER KO + U
  'コ': 'ko', // KATAKANA LETTER KO

  'シェ': 'she', // KATAKANA LETTER SI + SMALL E
  'スィ': 'si', // KATAKANA LETTER SU + SMALL I

  'サ': 'sa', // KATAKANA LETTER SA
  'ショウ': 'shō', // KATAKANA LETTER SI + SMALL YO + U
  'シュウ': 'shū', // KATAKANA LETTER SI + SMALL YU + U
  'シャ': 'sha', // KATAKANA LETTER SI + SMALL YA
  'ショ': 'sho', // KATAKANA LETTER SI + SMALL YO
  'シュ': 'shu', // KATAKANA LETTER SI + SMALL YU
  'シ': 'shi', // KATAKANA LETTER SI
  'スウ': 'sū', // KATAKANA LETTER SU + U
  'ス': 'su', // KATAKANA LETTER SU
  'セ': 'se', // KATAKANA LETTER SE
  'ソウ': 'sō', // KATAKANA LETTER SO + U
  'ソ': 'so', // KATAKANA LETTER SO

  'チェ': 'che', // KATAKANA LETTER TI + SMALL E
  'ツァ': 'tsa', // KATAKANA LETTER TU + SMALL A
  'ツィ': 'tsi', // KATAKANA LETTER TU + SMALL I
  'ツェ': 'tse', // KATAKANA LETTER TU + SMALL E
  'ツォ': 'tso', // KATAKANA LETTER TU + SMALL O
  'ティ': 'ti', // KATAKANA LETTER TE + SMALL I
  'ディ': 'di', // KATAKANA LETTER DE + SMALL I
  'テュ': 'tyu', // KATAKANA LETTER TE + SMALL YU
  'デュ': 'dyu', // KATAKANA LETTER DE + SMALL YU
  'トィ': 'twi', // KATAKANA LETTER TO + SMALL I
  'トゥ': 'tu', // KATAKANA LETTER TO + SMALL U
  'ドィ': 'dwi', // KATAKANA LETTER DO + SMALL I
  'ドゥ': 'du', // KATAKANA LETTER DO + SMALL U

  'タ': 'ta', // KATAKANA LETTER TA
  'チョウ': 'chō', // KATAKANA LETTER TI + SMALL YO + U
  'チュウ': 'chū', // KATAKANA LETTER TI + SMALL YU + U
  'チャ': 'cha', // KATAKANA LETTER TI + SMALL YA
  'チョ': 'cho', // KATAKANA LETTER TI + SMALL YO
  'チュ': 'chu', // KATAKANA LETTER TI + SMALL YU
  'チ': 'chi', // KATAKANA LETTER TI
  'ツウ': 'tsū', // KATAKANA LETTER TU + U
  'ツ': 'tsu', // KATAKANA LETTER TU
  'テ': 'te', // KATAKANA LETTER TE
  'トウ': 'tō', // KATAKANA LETTER TO + U
  'ト': 'to', // KATAKANA LETTER TO

  'ナ': 'na', // KATAKANA LETTER NA
  'ニョウ': 'nyō', // KATAKANA LETTER NI + SMALL YO + U
  'ニュウ': 'nyū', // KATAKANA LETTER NI + SMALL YU + U
  'ニャ': 'nya', // KATAKANA LETTER NI + SMALL YA
  'ニョ': 'nyo', // KATAKANA LETTER NI + SMALL YO
  'ニュ': 'nyu', // KATAKANA LETTER NI + SMALL YU
  'ニ': 'ni', // KATAKANA LETTER NI
  'ヌウ': 'nū', // KATAKANA LETTER NU + U
  'ヌ': 'nu', // KATAKANA LETTER NU
  'ネ': 'ne', // KATAKANA LETTER NE
  'ノウ': 'nō', // KATAKANA LETTER NO + U
  'ノ': 'no', // KATAKANA LETTER NO

  'ファ': 'fa', // KATAKANA LETTER HU + SMALL A
  'フィ': 'fi', // KATAKANA LETTER HU + SMALL I
  //'フゥ': 'fu', // KATAKANA LETTER HU + SMALL U
  'フェ': 'fe', // KATAKANA LETTER HU + SMALL E
  'フォ': 'fo', // KATAKANA LETTER HU + SMALL O
  'フュ': 'fyu', // KATAKANA LETTER HU + SMALL YU
  'ホェ': 'hwe', // KATAKANA LETTER HO + SMALL E

  'ハ': 'ha', // KATAKANA LETTER HA
  'ヒョウ': 'hyō', // KATAKANA LETTER HI + SMALL YO + U
  'ヒュウ': 'hyū', // KATAKANA LETTER HI + SMALL YU + U
  'ヒャ': 'hya', // KATAKANA LETTER HI + SMALL YA
  'ヒョ': 'hyo', // KATAKANA LETTER HI + SMALL YO
  'ヒュ': 'hyu', // KATAKANA LETTER HI + SMALL YU
  'ヒ': 'hi', // KATAKANA LETTER HI
  'フウ': 'fū', // KATAKANA LETTER HU + U
  'フ': 'fu', // KATAKANA LETTER HU
  'ヘ': 'he', // KATAKANA LETTER HE
  'ホウ': 'hō', // KATAKANA LETTER HO + U
  'ホ': 'ho', // KATAKANA LETTER HO

  'マ': 'ma', // KATAKANA LETTER MA
  'ミョウ': 'myō', // KATAKANA LETTER MI + SMALL YO + U
  'ミュウ': 'myū', // KATAKANA LETTER MI + SMALL YU + U
  'ミャ': 'mya', // KATAKANA LETTER MI + SMALL YA
  'ミョ': 'myo', // KATAKANA LETTER MI + SMALL YO
  'ミュ': 'myu', // KATAKANA LETTER MI + SMALL YU
  'ミ': 'mi', // KATAKANA LETTER MI
  'ムウ': 'mū', // KATAKANA LETTER MU + U
  'ム': 'mu', // KATAKANA LETTER MU
  'メ': 'me', // KATAKANA LETTER ME
  'モウ': 'mō', // KATAKANA LETTER MO + U
  'モ': 'mo', // KATAKANA LETTER MO

  'ヤ': 'ya', // KATAKANA LETTER YA
  'ユウ': 'yū', // KATAKANA LETTER YU + U
  'ユ': 'yu', // KATAKANA LETTER YU
  'ヨウ': 'yō', // KATAKANA LETTER YO + U
  'ヨ': 'yo', // KATAKANA LETTER YO

  'リェ': 'rye', // KATAKANA LETTER RI + SMALL E

  'ラ': 'ra', // KATAKANA LETTER RA
  'リョウ': 'ryō', // KATAKANA LETTER RI + SMALL YO + U
  'リュウ': 'ryū', // KATAKANA LETTER RI + SMALL YU + U
  'リャ': 'rya', // KATAKANA LETTER RI + SMALL YA
  'リョ': 'ryo', // KATAKANA LETTER RI + SMALL YO
  'リュ': 'ryu', // KATAKANA LETTER RI + SMALL YU
  'リ': 'ri', // KATAKANA LETTER RI
  'ルウ': 'rū', // KATAKANA LETTER RU + U
  'ル': 'ru', // KATAKANA LETTER RU
  'レ': 're', // KATAKANA LETTER RE
  'ロウ': 'rō', // KATAKANA LETTER RO + U
  'ロ': 'ro', // KATAKANA LETTER RO

  'ワ': 'wa', // KATAKANA LETTER WA
  'ヰ': 'i', // KATAKANA LETTER WI
  'ヱ': 'e', // KATAKANA LETTER WE
  'ヲ': 'o', // KATAKANA LETTER WO

  'ン': 'n', // KATAKANA LETTER N

  'グァ': 'gwa', // KATAKANA LETTER GU + SMALL A
  'グィ': 'gwi', // KATAKANA LETTER GU + SMALL I
  'グェ': 'gwe', // KATAKANA LETTER GU + SMALL E
  'グォ': 'gwo', // KATAKANA LETTER GU + SMALL O

  'ガ': 'ga', // KATAKANA LETTER GA
  'ギョウ': 'gyō', // KATAKANA LETTER GI + SMALL YO + U
  'ギュウ': 'gyū', // KATAKANA LETTER GI + SMALL YU + U
  'ギャ': 'gya', // KATAKANA LETTER GI + SMALL YA
  'ギョ': 'gyo', // KATAKANA LETTER GI + SMALL YO
  'ギュ': 'gyu', // KATAKANA LETTER GI + SMALL YU
  'ギ': 'gi', // KATAKANA LETTER GI
  'グウ': 'gū', // KATAKANA LETTER GU + U
  'グ': 'gu', // KATAKANA LETTER GU
  'ゲ': 'ge', // KATAKANA LETTER GE
  'ゴウ': 'gō', // KATAKANA LETTER GO + U
  'ゴ': 'go', // KATAKANA LETTER GO

  'ジェ': 'je', // KATAKANA LETTER ZI + SMALL E
  'ズィ': 'zi', // KATAKANA LETTER ZU + SMALL I

  'ザ': 'za', // KATAKANA LETTER ZA
  'ジョウ': 'jō', // KATAKANA LETTER ZI + SMALL YO + U
  'ジュウ': 'jū', // KATAKANA LETTER ZI + SMALL YU + U
  'ジャ': 'ja', // KATAKANA LETTER ZI + SMALL YA
  'ジョ': 'jo', // KATAKANA LETTER ZI + SMALL YO
  'ジュ': 'ju', // KATAKANA LETTER ZI + SMALL YU
  'ジ': 'ji', // KATAKANA LETTER ZI
  'ズウ': 'zū', // KATAKANA LETTER ZU + U
  'ズ': 'zu', // KATAKANA LETTER ZU
  'ゼ': 'ze', // KATAKANA LETTER ZE
  'ゾウ': 'zō', // KATAKANA LETTER ZO + U
  'ゾ': 'zo', // KATAKANA LETTER ZO

  'ダ': 'da', // KATAKANA LETTER DA
  'ヂ': 'ji', // KATAKANA LETTER DI
  'ヅウ': 'zū', // KATAKANA LETTER DU + U
  'ヅ': 'zu', // KATAKANA LETTER DU
  'デ': 'de', // KATAKANA LETTER DE
  'ドウ': 'dō', // KATAKANA LETTER DO + U
  'ド': 'do', // KATAKANA LETTER DO

  'ブュ': 'byu', // KATAKANA LETTER BU + SMALL YU

  'バ': 'ba', // KATAKANA LETTER BA
  'ビョウ': 'byō', // KATAKANA LETTER BI + SMALL YO + U
  'ビュウ': 'byū', // KATAKANA LETTER BI + SMALL YU + U
  'ビャ': 'bya', // KATAKANA LETTER BI + SMALL YA
  'ビョ': 'byo', // KATAKANA LETTER BI + SMALL YO
  'ビュ': 'byu', // KATAKANA LETTER BI + SMALL YU
  'ビ': 'bi', // KATAKANA LETTER BI
  'ブウ': 'bū', // KATAKANA LETTER BU + U
  'ブ': 'bu', // KATAKANA LETTER BU
  'ベ': 'be', // KATAKANA LETTER BE
  'ボウ': 'bō', // KATAKANA LETTER BO + U
  'ボ': 'bo', // KATAKANA LETTER BO

  'パ': 'pa', // KATAKANA LETTER PA
  'ピョウ': 'pyō', // KATAKANA LETTER PI + SMALL YO + U
  'ピュウ': 'pyū', // KATAKANA LETTER PI + SMALL YU + U
  'ピャ': 'pya', // KATAKANA LETTER PI + SMALL YA
  'ピョ': 'pyo', // KATAKANA LETTER PI + SMALL YO
  'ピュ': 'pyu', // KATAKANA LETTER PI + SMALL YU
  'ピ': 'pi', // KATAKANA LETTER PI
  'プウ': 'pū', // KATAKANA LETTER PU + U
  'プ': 'pu', // KATAKANA LETTER PU
  'ペ': 'pe', // KATAKANA LETTER PE
  'ポウ': 'pō', // KATAKANA LETTER PO + U
  'ポ': 'po', // KATAKANA LETTER PO

  'ヴ': 'v', // KATAKANA LETTER VU

  '・': ' ', // KATAKANA MIDDLE DOT

  'いぇ': 'ye', // HIRAGANA LETTER I + SMALL E

  'あ': 'a', // HIRAGANA LETTER A
  'い': 'i', // HIRAGANA LETTER I
  'うう': 'ū', // HIRAGANA LETTER U + U
  'う': 'u', // HIRAGANA LETTER U
  'え': 'e', // HIRAGANA LETTER E
  'おう': 'ō', // HIRAGANA LETTER O + U
  'お': 'o', // HIRAGANA LETTER O

  'くぁ': 'kwa', // HIRAGANA LETTER KU + SMALL A
  'くぃ': 'kwi', // HIRAGANA LETTER KU + SMALL I
  'くぇ': 'kwe', // HIRAGANA LETTER KU + SMALL E
  'くぉ': 'kwo', // HIRAGANA LETTER KU + SMALL O

  'か': 'ka', // HIRAGANA LETTER KA
  'きょう': 'kyō', // HIRAGANA LETTER KI + SMALL YO + U
  'きゅう': 'kyū', // HIRAGANA LETTER KI + SMALL YU + U
  'きゃ': 'kya', // HIRAGANA LETTER KI + SMALL YA
  'きょ': 'kyo', // HIRAGANA LETTER KI + SMALL YO
  'きゅ': 'kyu', // HIRAGANA LETTER KI + SMALL YU
  'き': 'ki', // HIRAGANA LETTER KI
  'くう': 'kū', // HIRAGANA LETTER KU + U
  'く': 'ku', // HIRAGANA LETTER KU
  'け': 'ke', // HIRAGANA LETTER KE
  'こう': 'kō', // HIRAGANA LETTER KO + U
  'こ': 'ko', // HIRAGANA LETTER KO

  'しぇ': 'she', // HIRAGANA LETTER SI + SMALL E
  'すぃ': 'si', // HIRAGANA LETTER SU + SMALL I

  'さ': 'sa', // HIRAGANA LETTER SA
  'しょう': 'shō', // HIRAGANA LETTER SI + SMALL YO + U
  'しゅう': 'shū', // HIRAGANA LETTER SI + SMALL YU + U
  'しゃ': 'sha', // HIRAGANA LETTER SI + SMALL YA
  'しょ': 'sho', // HIRAGANA LETTER SI + SMALL YO
  'しゅ': 'shu', // HIRAGANA LETTER SI + SMALL YU
  'し': 'shi', // HIRAGANA LETTER SI
  'すう': 'sū', // HIRAGANA LETTER SU + U
  'す': 'su', // HIRAGANA LETTER SU
  'せ': 'se', // HIRAGANA LETTER SE
  'そう': 'sō', // HIRAGANA LETTER SO + U
  'そ': 'so', // HIRAGANA LETTER SO

  'ちぇ': 'che', // HIRAGANA LETTER TI + SMALL E
  'つぁ': 'tsa', // HIRAGANA LETTER TU + SMALL A
  'つぃ': 'tsi', // HIRAGANA LETTER TU + SMALL I
  'つぇ': 'tse', // HIRAGANA LETTER TU + SMALL E
  'つぉ': 'tso', // HIRAGANA LETTER TU + SMALL O
  'てぃ': 'ti', // HIRAGANA LETTER TE + SMALL I
  'でぃ': 'di', // HIRAGANA LETTER DE + SMALL I
  'てゅ': 'tyu', // HIRAGANA LETTER TE + SMALL YU
  'でゅ': 'dyu', // HIRAGANA LETTER DE + SMALL YU
  'とぃ': 'twi', // HIRAGANA LETTER TO + SMALL I
  'とぅ': 'tu', // HIRAGANA LETTER TO + SMALL U
  'どぃ': 'dwi', // HIRAGANA LETTER DO + SMALL I
  'どぅ': 'du', // HIRAGANA LETTER DO + SMALL U

  'た': 'ta', // HIRAGANA LETTER TA
  'ちょう': 'chō', // HIRAGANA LETTER TI + SMALL YO + U
  'ちゅう': 'chū', // HIRAGANA LETTER TI + SMALL YU + U
  'ちゃ': 'cha', // HIRAGANA LETTER TI + SMALL YA
  'ちょ': 'cho', // HIRAGANA LETTER TI + SMALL YO
  'ちゅ': 'chu', // HIRAGANA LETTER TI + SMALL YU
  'ち': 'chi', // HIRAGANA LETTER TI
  'つう': 'tsū', // HIRAGANA LETTER TU + U
  'つ': 'tsu', // HIRAGANA LETTER TU
  'て': 'te', // HIRAGANA LETTER TE
  'とう': 'tō', // HIRAGANA LETTER TO + U
  'と': 'to', // HIRAGANA LETTER TO

  'な': 'na', // HIRAGANA LETTER NA
  'にょう': 'nyō', // HIRAGANA LETTER NI + SMALL YO + U
  'にゅう': 'nyū', // HIRAGANA LETTER NI + SMALL YU + U
  'にゃ': 'nya', // HIRAGANA LETTER NI + SMALL YA
  'にょ': 'nyo', // HIRAGANA LETTER NI + SMALL YO
  'にゅ': 'nyu', // HIRAGANA LETTER NI + SMALL YU
  'に': 'ni', // HIRAGANA LETTER NI
  'ぬう': 'nū', // HIRAGANA LETTER NU + U
  'ぬ': 'nu', // HIRAGANA LETTER NU
  'ね': 'ne', // HIRAGANA LETTER NE
  'のう': 'nō', // HIRAGANA LETTER NO + U
  'の': 'no', // HIRAGANA LETTER NO

  'ふぁ': 'fa', // HIRAGANA LETTER HU + SMALL A
  'ふぃ': 'fi', // HIRAGANA LETTER HU + SMALL I
  //'ふぅ': 'fu', // HIRAGANA LETTER HU + SMALL U
  'ふぇ': 'fe', // HIRAGANA LETTER HU + SMALL E
  'ふぉ': 'fo', // HIRAGANA LETTER HU + SMALL O
  'ふゅ': 'fyu', // HIRAGANA LETTER HU + SMALL YU
  'ほぇ': 'hwe', // HIRAGANA LETTER HO + SMALL E

  'は': 'ha', // HIRAGANA LETTER HA
  'ひょう': 'hyō', // HIRAGANA LETTER HI + SMALL YO + U
  'ひゅう': 'hyū', // HIRAGANA LETTER HI + SMALL YU + U
  'ひゃ': 'hya', // HIRAGANA LETTER HI + SMALL YA
  'ひょ': 'hyo', // HIRAGANA LETTER HI + SMALL YO
  'ひゅ': 'hyu', // HIRAGANA LETTER HI + SMALL YU
  'ひ': 'hi', // HIRAGANA LETTER HI
  'ふう': 'fū', // HIRAGANA LETTER HU + U
  'ふ': 'fu', // HIRAGANA LETTER HU
  'へ': 'he', // HIRAGANA LETTER HE
  'ほう': 'hō', // HIRAGANA LETTER HO + U
  'ほ': 'ho', // HIRAGANA LETTER HO

  'ま': 'ma', // HIRAGANA LETTER MA
  'みょう': 'myō', // HIRAGANA LETTER MI + SMALL YO + U
  'みゅう': 'myū', // HIRAGANA LETTER MI + SMALL YU + U
  'みゃ': 'mya', // HIRAGANA LETTER MI + SMALL YA
  'みょ': 'myo', // HIRAGANA LETTER MI + SMALL YO
  'みゅ': 'myu', // HIRAGANA LETTER MI + SMALL YU
  'み': 'mi', // HIRAGANA LETTER MI
  'むう': 'mū', // HIRAGANA LETTER MU + U
  'む': 'mu', // HIRAGANA LETTER MU
  'め': 'me', // HIRAGANA LETTER ME
  'もう': 'mō', // HIRAGANA LETTER MO + U
  'も': 'mo', // HIRAGANA LETTER MO

  'や': 'ya', // HIRAGANA LETTER YA
  'ゆう': 'yū', // HIRAGANA LETTER YU + U
  'ゆ': 'yu', // HIRAGANA LETTER YU
  'よう': 'yō', // HIRAGANA LETTER YO + U
  'よ': 'yo', // HIRAGANA LETTER YO

  'りぇ': 'rye', // HIRAGANA LETTER RI + SMALL E

  'ら': 'ra', // HIRAGANA LETTER RA
  'りょう': 'ryō', // HIRAGANA LETTER RI + SMALL YO + U
  'りゅう': 'ryū', // HIRAGANA LETTER RI + SMALL YU + U
  'りゃ': 'rya', // HIRAGANA LETTER RI + SMALL YA
  'りょ': 'ryo', // HIRAGANA LETTER RI + SMALL YO
  'りゅ': 'ryu', // HIRAGANA LETTER RI + SMALL YU
  'り': 'ri', // HIRAGANA LETTER RI
  'るう': 'rū', // HIRAGANA LETTER RU + U
  'る': 'ru', // HIRAGANA LETTER RU
  'れ': 're', // HIRAGANA LETTER RE
  'ろう': 'rō', // HIRAGANA LETTER RO + U
  'ろ': 'ro', // HIRAGANA LETTER RO

  'わ': 'wa', // HIRAGANA LETTER WA
  'ゐ': 'i', // HIRAGANA LETTER WI
  'ゑ': 'e', // HIRAGANA LETTER WE
  'を': 'o', // HIRAGANA LETTER WO

  'ん': 'n', // HIRAGANA LETTER N

  'ぐぁ': 'gwa', // HIRAGANA LETTER GU + SMALL A
  'ぐぃ': 'gwi', // HIRAGANA LETTER GU + SMALL I
  'ぐぇ': 'gwe', // HIRAGANA LETTER GU + SMALL E
  'ぐぉ': 'gwo', // HIRAGANA LETTER GU + SMALL O

  'が': 'ga', // HIRAGANA LETTER GA
  'ぎょう': 'gyō', // HIRAGANA LETTER GI + SMALL YO + U
  'ぎゅう': 'gyū', // HIRAGANA LETTER GI + SMALL YU + U
  'ぎゃ': 'gya', // HIRAGANA LETTER GI + SMALL YA
  'ぎょ': 'gyo', // HIRAGANA LETTER GI + SMALL YO
  'ぎゅ': 'gyu', // HIRAGANA LETTER GI + SMALL YU
  'ぎ': 'gi', // HIRAGANA LETTER GI
  'ぐう': 'gū', // HIRAGANA LETTER GU + U
  'ぐ': 'gu', // HIRAGANA LETTER GU
  'げ': 'ge', // HIRAGANA LETTER GE
  'ごう': 'gō', // HIRAGANA LETTER GO + U
  'ご': 'go', // HIRAGANA LETTER GO

  'じぇ': 'je', // HIRAGANA LETTER ZI + SMALL E
  'ずぃ': 'zi', // HIRAGANA LETTER ZU + SMALL I

  'ざ': 'za', // HIRAGANA LETTER ZA
  'じょう': 'jō', // HIRAGANA LETTER ZI + SMALL YO + U
  'じゅう': 'jū', // HIRAGANA LETTER ZI + SMALL YU + U
  'じゃ': 'ja', // HIRAGANA LETTER ZI + SMALL YA
  'じょ': 'jo', // HIRAGANA LETTER ZI + SMALL YO
  'じゅ': 'ju', // HIRAGANA LETTER ZI + SMALL YU
  'じ': 'ji', // HIRAGANA LETTER ZI
  'ずう': 'zū', // HIRAGANA LETTER ZU + U
  'ず': 'zu', // HIRAGANA LETTER ZU
  'ぜ': 'ze', // HIRAGANA LETTER ZE
  'ぞう': 'zō', // HIRAGANA LETTER ZO + U
  'ぞ': 'zo', // HIRAGANA LETTER ZO

  'だ': 'da', // HIRAGANA LETTER DA
  'ぢ': 'ji', // HIRAGANA LETTER DI
  'づう': 'zū', // HIRAGANA LETTER DU + U
  'づ': 'zu', // HIRAGANA LETTER DU
  'で': 'de', // HIRAGANA LETTER DE
  'どう': 'dō', // HIRAGANA LETTER DO + U
  'ど': 'do', // HIRAGANA LETTER DO

  'ぶゅ': 'byu', // HIRAGANA LETTER BU + SMALL YU

  'ば': 'ba', // HIRAGANA LETTER BA
  'びょう': 'byō', // HIRAGANA LETTER BI + SMALL YO + U
  'びゅう': 'byū', // HIRAGANA LETTER BI + SMALL YU + U
  'びゃ': 'bya', // HIRAGANA LETTER BI + SMALL YA
  'びょ': 'byo', // HIRAGANA LETTER BI + SMALL YO
  'びゅ': 'byu', // HIRAGANA LETTER BI + SMALL YU
  'び': 'bi', // HIRAGANA LETTER BI
  'ぶう': 'bū', // HIRAGANA LETTER BU + U
  'ぶ': 'bu', // HIRAGANA LETTER BU
  'べ': 'be', // HIRAGANA LETTER BE
  'ぼう': 'bō', // HIRAGANA LETTER BO + U
  'ぼ': 'bo', // HIRAGANA LETTER BO

  'ぱ': 'pa', // HIRAGANA LETTER PA
  'ぴょう': 'pyō', // HIRAGANA LETTER PI + SMALL YO + U
  'ぴゅう': 'pyū', // HIRAGANA LETTER PI + SMALL YU + U
  'ぴゃ': 'pya', // HIRAGANA LETTER PI + SMALL YA
  'ぴょ': 'pyo', // HIRAGANA LETTER PI + SMALL YO
  'ぴゅ': 'pyu', // HIRAGANA LETTER PI + SMALL YU
  'ぴ': 'pi', // HIRAGANA LETTER PI
  'ぷう': 'pū', // HIRAGANA LETTER PU + U
  'ぷ': 'pu', // HIRAGANA LETTER PU
  'ぺ': 'pe', // HIRAGANA LETTER PE
  'ぽう': 'pō', // HIRAGANA LETTER PO + U
  'ぽ': 'po', // HIRAGANA LETTER PO

  'ゔ': 'v' // HIRAGANA LETTER VU
};

var transliterationTable3 = {
  'aァ': 'ā',
  'aぁ': 'ā',
  'iィー': 'ī',
  'iィ': 'ī',
  'iぃー': 'ī',
  'iぃ': 'ī',
  'aー': 'ā',
  'iー': 'ī',
  'uー': 'ū',
  'eー': 'ē',
  'oー': 'ō',

  // Fallback for small vowels
  'ァ': 'a',
  'ィ': 'i',
  'ゥ': 'u',
  'ェ': 'e',
  'ォ': 'o',
  'ぁ': 'a',
  'ぃ': 'i',
  'ぅ': 'u',
  'ぇ': 'e',
  'ぉ': 'o'
};

var replace1 = replacer(transliterationTable1);
var replace2 = replacer(transliterationTable2);
var replace3 = replacer(transliterationTable3);

module.exports = function(str) {
  str = replace1(str);

  str = str
    .replace(/ッ(?=[ン])/g, 'n')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[ん])/g, 'n')// HIRAGANA LETTER SMALL TU
    .replace(/ン(?=[バビブベボパピプペポマミムメモ])/g, 'm')// KATAKANA LETTER N
    .replace(/ん(?=[ばびぶべぼぱぴぷぺぽまみむめも])/g, 'm')// HIRAGANA LETTER N
    .replace(/ン(?=[ヤユヨアイウエオ])/g, "n'")// KATAKANA LETTER N
    .replace(/ん(?=[やゆよあいうえお])/g, "n'");// HIRAGANA LETTER N
  str = str
    .replace(/ッ(?=[カキクケコ])/g, 'k')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[かきくけこ])/g, 'k')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[ガギグゲゴ])/g, 'g')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[がぎぐげご])/g, 'g')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[サシスセソ])/g, 's')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[さしすせそ])/g, 's')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[ザズゼゾ])/g, 'z')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[ざずぜぞ])/g, 'z')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[ジ])/g, 'j')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[じ])/g, 'j')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[タチツテト])/g, 't')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[たちつてと])/g, 't')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[ダヂヅデド])/g, 't')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[だぢづでど])/g, 't')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[ハヒヘホ])/g, 'h')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[はひへほ])/g, 'h')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[フ])/g, 'f')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[ふ])/g, 'f')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[バビブベボ])/g, 'b')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[ばびぶべぼ])/g, 'b')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[パピプペポ])/g, 'p')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[ぱぴぷぺぽ])/g, 'p')// HIRAGANA LETTER SMALL TU
    .replace(/ッ(?=[ラリルレロ])/g, 'r')// KATAKANA LETTER SMALL TU
    .replace(/っ(?=[らりるれろ])/g, 'r');// HIRAGANA LETTER SMALL TU

  str = replace2(str);
  str = replace3(str);

  str = str
    .replace(/(ッ|っ)\B/g, 't');// FINAL KATAKANA LETTER SMALL TU

  return str;
};

},{"../../util/utils":128}],113:[function(require,module,exports){
/*
Copyright (c) 2014 Ken Koch

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
 * The basis of the TRIE structure.
 **/
function Trie(caseSensitive) {
	this.dictionary = {};
	this.$ = false;

	if(typeof caseSensitive === "undefined") {
		caseSensitive = true;
	}

	this.cs = caseSensitive;
}

/**
 * Add a single string to the TRIE, returns true if the word was already in the 
 * trie.
 **/
Trie.prototype.addString = function(string) {
	if(this.cs === false) {
		string = string.toLowerCase();
	}

	// If the string has only one letter, mark this as a word.
	if(string.length === 0) {
		var wasWord = this.$;
		this.$ = true;
		return wasWord;
	}

	// Make sure theres a Trie node in our dictionary
	var next = this.dictionary[string[0]];

	if(!next) {
		this.dictionary[string[0]] = new Trie(this.cs);
		next = this.dictionary[string[0]];
	}

	// Continue adding the string
	return next.addString(string.substring(1));
};

/**
 * Add multiple strings to the TRIE
 **/
Trie.prototype.addStrings = function(list) {
	for(var i in list) {
		this.addString(list[i]);
	}
};

/**
 * A function to search the TRIE and return an array of
 * words which have same prefix <prefix>
 * for example if we had the following words in our database:
 * a, ab, bc, cd, abc, abd
 * and we search the string: a
 * we will get :
 * [a, ab, abc, abd]
 **/
Trie.prototype.keysWithPrefix = function(prefix) {
    if(this.caseSensitive === false) {
        prefix = prefix.toLowerCase();
    }

    function isEmpty (object) {
        for (var key in object) if (object.hasOwnProperty(key)) return false;
        return true;
    }

    function get (node, word) {
        if(!node) return null;
        if(word.length == 0) return node;
        return get(node.dictionary[word[0]], word.substring(1));
    }

    function recurse ( node, stringAgg, resultsAgg) {
        if (!node) return;

        // Check if this is a word
        if (node.$) {
            resultsAgg.push(stringAgg);
        }

        if (isEmpty(node.dictionary)) {
            return ;
        }

        for (var c in node.dictionary) {
            recurse (node.dictionary[c],stringAgg + c, resultsAgg);
        }
    }

    var results = [];
    recurse (get(this, prefix), prefix, results);
    return results;
};

/** 
 * A function to search the given string and return true if it lands
 * on on a word. Essentially testing if the word exists in the database.
 **/
Trie.prototype.contains = function(string) {
	if(this.cs === false) {
		string = string.toLowerCase();
	}

	if(string.length === 0) {
		return this.$;
	}

	// Otherwise, we need to continue searching
	var firstLetter = string[0];
	var next = this.dictionary[firstLetter];		

	// If we don't have a node, this isn't a word
	if(!next) {
		return false;
	}

	// Otherwise continue the search at the next node
	return next.contains(string.substring(1));
}

/**
 * A function to search the TRIE and return an array of words which were encountered along the way.
 * This will only return words with full prefix matches.
 * for example if we had the following words in our database:
 * a, ab, bc, cd, abc
 * and we searched the string: abcd
 * we would get only:
 * [a, ab, abc]
 **/
Trie.prototype.findMatchesOnPath = function(search) {
	if(this.cs === false) {
		search = search.toLowerCase();
	}

	function recurse(node, search, stringAgg, resultsAgg) {
		// Check if this is a word.
		if(node.$) {
			resultsAgg.push(stringAgg);
		}

		// Check if the have completed the seearch
		if(search.length === 0) {
			return resultsAgg;
		}

		// Otherwise, continue searching
		var next = node.dictionary[search[0]];
		if(!next) {
			return resultsAgg;
		}
		return recurse(next, search.substring(1), stringAgg + search[0], resultsAgg);
	};

	return recurse(this, search, "", []);
};

/**
 * Returns the longest match and the remaining part that could not be matched.
 * inspired by [NLTK containers.trie.find_prefix](http://nltk.googlecode.com/svn-/trunk/doc/api/nltk.containers.Trie-class.html).
 **/
Trie.prototype.findPrefix = function(search) {
	if(this.cs === false) {
		search = search.toLowerCase();
	}
	
	function recurse(node, search, stringAgg, lastWord) {
		// Check if this is a word
		if(node.$) {
			lastWord = stringAgg;
		}

		// Check if we have no more to search
		if(search.length === 0) {
			return [lastWord, search];
		}

		// Continue searching
		var next = node.dictionary[search[0]];
		if(!next) {
			return [lastWord, search];
		}
		return recurse(next, search.substring(1), stringAgg + search[0], lastWord);
	};

	return recurse(this, search, "", null);
};

/**
 * Computes the number of actual nodes from this node to the end.
 * Note: This involves traversing the entire structure and may not be
 * good for frequent use.
 **/
Trie.prototype.getSize = function() { 
	var total = 1;
	for(var c in this.dictionary) {
		total += this.dictionary[c].getSize();
	}
	return total;
};

/**
 * EXPORT THE TRIE
 **/
module.exports = Trie;

},{}],114:[function(require,module,exports){
/*
 Copyright (c) 2014, Lee Wenzhu

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
'use strict';

function Bag() {
    this.dictionary = [];
    this.nElement = 0;
};

Bag.prototype.add = function(element) {
    this.dictionary.push(element);
    return this;
};

Bag.prototype.isEmpty = function() {
    return this.nElement > 0;
};

Bag.prototype.contains = function(item) {
    return this.dictionary.indexOf(item) >= 0;
};

/**
 * unpack the bag , and get all items
 */
Bag.prototype.unpack = function() {
    // return a copy is better than original
    return this.dictionary.slice();
};

module.exports = Bag;

},{}],115:[function(require,module,exports){
/*
 Copyright (c) 2014, Lee Wenzhu

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
'use strict';

var util = require('util'),
    Bag = require('./bag');

var DirectedEdge = function(start, end, weight) {
    this.start = start;
    this.end = end;
    this.weight = weight;
};

DirectedEdge.prototype.weight = function() {
    return this.weight;
};

DirectedEdge.prototype.from = function() {
    return this.start;
};

DirectedEdge.prototype.to = function() {
    return this.end;
};

DirectedEdge.prototype.toString = function() {
    return util.format('%s -> %s, %s', this.start, this.end, this.weight);
};

var EdgeWeightedDigraph = function() {
    this.edgesNum = 0;
    this.adj = []; // adjacency list
};

/**
 * the number of vertexs saved.
 */
EdgeWeightedDigraph.prototype.v = function() {
    return this.adj.length;
};

/**
 * the number of edges saved.
 */
EdgeWeightedDigraph.prototype.e = function() {
    return this.edgesNum;
};

EdgeWeightedDigraph.prototype.add = function(start, end, weight) {
    var e = new DirectedEdge(start, end, weight);
    this.addEdge(e);
};

EdgeWeightedDigraph.prototype.addEdge = function(e) {
    if(!this.adj[e.from()]) {
        this.adj[e.from()] = new Bag();
    }
    this.adj[e.from()].add(e);
    this.edgesNum++;
};

/**
 * use callback on all edges from v.
 */
EdgeWeightedDigraph.prototype.getAdj = function(v) {
    if(!this.adj[v]) return [];
    return this.adj[v].unpack();
};

/**
 * use callback on all edges.
 */
EdgeWeightedDigraph.prototype.edges = function() {
    var adj = this.adj;
    var list = new Bag();
    for(var i in adj) {
        adj[i].unpack().forEach(function(item) {
            list.add(item);
        });
    }
    return list.unpack();
};

EdgeWeightedDigraph.prototype.toString = function() {
    var result = [];
    var list = this.edges();
    list.forEach(function(edge) {
        result.push(edge.toString());
    });
    return result.join('\n');
};

module.exports = EdgeWeightedDigraph;

},{"./bag":114,"util":149}],116:[function(require,module,exports){
/*
 Copyright (c) 2014, Lee Wenzhu

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
'use strict';

var EdgeWeightedDigraph = require('./edge_weighted_digraph'),
    Topological = require('./topological');

/**
  *  The LongestPathTree represents a data type for solving the
  *  single-source longest paths problem in edge-weighted directed
  *  acyclic graphs (DAGs). The edge weights can be positive, negative, or zero.
  *  This implementation uses a topological-sort based algorithm.
  *  the distTo() and hasPathTo() methods take
  *  constant time and the pathTo() method takes time proportional to the
  *  number of edges in the longest path returned.
  */
var LongestPathTree = function(digraph, start) {
    var _this = this;
    this.edgeTo = [];
    this.distTo = [];
    this.distTo[start] = 0.0;
    this.start = start;
    this.top = new Topological(digraph);
    this.top.order().forEach(function(vertex){
        _this.relaxVertex(digraph, vertex, _this);
    });
};

LongestPathTree.prototype.relaxEdge = function(e) {
    var distTo = this.distTo,
        edgeTo = this.edgeTo;
    var v = e.from(), w = e.to();
    if (distTo[w] < distTo[v] + e.weight) {
        distTo[w] = distTo[v] + e.weight;
        edgeTo[w] = e;
    }
};

/**
 * relax a vertex v in the specified digraph g
 * @param {EdgeWeightedDigraph} the apecified digraph
 * @param {Vertex} v vertex to be relaxed
 */
LongestPathTree.prototype.relaxVertex = function(digraph, vertex, tree) {
    var distTo = tree.distTo;
    var edgeTo = tree.edgeTo;

    digraph.getAdj(vertex).forEach(function(edge){
        var w = edge.to();
        distTo[w] = distTo[w] || 0.0;
        distTo[vertex] = distTo[vertex] || 0.0;
        if (distTo[w] < distTo[vertex] + edge.weight) {
            // in case of the result of 0.28+0.34 is 0.62000001
            distTo[w] = parseFloat((distTo[vertex] + edge.weight).toFixed(2));
            edgeTo[w] = edge;
        }
    });

};

LongestPathTree.prototype.getDistTo = function(v) {
    return this.distTo[v];
};

LongestPathTree.prototype.hasPathTo = function(v) {
    return !!this.distTo[v];
};

LongestPathTree.prototype.pathTo = function(v) {
    if (!this.hasPathTo(v)) return [];
    var path = [];
    var edgeTo = this.edgeTo;
    for (var e = edgeTo[v]; !!e; e = edgeTo[e.from()]) {
        path.push(e.to());
    }
    path.push(this.start);
    return path.reverse();
};

module.exports = LongestPathTree;

},{"./edge_weighted_digraph":115,"./topological":127}],117:[function(require,module,exports){
/*
 Copyright (c) 2014, Lee Wenzhu

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
'use strict';

var EdgeWeightedDigraph = require('./edge_weighted_digraph'),
    Topological = require('./topological');

/**
  *  The ShortestPathTree represents a data type for solving the
  *  single-source shortest paths problem in edge-weighted directed
  *  acyclic graphs (DAGs). The edge weights can be positive, negative, or zero.
  *  This implementation uses a topological-sort based algorithm.
  *  the distTo() and hasPathTo() methods take
  *  constant time and the pathTo() method takes time proportional to the
  *  number of edges in the longest path returned.
  */
var ShortestPathTree = function(digraph, start) {
    var _this = this;
    this.edgeTo = [];
    this.distTo = [];
    this.distTo[start] = 0.0;
    this.start = start;
    this.top = new Topological(digraph);
    this.top.order().forEach(function(vertex){
        _this.relaxVertex(digraph, vertex, _this);
    });
};

ShortestPathTree.prototype.relaxEdge = function(e) {
    var distTo = this.distTo,
        edgeTo = this.edgeTo;
    var v = e.from(), w = e.to();
    if (distTo[w] > distTo[v] + e.weight) {
        distTo[w] = distTo[v] + e.weight;
        edgeTo[w] = e;
    }
};

/**
 * relax a vertex v in the specified digraph g
 * @param {EdgeWeightedDigraph} the apecified digraph
 * @param {Vertex} v vertex to be relaxed
 */
ShortestPathTree.prototype.relaxVertex = function(digraph, vertex, tree) {
    var distTo = tree.distTo;
    var edgeTo = tree.edgeTo;
    digraph.getAdj(vertex).forEach(function(edge){
        var w = edge.to();
        distTo[w] = /\d/.test(distTo[w]) ? distTo[w] : Number.MAX_VALUE;
        distTo[vertex] = distTo[vertex] || 0;
        if (distTo[w] > distTo[vertex] + edge.weight) {
            // in case of the result of 0.28+0.34 is 0.62000001
            distTo[w] = parseFloat((distTo[vertex] + edge.weight).toFixed(2));
            edgeTo[w] = edge;
        }
    });

};

ShortestPathTree.prototype.getDistTo = function(v) {
    return this.distTo[v];
};

ShortestPathTree.prototype.hasPathTo = function(v) {
    var dist = this.distTo[v];
    if(v == this.start) return false;
    return /\d/.test(dist) ? dist != Number.MAX_VALUE : false;
};

ShortestPathTree.prototype.pathTo = function(v) {
    if (!this.hasPathTo(v) || v == this.start) return [];
    var path = [];
    var edgeTo = this.edgeTo;
    for (var e = edgeTo[v]; !!e; e = edgeTo[e.from()]) {
        path.push(e.to());
    }
    path.push(this.start);
    return path.reverse();
};

module.exports = ShortestPathTree;

},{"./edge_weighted_digraph":115,"./topological":127}],118:[function(require,module,exports){
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

},{}],119:[function(require,module,exports){
/*
Copyright (c) 2011, David Przybilla, Chris Umbel

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
    'a','un','el','ella','y','sobre','de','la','que','en',
    'los','del','se','las','por','un','para','con','no',
    'una','su','al','lo','como','más','pero','sus','le',
    'ya','o','porque','cuando','muy','sin','sobre','también',
    'me','hasta','donde','quien','desde','nos','durante','uno',
    'ni','contra','ese','eso','mí','qué','otro','él','cual',
    'poco','mi','tú','te','ti','sí',
     '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '_'];
    
// tell the world about the noise words.    
exports.words = words;

},{}],120:[function(require,module,exports){
/*
Copyright (c) 2011, Chris Umbel
Farsi Stop Words by Fardin Koochaki <me@fardinak.com>

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
    // Words
    'از', 'با', 'یه', 'برای', 'و', 'باید', 'شاید',

    // Symbols
    '؟', '!', '٪', '.', '،', '؛', ':', ';', ',',
    
    // Numbers
    '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۰'
];
    
// tell the world about the noise words.    
exports.words = words;

},{}],121:[function(require,module,exports){
/*
 Copyright (c) 2014, Ismaël Héry

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

// A list of commonly used french words that have little meaning and can be excluded
// from analysis.

var words = ['être', 'avoir', 'faire',
    'a',
    'au',
    'aux',
    'avec',
    'ce',
    'ces',
    'dans',
    'de',
    'des',
    'du',
    'elle',
    'en',
    'et',
    'eux',
    'il',
    'je',
    'la',
    'le',
    'leur',
    'lui',
    'ma',
    'mais',
    'me',
    'même',
    'mes',
    'moi',
    'mon',
    'ne',
    'nos',
    'notre',
    'nous',
    'on',
    'ou',
    'où',
    'par',
    'pas',
    'pour',
    'qu',
    'que',
    'qui',
    'sa',
    'se',
    'ses',
    'son',
    'sur',
    'ta',
    'te',
    'tes',
    'toi',
    'ton',
    'tu',
    'un',
    'une',
    'vos',
    'votre',
    'vous',
    'c',
    'd',
    'j',
    'l',
    'à',
    'm',
    'n',
    's',
    't',
    'y',
    'été',
    'étée',
    'étées',
    'étés',
    'étant',
    'suis',
    'es',
    'est',
    'sommes',
    'êtes',
    'sont',
    'serai',
    'seras',
    'sera',
    'serons',
    'serez',
    'seront',
    'serais',
    'serait',
    'serions',
    'seriez',
    'seraient',
    'étais',
    'était',
    'étions',
    'étiez',
    'étaient',
    'fus',
    'fut',
    'fûmes',
    'fûtes',
    'furent',
    'sois',
    'soit',
    'soyons',
    'soyez',
    'soient',
    'fusse',
    'fusses',
    'fût',
    'fussions',
    'fussiez',
    'fussent',
    'ayant',
    'eu',
    'eue',
    'eues',
    'eus',
    'ai',
    'as',
    'avons',
    'avez',
    'ont',
    'aurai',
    'auras',
    'aura',
    'aurons',
    'aurez',
    'auront',
    'aurais',
    'aurait',
    'aurions',
    'auriez',
    'auraient',
    'avais',
    'avait',
    'avions',
    'aviez',
    'avaient',
    'eut',
    'eûmes',
    'eûtes',
    'eurent',
    'aie',
    'aies',
    'ait',
    'ayons',
    'ayez',
    'aient',
    'eusse',
    'eusses',
    'eût',
    'eussions',
    'eussiez',
    'eussent',
    'ceci',
    'cela',
    'cet',
    'cette',
    'ici',
    'ils',
    'les',
    'leurs',
    'quel',
    'quels',
    'quelle',
    'quelles',
    'sans',
    'soi'
];

exports.words = words;

},{}],122:[function(require,module,exports){
/*
Copyright (c) 2011, David Przybilla, Chris Umbel

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
    'ad','al','allo','ai','agli','all','agl','alla','alle','con','col','coi','da','dal','dallo',
    'dai','dagli','dall','dagl','dalla','dalle','di','del','dello','dei','degli','dell','degl',
    'della','delle','in','nel','nello','nei','negli','nell','negl','nella','nelle','su','sul',
    'sullo','sui','sugli','sull','sugl','sulla','sulle','per','tra','contro','io','tu','lui',
    'lei','noi','voi','loro','mio','mia','miei','mie','tuo','tua','tuoi','tue','suo','sua','suoi',
    'sue','nostro','nostra','nostri','nostre','vostro','vostra','vostri','vostre','mi','ti','ci',
    'vi','lo','la','li','le','gli','ne','il','un','uno','una','ma','ed','se','perché','anche','come',
    'dov','dove','che','chi','cui','non','più','quale','quanto','quanti','quanta','quante','quello',
    'quelli','quella','quelle','questo','questi','questa','queste','si','tutto','tutti','a','c','e',
    'i','l','o','ho','hai','ha','abbiamo','avete','hanno','abbia','abbiate','abbiano','avrò','avrai',
    'avrà','avremo','avrete','avranno','avrei','avresti','avrebbe','avremmo','avreste','avrebbero',
    'avevo','avevi','aveva','avevamo','avevate','avevano','ebbi','avesti','ebbe','avemmo','aveste',
    'ebbero','avessi','avesse','avessimo','avessero','avendo','avuto','avuta','avuti','avute','sono',
    'sei','è','siamo','siete','sia','siate','siano','sarò','sarai','sarà','saremo','sarete','saranno',
    'sarei','saresti','sarebbe','saremmo','sareste','sarebbero','ero','eri','era','eravamo','eravate',
    'erano','fui','fosti','fu','fummo','foste','furono','fossi','fosse','fossimo','fossero','essendo',
    'faccio','fai','facciamo','fanno','faccia','facciate','facciano','farò','farai','farà','faremo',
    'farete','faranno','farei','faresti','farebbe','faremmo','fareste','farebbero','facevo','facevi',
    'faceva','facevamo','facevate','facevano','feci','facesti','fece','facemmo','faceste','fecero',
    'facessi','facesse','facessimo','facessero','facendo','sto','stai','sta','stiamo','stanno','stia',
    'stiate','stiano','starò','starai','starà','staremo','starete','staranno','starei','staresti',
    'starebbe','staremmo','stareste','starebbero','stavo','stavi','stava','stavamo','stavate','stavano',
    'stetti','stesti','stette','stemmo','steste','stettero','stessi','stesse','stessimo','stessero','stando',
     '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '_'];
    
// tell the world about the noise words.    
exports.words = words;

},{}],123:[function(require,module,exports){
// Original copyright:
/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// This version:
/*
Copyright (c) 2012, Guillaume Marty

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
// Original location:
// http://svn.apache.org/repos/asf/lucene/dev/trunk/lucene/analysis/kuromoji/src/resources/org/apache/lucene/analysis/ja/stopwords.txt
var words = ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ',
  'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として', 'い', 'や', 'れる',
  'など', 'なっ', 'ない', 'この', 'ため', 'その', 'あっ', 'よう', 'また', 'もの',
  'という', 'あり', 'まで', 'られ', 'なる', 'へ', 'か', 'だ', 'これ', 'によって',
  'により', 'おり', 'より', 'による', 'ず', 'なり', 'られる', 'において', 'ば', 'なかっ',
  'なく', 'しかし', 'について', 'せ', 'だっ', 'その後', 'できる', 'それ', 'う', 'ので',
  'なお', 'のみ', 'でき', 'き', 'つ', 'における', 'および', 'いう', 'さらに', 'でも',
  'ら', 'たり', 'その他', 'に関する', 'たち', 'ます', 'ん', 'なら', 'に対して', '特に',
  'せる', '及び', 'これら', 'とき', 'では', 'にて', 'ほか', 'ながら', 'うち', 'そして',
  'とともに', 'ただし', 'かつて', 'それぞれ', 'または', 'お', 'ほど', 'ものの', 'に対する',
  'ほとんど', 'と共に', 'といった', 'です', 'とも', 'ところ', 'ここ'];

// tell the world about the noise words.
module.exports = words;

},{}],124:[function(require,module,exports){
/*
Copyright (c) 2014, Kristoffer Brabrand

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
    'og','i','jeg','det','at','en','et','den','til','er','som',
    'på','de','med','han','av','ikke','der','så','var','meg',
    'seg','men','ett','har','om','vi','min','mitt','ha','hadde',
    'hun','nå','over','da','ved','fra','du','ut','sin','dem',
    'oss','opp','man','kan','hans','hvor','eller','hva','skal',
    'selv','sjøl','her','alle','vil','bli','ble','blitt','kunne',
    'inn','når','være','kom','noen','noe','ville','dere','som',
    'deres','kun','ja','etter','ned','skulle','denne','for','deg',
    'si','sine','sitt','mot','å','meget','hvorfor','dette','disse',
    'uten','hvordan','ingen','din','ditt','blir','samme','hvilken',
    'hvilke','sånn','inni','mellom','vår','hver','hvem','vors',
    'hvis','både','bare','enn','fordi','før','mange','også','slik',
    'vært','være','begge','siden','henne','hennar','hennes',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '_'];

// tell the world about the noise words.
exports.words = words;
},{}],125:[function(require,module,exports){
/*
Copyright (c) 2013, Paweł Łaskarzewski

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
// list based on: http://pl.wikipedia.org/wiki/Wikipedia:Stopwords
var words = [
    'a', 'aby', 'ach', 'acz', 'aczkolwiek', 'aj', 'albo', 'ale', 'ależ', 'ani',
    'aż', 'bardziej', 'bardzo', 'bo', 'bowiem', 'by', 'byli', 'bynajmniej',
    'być', 'był', 'była', 'było', 'były', 'będzie', 'będą', 'cali', 'cała',
    'cały', 'ci', 'cię', 'ciebie', 'co', 'cokolwiek', 'coś', 'czasami',
    'czasem', 'czemu', 'czy', 'czyli', 'daleko', 'dla', 'dlaczego', 'dlatego',
    'do', 'dobrze', 'dokąd', 'dość', 'dużo', 'dwa', 'dwaj', 'dwie', 'dwoje',
    'dziś', 'dzisiaj', 'gdy', 'gdyby', 'gdyż', 'gdzie', 'gdziekolwiek',
    'gdzieś', 'i', 'ich', 'ile', 'im', 'inna', 'inne', 'inny', 'innych', 'iż',
    'ja', 'ją', 'jak', 'jakaś', 'jakby', 'jaki', 'jakichś', 'jakie', 'jakiś',
    'jakiż', 'jakkolwiek', 'jako', 'jakoś', 'je', 'jeden', 'jedna', 'jedno',
    'jednak', 'jednakże', 'jego', 'jej', 'jemu', 'jest', 'jestem', 'jeszcze',
    'jeśli', 'jeżeli', 'już', 'ją', 'każdy', 'kiedy', 'kilka', 'kimś', 'kto',
    'ktokolwiek', 'ktoś', 'która', 'które', 'którego', 'której', 'który',
    'których', 'którym', 'którzy', 'ku', 'lat', 'lecz', 'lub', 'ma', 'mają',
    'mało', 'mam', 'mi', 'mimo', 'między', 'mną', 'mnie', 'mogą', 'moi', 'moim',
    'moja', 'moje', 'może', 'możliwe', 'można', 'mój', 'mu', 'musi', 'my', 'na',
    'nad', 'nam', 'nami', 'nas', 'nasi', 'nasz', 'nasza', 'nasze', 'naszego',
    'naszych', 'natomiast', 'natychmiast', 'nawet', 'nią', 'nic', 'nich', 'nie',
    'niech', 'niego', 'niej', 'niemu', 'nigdy', 'nim', 'nimi', 'niż', 'no', 'o',
    'obok', 'od', 'około', 'on', 'ona', 'one', 'oni', 'ono', 'oraz', 'oto',
    'owszem', 'pan', 'pana', 'pani', 'po', 'pod', 'podczas', 'pomimo', 'ponad',
    'ponieważ', 'powinien', 'powinna', 'powinni', 'powinno', 'poza', 'prawie',
    'przecież', 'przed', 'przede', 'przedtem', 'przez', 'przy', 'roku',
    'również', 'sam', 'sama', 'są', 'się', 'skąd', 'sobie', 'sobą', 'sposób',
    'swoje', 'ta', 'tak', 'taka', 'taki', 'takie', 'także', 'tam', 'te', 'tego',
    'tej', 'temu', 'ten', 'teraz', 'też', 'to', 'tobą', 'tobie', 'toteż',
    'trzeba', 'tu', 'tutaj', 'twoi', 'twoim', 'twoja', 'twoje', 'twym', 'twój',
    'ty', 'tych', 'tylko', 'tym', 'u', 'w', 'wam', 'wami', 'was', 'wasz', 'zaś',
    'wasza', 'wasze', 'we', 'według', 'wiele', 'wielu', 'więc', 'więcej', 'tę',
    'wszyscy', 'wszystkich', 'wszystkie', 'wszystkim', 'wszystko', 'wtedy',
    'wy', 'właśnie', 'z', 'za', 'zapewne', 'zawsze', 'ze', 'zł', 'znowu',
    'znów', 'został', 'żaden', 'żadna', 'żadne', 'żadnych', 'że', 'żeby',
    '$', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '_'];

// tell the world about the noise words.
exports.words = words;

},{}],126:[function(require,module,exports){
/*
Copyright (c) 2011, Polyakov Vladimir, Chris Umbel

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
    'о', 'после', 'все', 'также', 'и', 'другие', 'все', 'как', 'во', 'быть',
    'потому', 'был', 'до', 'являюсь', 'между', 'все', 'но', 'от', 'иди', 'могу',
    'подойди', 'мог', 'делал', 'делаю', 'каждый', 'для', 'откуда', 'иметь', 'имел',
    'он', 'имеет', 'её', 'здесь', 'его', 'как', 'если', 'в', 'оно', 'за',
    'делать', 'много', 'я', 'может быть', 'более', 'самый', 'должен',
    'мой', 'никогда', 'сейчас', 'из', 'на', 'только', 'или', 'другой', 'другая',
    'другое', 'наше', 'вне', 'конец', 'сказал', 'сказала', 'также', 'видел', 'c',
    'немного', 'все еще', 'так', 'затем', 'тот', 'их', 'там', 'этот', 'они', 'те',
    'через', 'тоже', 'под', 'над', 'очень', 'был', 'путь', 'мы', 'хорошо',
    'что', 'где', 'который', 'пока', 'кто', 'с кем', 'хотел бы', 'ты', 'твои',
    'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н',
    'o', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь',
    'э', 'ю', 'я','$', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '_'];
    
// tell the world about the noise words.    
exports.words = words;

},{}],127:[function(require,module,exports){
/*
 Copyright (c) 2014, Lee Wenzhu

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
'use strict';

/**
 * a topo sort for a digraph
 * @param {Digraph}
 */
var Topological = function(g) {
    this.isDag = true;
    this.sorted = topoSort(uniqueVertexs(g.edges()), g.edges());
};

Topological.prototype.isDAG = function() {
    return this.isDag;
};

/**
 * get ordered vertexs of digraph
 */
Topological.prototype.order = function() {
    return this.sorted.slice();
};

/**
 * @param {Array} all vertex in digraph
 * @param {Object} all edges in the digraph
 */
function topoSort(vertexs, edges) {
    var sorted = [];
    var cursor = vertexs.length,
        visited = {},
        i = cursor;
    while (i--) {
        if (!visited[i]) visit(vertexs[i], i, []);
    }

    return sorted.reverse();

    function visit(vertex, i, predecessors) {
        if(predecessors.indexOf(vertex) >= 0) {
            throw new Error('Cyclic dependency:' + JSON.stringify(vertex));
        }

        if(visited[i]) return;
        visited[i] = true;

        var outgoing = edges.filter(function(edge) {
            return edge.to() === vertex;
        });

        var preds = [];
        if(outgoing.length > 0) {
            preds = predecessors.concat(vertex);
        }
        var from;
        outgoing.forEach(function(edge) {
            from = edge.from();
            visit(from, vertexs.indexOf(from), preds);
        });

        sorted[--cursor] = vertex;
    };
};


function uniqueVertexs(edges) {
    var vertexs = [];
    var from, to;
    edges.forEach(function(edge) {
        from = edge.from();
        to = edge.to();
        if (vertexs.indexOf(from) < 0) vertexs.push(from);
        if (vertexs.indexOf(to) < 0) vertexs.push(to);
    });
    return vertexs;
};

module.exports = Topological;

},{}],128:[function(require,module,exports){
/*
 Copyright (c) 2012, Guillaume Marty

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
 * Generate a replacing function given a table of patterns. Inspired by:
 * http://code.google.com/p/jslibs/wiki/JavascriptTips#String_converter
 * The order of elements is significant. Longer elements should be listed first.
 * @see Speed test http://jsperf.com/build-a-regexp-table
 *
 * @param {Object.<string, string>} translationTable The translation table of key value.
 * @return {function(string): string} A translating function.
 */
function replacer(translationTable) {
  /**
   * An array of translationTable keys.
   * @type {Array.<string>}
   */
  var pattern = [];

  /**
   * The regular expression doing the replacement job.
   * @type {RegExp}
   */
  var regExp;

  /**
   * Used to iterate over translationTable.
   * @type {string}
   */
  var key;

  for (key in translationTable) {
    // Escaping regexp special chars.
    // @see Speed test for type casting to string http://jsperf.com/string-type-casting/2
    // @see http://closure-library.googlecode.com/svn/docs/closure_goog_string_string.js.source.html#line956
    key = ('' + key).replace(/([-()\[\]{}+?*.$\^|,:#<!\\\/])/g, '\\$1').
      replace(/\x08/g, '\\x08');

    pattern.push(key);
  }

  regExp = new RegExp(pattern.join('|'), 'g');

  /**
   * @param {string} str Input string.
   * @return {string} The string replaced.
   */
  return function(str) {
    return str.replace(regExp, function(str) {
      return translationTable[str];
    });
  };
}


/**
 * Exchanges all keys with their associated values in an object.
 *
 * @param {Object.<string, string>} obj An object of strings.
 * @return {Object.<string, string>} An object of strings.
 */
function flip(obj) {
  var newObj = Object.create(null),
      key;

  for (key in obj) {
    newObj[obj[key]] = key;
  }

  return newObj;
}


/**
 * Merge several objects. Properties from earlier objects are overwritten by
 * laters's in case of conflict.
 *
 * @param {...Object.<string, string>} var_args One or more objects of strings.
 * @return {!Object.<string, string>} An object of strings.
 */
function merge(var_args) {
  var args = [].slice.call(arguments),
      newObj = Object.create(null),
      id = 0, key;

  while (args[id]) {
    for (key in args[id]) {
      newObj[key] = args[id][key];
    }

    id++;
  }

  return newObj;
}

exports.replacer = replacer;
exports.flip = flip;
exports.merge = merge;

},{}],129:[function(require,module,exports){
(function (Buffer){
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

var WordNetFile = require('./wordnet_file'),
  fs = require('fs'),
  util = require('util');

function get(location, callback) {
  var buff = new Buffer(4096);

  this.open(function(err, fd, done) {
    WordNetFile.appendLineChar(fd, location, 0, buff, function(line) {
      done();
      var data = line.split('| ');
      var tokens = data[0].split(/\s+/);
      var ptrs = [];
      var wCnt = parseInt(tokens[3], 16);
      var synonyms = [];

      for(var i = 0; i < wCnt; i++) {
        synonyms.push(tokens[4 + i * 2]);
      }

      var ptrOffset = (wCnt - 1) * 2 + 6;
      for(var i = 0; i < parseInt(tokens[ptrOffset], 10); i++) {
        ptrs.push({
          pointerSymbol: tokens[ptrOffset + 1 + i * 4],
          synsetOffset: parseInt(tokens[ptrOffset + 2 + i * 4], 10),
          pos: tokens[ptrOffset + 3 + i * 4],
          sourceTarget: tokens[ptrOffset + 4 + i * 4]
        });
      }

      // break "gloss" into definition vs. examples
      var glossArray = data[1].split("; ");
      var definition = glossArray[0];
      var examples = glossArray.slice(1);    

      for (var k=0; k < examples.length; k++) {
        examples[k] = examples[k].replace(/\"/g,'').replace(/\s\s+/g,'');
      }
      
      callback({
        synsetOffset: parseInt(tokens[0], 10),
        lexFilenum: parseInt(tokens[1], 10),
        pos: tokens[2],
        wCnt: wCnt,
        lemma: tokens[4],
        synonyms: synonyms,
        lexId: tokens[5],
        ptrs: ptrs,
        gloss: data[1],
        def: definition,
        exp: examples
      });
    });
  });
}

var DataFile = function(dataDir, name) {
  WordNetFile.call(this, dataDir, 'data.' + name);
};

util.inherits(DataFile, WordNetFile);
DataFile.prototype.get = get;

module.exports = DataFile;

}).call(this,require("buffer").Buffer)
},{"./wordnet_file":132,"buffer":12,"fs":11,"util":149}],130:[function(require,module,exports){
(function (Buffer){
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

var WordNetFile = require('./wordnet_file'),
  fs = require('fs'),
  util = require('util');

function getFileSize(path) {
  var stat = fs.statSync(path);
  return stat.size;
}

function findPrevEOL(fd, pos, callback) {
  var buff = new Buffer(1024);
  if(pos == 0)
    callback(0);
  else {
    fs.read(fd, buff, 0, 1, pos, function(err, count) {
      if(buff[0] == 10)
        callback(pos + 1);
      else
        findPrevEOL(fd, pos - 1, callback);
    });
  }
}

function readLine(fd, pos, callback) {
  var buff = new Buffer(1024);
  findPrevEOL(fd, pos, function(pos) {
    WordNetFile.appendLineChar(fd, pos, 0, buff, callback);
  });
}

function miss(callback) {
  callback({status: 'miss'});
}

function findAt(fd, size, pos, lastPos, adjustment, searchKey, callback, lastKey) {
  if (lastPos == pos || pos >= size) {
    miss(callback);
  } else {
    readLine(fd, pos, function(line) {
      var tokens = line.split(/\s+/);
      var key = tokens[0];

    if(key == searchKey) {
        callback({status: 'hit', key: key, 'line': line, tokens: tokens});
      } else if(adjustment == 1 || key == lastKey)  {
        miss(callback);
      } else {
        adjustment = Math.ceil(adjustment * 0.5);

        if (key < searchKey) {
          findAt(fd, size, pos + adjustment, pos, adjustment, searchKey, callback, key);
        } else {
          findAt(fd, size, pos - adjustment, pos, adjustment, searchKey, callback, key);
        }
      }
    });
  }
}

function find(searchKey, callback) {
  var indexFile = this;

  indexFile.open(function(err, fd, done) {
    if(err) {
      console.log(err);
    } else {
      var size = getFileSize(indexFile.filePath) - 1;
      var pos = Math.ceil(size / 2);
      findAt(fd, size, pos, null, pos, searchKey,
        function(result) { callback(result); done(); });
    }
  });
}

function lookupFromFile(word, callback) {
  this.find(word, function(record) {
    var indexRecord = null;

    if(record.status == 'hit') {
      var ptrs = [], offsets = [];

      for(var i = 0; i < parseInt(record.tokens[3]); i++)
        ptrs.push(record.tokens[i]);

      for(var i = 0; i < parseInt(record.tokens[2]); i++)
        offsets.push(parseInt(record.tokens[ptrs.length + 6 + i], 10));

      indexRecord = {
        lemma: record.tokens[0],
        pos: record.tokens[1],
        ptrSymbol: ptrs,
        senseCnt:  parseInt(record.tokens[ptrs.length + 4], 10),
        tagsenseCnt:  parseInt(record.tokens[ptrs.length + 5], 10),
        synsetOffset:  offsets
      };
    }

    callback(indexRecord);
  });
}

function lookup(word, callback) {
  this.lookupFromFile(word, callback);
}

var IndexFile = function(dataDir, name) {
  WordNetFile.call(this, dataDir, 'index.' + name);
};

util.inherits(IndexFile, WordNetFile);

IndexFile.prototype.lookupFromFile = lookupFromFile;
IndexFile.prototype.lookup = lookup;
IndexFile.prototype.find = find;

IndexFile.prototype._findAt = findAt;

module.exports = IndexFile;

}).call(this,require("buffer").Buffer)
},{"./wordnet_file":132,"buffer":12,"fs":11,"util":149}],131:[function(require,module,exports){
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

var IndexFile = require('./index_file'),
  DataFile = require('./data_file');

function pushResults(data, results, offsets, callback) {
  var wordnet = this;

  if(offsets.length == 0) {
    callback(results);
  } else {
    data.get(offsets.pop(), function(record) {
      results.push(record);
      wordnet.pushResults(data, results, offsets, callback);
    });
  }
}

function lookupFromFiles(files, results, word, callback) {
  var wordnet = this;

  if(files.length == 0)
    callback(results);
  else {
    var file = files.pop();

    file.index.lookup(word, function(record) {
      if(record) {
        wordnet.pushResults(file.data, results, record.synsetOffset, function() {
          wordnet.lookupFromFiles(files, results, word, callback);
        });
      } else {
        wordnet.lookupFromFiles(files, results, word, callback);
      }
    });
  }
}

function lookup(word, callback) {
  word = word.toLowerCase().replace(/\s+/g, '_');

  this.lookupFromFiles([
    {index: this.nounIndex, data: this.nounData},
    {index: this.verbIndex, data: this.verbData},
    {index: this.adjIndex, data: this.adjData},
    {index: this.advIndex, data: this.advData},
  ], [], word, callback);
}

function get(synsetOffset, pos, callback) {
  var dataFile = this.getDataFile(pos);
  var wordnet = this;

  dataFile.get(synsetOffset, function(result) {
    callback(result);
  });
}

function getDataFile(pos) {
    switch(pos) {
      case 'n':
        return this.nounData;
      case 'v':
        return this.verbData;
      case 'a': case 's':
        return this.adjData;
      case 'r':
        return this.advData;
    }
}

function loadSynonyms(synonyms, results, ptrs, callback) {
  var wordnet = this;

  if(ptrs.length > 0) {
    var ptr = ptrs.pop();

    this.get(ptr.synsetOffset, ptr.pos, function(result) {
      synonyms.push(result);
      wordnet.loadSynonyms(synonyms, results, ptrs, callback);
    });
  } else {
    wordnet.loadResultSynonyms(synonyms, results, callback);
  }
}

function loadResultSynonyms(synonyms, results, callback) {
  var wordnet = this;

  if(results.length > 0) {
    var result = results.pop();
    wordnet.loadSynonyms(synonyms, results, result.ptrs, callback);
  } else
    callback(synonyms);
}

function lookupSynonyms(word, callback) {
  var wordnet = this;

  wordnet.lookup(word, function(results) {
    wordnet.loadResultSynonyms([], results, callback);
  });
}

function getSynonyms() {
  var wordnet = this;
  var callback = arguments[2] ? arguments[2] : arguments[1];
  var pos = arguments[0].pos ? arguments[0].pos : arguments[1];
  var synsetOffset = arguments[0].synsetOffset ? arguments[0].synsetOffset : arguments[0];

  this.get(synsetOffset, pos, function(result) {
    wordnet.loadSynonyms([], [], result.ptrs, callback);
  });
}

function WordNet(dataDir) {

  if (!dataDir) {
    try {
      var WNdb = require('WNdb');
    } catch(e) {
      console.error("Please 'npm install WNdb' before using WordNet module or specify a dict directory.");
      throw e;
    }
    dataDir = WNdb.path;
  }

  this.nounIndex = new IndexFile(dataDir, 'noun');
  this.verbIndex = new IndexFile(dataDir, 'verb');
  this.adjIndex = new IndexFile(dataDir, 'adj');
  this.advIndex = new IndexFile(dataDir, 'adv');

  this.nounData = new DataFile(dataDir, 'noun');
  this.verbData = new DataFile(dataDir, 'verb');
  this.adjData = new DataFile(dataDir, 'adj');
  this.advData = new DataFile(dataDir, 'adv');

  this.get = get;
  this.lookup = lookup;
  this.lookupFromFiles = lookupFromFiles;
  this.pushResults = pushResults;
  this.loadResultSynonyms = loadResultSynonyms;
  this.loadSynonyms = loadSynonyms;
  this.lookupSynonyms = lookupSynonyms;
  this.getSynonyms = getSynonyms;
  this.getDataFile = getDataFile;
}

module.exports = WordNet;

},{"./data_file":129,"./index_file":130,"WNdb":11}],132:[function(require,module,exports){
(function (Buffer){
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

var  fs = require('fs'),
  path = require('path'),
  util = require('util');


function appendLineChar(fd, pos, buffPos, buff, callback) {
  if(buffPos >= buff.length) {
    var newBuff = new Buffer(buff.length * 2);
    buff.copy(newBuff, 0, 0, buff.length);
    buff = newBuff;
  }

  fs.read(fd, buff, buffPos, 1, pos, function(err, count) {
    if(err)
      console.log(err);
    else {
      if(buff[buffPos] == 10 || buffPos == buff.length)
        callback(buff.slice(0, buffPos).toString('ASCII'));
      else {
        appendLineChar(fd, pos + 1, buffPos + 1, buff, callback);
      }
    }
  });
}

function open(callback) {
  var filePath = this.filePath;

  fs.open(filePath, 'r', null, function(err, fd) {
    if (err) {
        console.log('Unable to open %s', filePath);
        return;
    }
    callback(err, fd, function() {fs.close(fd)});
  });
}

var WordNetFile = function(dataDir, fileName) {
  this.dataDir = dataDir;
  this.fileName = fileName;
  this.filePath = require('path').join(this.dataDir, this.fileName);
};

WordNetFile.prototype.open = open;
WordNetFile.appendLineChar = appendLineChar;

module.exports = WordNetFile;

}).call(this,require("buffer").Buffer)
},{"buffer":12,"fs":11,"path":135,"util":149}],133:[function(require,module,exports){
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

},{}],134:[function(require,module,exports){
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

},{}],135:[function(require,module,exports){
(function (process){
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

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    }