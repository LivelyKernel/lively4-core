if (typeof chai === 'undefined') {
  if (window && window.lively4url) {
    // workaround for lively4
    System.import('node_modules/chai/chai.js').then(module => {
      window.chai = module
    });
  } else {
    const _require = require; // workaround for lively modules
    if (typeof global !== 'undefined') {
      global.chai = _require('chai');
    }
  }
}
