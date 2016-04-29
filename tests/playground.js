'use strict';

import { select } from '../src/active-expressions.js';

var view = select('div', function(e) {
  return e.className === 'red';
});

console.debug(view);
