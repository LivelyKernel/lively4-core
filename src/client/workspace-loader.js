import { translate as babelTranslate } from 'plugin-babel';

import { getCode } from './workspaces.js';

export function fetch(load, fetch) {
  // console.log('fetch', load, fetch);
  if(load.name.startsWith('workspace:')) {
    var id = decodeURI(load.name.replace(/^workspace:/, ''));
    // console.log(`fetch workspace code for id: ${id}`);
    var code = getCode(id);
    // console.log('Found code', code)
    return Promise.resolve(code);
  } else if(load.name.endsWith('.js')) {
    return fetch.call(this, load);
  } else {
    throw new Error('unknown type of code evaluation: ' + load.name);
  }
}

export function translate(...args) {
  // console.log('translate', ...args);
  var result = babelTranslate.apply(this, args);
  return result;
}
