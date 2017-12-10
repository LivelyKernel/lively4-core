export function responseOk(response, throwError=Error) {
  if(response.status >= 200 && response.status < 300) {
    return response
  } else {
    throw new throwError(response.statusText)
  }
}

export function responseToJson(response) {
  return response.json()
}

export function buildNetworkRequestFunction(request) {
  return () => {
    return new Promise(async (resolve, reject) => {
      resolve(self.fetch(request).then((result) => {
        return result;
      }).catch(e => {
        console.log("fetch error: "  + e);
        return new Response("Could not fetch " + url +", because of: " + e);
      }))
    });
  };
}

/**
 * Builds a key for the cache from a request
 * @return String key
 */
export function buildKey(request) {
  // Ignore params when loading start.html
  // The file always has the same content, and we want to boot offline whenever possible
  let requestUrl = new URL(request.url);
  if(requestUrl.origin == self.location.origin && requestUrl.pathname.endsWith('start.html')) {
    return `${request.method} ${requestUrl.origin}/${requestUrl.pathname}`;
  }

  return `${request.method} ${request.url}`;
}

/**
 * Builds a fake success Response to return when a Request is enqueued
 * @return Response
 */
export function buildEnqueuedResponse() {
  return new Response(null, {
    status     : 200,
    statusText : 'OK'
  });
}

/**
 * Builds a fake error Response to return when offline and not cached
 * @return Response
 */
export function buildNotCachedResponse() {
  let errorText = 'You are offline and the requested file was not found in the cache.';
  return new Response(errorText, {
    status     : 503,
    statusText : 'Service Unavailable'
  });
}

/**
 * Builds fake GET and OPTIONS responses for a newly created, empty file
 * @param fileName The name of the new file
 */
export function buildEmptyFileResponses(fileName) {
  const responseHeaders = new Headers({
      'Access-Control-Allow-Headers'  : '*',
      'Access-Control-Allow-Methods'  : 'OPTIONS, GET, DELETE, PUT',
      'Access-Control-Allow-Origin'   : '*',
      'Access-Control-Request-Method' : '*',
      'Connection'                    : 'Keep-Alive',
      'content-type'                  : 'text/plain',
      'Date'                          : new Date(Date.now()).toUTCString(),
      'Keep-Alive'                    : 'timeout=15, max=93'
    });
  
  const OPTIONSResponse = new Response(
    // Body
    JSON.stringify({
      name: fileName,
      size: 0,
      type: 'file'
    }),
    // Headers
    {
      status: 200,
      statusText: 'OK',
      headers: responseHeaders
    }
  );
  
  const GETResponse = new Response('', {
    status: 200,
    statusText: 'OK',
    headers: responseHeaders
  });
  
  return {
    GET: GETResponse,
    OPTIONS: OPTIONSResponse
  };
}

/**
 * Builds a fake OPTIONS response for a newly created, empty folder
 * @param folderName The name of the new folderName
 */
export function buildEmptyFolderResponse(folderName) {
  const responseHeaders = new Headers({
      'Access-Control-Allow-Headers'  : '*',
      'Access-Control-Allow-Methods'  : 'OPTIONS, GET, DELETE, PUT',
      'Access-Control-Allow-Origin'   : '*',
      'Access-Control-Request-Method' : '*',
      'Connection'                    : 'Keep-Alive',
      'content-type'                  : 'text/plain',
      'Date'                          : new Date(Date.now()).toUTCString(),
      'Keep-Alive'                    : 'timeout=15, max=93'
    });
  
  return new Response(
    // Body
    JSON.stringify({
      type     : 'directory',
      contents : []
    }),
    // Headers
    {
      status: 200,
      statusText: 'OK',
      headers: responseHeaders
    }
  );
}

/**
 * Returns a list of file that are necessary to boot lively
 */
export function getBootFiles() {
    let filesToLoad = [
      // Essential
      '',
      'start.html',
      'swx-boot.js',
      'swx-loader.js',
      'swx-post.js',
      'swx-pre.js',
      'src/client/boot.js',
      'src/client/load.js',
      'src/client/lively.js',
      'src/external/systemjs/system.src.js',
      'src/external/babel/plugin-babel2.js',
      'src/external/babel/systemjs-babel-browser.js',
      'src/external/babel-plugin-jsx-lively.js',
      'src/external/babel-plugin-transform-do-expressions.js',
      'src/external/babel-plugin-transform-function-bind.js',
      'src/external/babel-plugin-locals.js',
      'src/external/babel-plugin-var-recorder.js',
      'src/external/babel-plugin-syntax-jsx.js',
      'src/external/babel-plugin-syntax-function-bind.js',
      'src/external/babel-plugin-syntax-do-expressions.js',
      
      // Useful
      'templates/lively-notification.html',
      'templates/lively-notification.js',
      'templates/lively-notification-list.html',
      'templates/lively-notification-list.js',
      'src/components/widgets/lively-menu.html',
      'src/components/widgets/lively-menu.js',
      'src/components/widgets/lively-dialog.html',
      'src/components/widgets/lively-dialog.js',
      'templates/lively-file-browser.html',
      'templates/lively-file-browser.js',
      'src/components/widgets/lively-markdown.html',
      'src/components/widgets/lively-markdown.js',
      'templates/lively-file-browser-item.html',
      'templates/lively-file-browser-item.js'
    ];

    let directoryParts = self.location.pathname.split('/');
    directoryParts[directoryParts.length-1] = '';
    let directory = directoryParts.join('/');
    
    return filesToLoad.map((file) => {return directory + file});
}

/**
 * Merges two arrays, removing duplicates and keeping order
 */
export function mergeArrays(a, b) {
    let merged = a.concat(b);

    for (let i = 0; i < merged.length; i++) {
        for (let j = i+1; j < merged.length; j++) {
            if (merged[i] === merged[j]) {
                merged.splice(j--, 1);
            }
        }
    }

    return merged;
};

// Store array with mappings from numerical to hex representation
const _hexMap = Array.from(Array(0xff), (_, i) => (i + 0x100).toString(16).substr(1))

export function generateUUID() {
  let rand = new Uint8Array(16)

  crypto.getRandomValues(rand)

  rand[6] = (rand[6] & 0x0f) | 0x40;
  rand[8] = (rand[8] & 0x3f) | 0x80;

  return _hexMap[rand[0]] + _hexMap[rand[1]] +
         _hexMap[rand[2]] + _hexMap[rand[3]] + '-' +
         _hexMap[rand[4]] + _hexMap[rand[5]] + '-' +
         _hexMap[rand[6]] + _hexMap[rand[7]] + '-' +
         _hexMap[rand[8]] + _hexMap[rand[9]] + '-' +
         _hexMap[rand[10]] + _hexMap[rand[11]] +
         _hexMap[rand[12]] + _hexMap[rand[13]] +
         _hexMap[rand[14]] + _hexMap[rand[15]];
}
