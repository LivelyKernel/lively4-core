'use strict';

var test = require('tape');
var SystemJS = require('systemjs');

test('systemjs-plugin-babel', function (t) {
  t.plan(1);

  // given
  System.config({
    map: {
      'plugin-babel': './plugin-babel.js',
      'systemjs-babel-build': './systemjs-babel-node.js'
    },
    transpiler: 'plugin-babel'
  });

  // when
  System.import('test/testing-code.js')

  // then
  .then(function(m) {
    return m.p().then(function (message) {
      t.equal(message, 'Rocks :)');
    });
  })
  .then(t.end, t.end);
});
