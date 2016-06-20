// only to be run with node (or rather mocha), not in a browser

// TODO: rename as it is not all about chai anymore
global.chai = require('chai');
global.expect = global.chai.expect;
global.sinon = require('sinon');
global.acorn = require('./../src/babelsberg/jsinterpreter/acorn.js');
