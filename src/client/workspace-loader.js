import { translate as babelTranslate } from 'plugin-babel';

import * as workspaces from './workspaces.js';

const WORKSPACE_REGEX = /^workspace(async)?(js)?:/

function parseId(load) {
  return decodeURI(load.name.replace(WORKSPACE_REGEX, ''));
}

function isWorkspace(load) {
  return load.name.match(WORKSPACE_REGEX)
}

export async function locate(load) {
  // does the resolving relative workspace urls belong here? 
  // it does not seem to work, but we have to do it here... because of transitive relative urls... etc... and we do want to get the same reference of existing modules...
 
    // console.log('WORKSPACE LOADER locate', load.address);
  
   if(isWorkspace(load)) {
      var id = parseId(load);
      var m = id.match(/^([^/]+\/)(.*)$/)
      if (m && m[2])
      var baseId = m[1]
      var relativeURL = m[2]
      var baseURL = workspaces.getURL(baseId);
//       console.log('WORKSPACE LOADER baseId', baseId);
//       console.log('WORKSPACE LOADER baseURL', baseURL);
//       console.log('WORKSPACE LOADER relativeURL', relativeURL);
      
     if (relativeURL && baseURL) {
        var sourceURL = await SystemJS.resolve("./" + relativeURL, baseURL)  
        // console.log("FOUND SOURCE URL", sourceURL)
        return sourceURL
      }
    }
  
  return 
}

export async function fetch(load, fetch) {
  // console.log('WORKSPACE LOADER fetch', load.address);
  if(isWorkspace(load)) {
    var id = parseId(load);
    // console.log(`fetch workspace code for id: ${id}`);
    var code = workspaces.getCode(id);
    
    if (!code) {
      // we have a relative url that resolved to a real url...
      if (!load.address.match(WORKSPACE_REGEX)) {
        return fetch.call(this, load);        
      }
    }
  
    if (!code) {
      throw new Error("workspace loader: no code for " + id)
    }
    
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
