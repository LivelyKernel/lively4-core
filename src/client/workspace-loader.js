import { translate as babelTranslate } from 'plugin-babel';

import { getCode } from './workspaces.js';

export function fetch(load, fetch) {
  console.log("workspace fetch: " + fetch)
  if(load.name.startsWith('workspace:')) {
    var id = decodeURI(load.name.replace(/^workspace:/, ''));
    var code = getCode(id);
    console.log('Found code', code)
    return Promise.resolve(code);
  } else {
    throw new Error('unknown type of code evaluation: ' + load.name);
  }
}

export function translate(...args) {
  var result = babelTranslate.apply(this, args);
  return result;
}
