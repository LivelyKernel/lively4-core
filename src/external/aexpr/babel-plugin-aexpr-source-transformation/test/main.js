"use strict";

var transformFileSync = require('babel-core').transformFileSync;
var path = require('path');
var fs = require('fs');
var assert = require('assert');

var plugin = require('../dist/index').default;

var tests = [
    {file: 'base'},
    {file: 'ignore'},
    {file: 'nested_locals'},
    {file: 'class_example'},
    {file: 'locals_and_globals'},
    {file: 'nested_left_assignment'},

    {file: 'function-expression'},
    {file: 'all-accesses'},
    {file: 'with_aexpr'},
    {file: 'operators'}
];

function normalize(str) {
    return str.toString().replace(/(\r\n|\n|\r)/gm, '\n');
}

describe('locals'
    , function () {
    tests.forEach(function(test){
        it(`case: ${test.file}`, function() {
            var transform = normalize(transformFileSync(path.join(__dirname, `src/${test.file}.js`), {
                plugins: [[plugin, test.options]],
                babelrc: false // So we don't get babelrc from whole project
            }).code);
            var expected = normalize(fs.readFileSync(path.join(__dirname, `expected/${test.file}.js`), {encoding: 'utf-8'}));

            assert.equal(transform, expected);
        })
    })
});
