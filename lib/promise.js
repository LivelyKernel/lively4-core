/*global require, process, Promise*/

/*
 * Methods helping with promises (Promise/A+ model). Not a promise shim.
 */
;(function(exports) {
"use strict";

var arr = exports.arr;

var promise = exports.promise = {

  convertCallbackFun: function(func) {
    // Takes a function that accepts a nodejs-style callback function as a last
    // parameter and converts it to a function *not* taking the callback but
    // producing a promise instead. The promise will be resolved with the
    // *first* non-error argument.
    // nodejs callback convention: a function that takes as first parameter an
    // error arg and second+ parameters are the result(s).
    // Example:
    // var fs = require("fs"),
    //     readFile = promise.convertCallbackFun(fs.readFile);
    // readFile("./some-file.txt")
    //   .then(content => console.log(String(content)))
    //   .catch(err => console.error("Could not read file!", err));
    return function promiseGenerator(/*args*/) {
      var args = arr.from(arguments);
      return new Promise((resolve, reject) => {
        args.push((err, result) => err ? reject(err) : resolve(result));
        func.apply(this, args);
      });
    };
  },

  convertCallbackFunWithManyArgs: function(func) {
    // like convertCallbackFun but the promise will be resolved with the
    // all non-error arguments wrapped in an array.
    return function promiseGenerator(/*args*/) {
      var args = arr.from(arguments);
      return new Promise((resolve, reject) => {
        args.push(function(/*err + args*/) {
          var args = arr.from(arguments),
              err = args.shift();
          return err ? reject(err) : resolve(args);
        });
        func.apply(this, args);
      });
    };
  }

}

})(typeof module !== "undefined" && module.require && typeof process !== "undefined" ?
  require('./base') : (typeof lively !== "undefined" && lively.lang ? lively.lang : {}));
