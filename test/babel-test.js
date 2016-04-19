"use strict";

import {expect} from '../node_modules/chai/chai.js'

describe('Babel', function() {
  it('should support ES7 Exponential operator', function() {
    expect(2 ** 3).to.equal(8);
  });
});

// include this to force transpilation
export function foo() {}
