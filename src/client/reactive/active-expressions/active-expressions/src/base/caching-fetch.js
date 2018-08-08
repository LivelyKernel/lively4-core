// taken from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
function sha256(str) {
  // We transform the string into an arraybuffer.
  var buffer = new TextEncoder("utf-8").encode(str);
  return crypto.subtle.digest("SHA-256", buffer).then(function (hash) {
    return hex(hash);
  });
}

function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    var value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    var stringValue = value.toString(16)
    // We use concatenation and slice for padding
    var padding = '00000000'
    var paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}

export default class CachingFetch {
  constructor() {
    this.cache = {};
  }

  trace(f) {
    let originalFetch = window.fetch;
    var result = undefined;

    try {
      let self = this;
      window.fetch = async function(request, options, ...rest) {
        return self.requestCacheKey(request, options || {}).then(digest => {
          if(!self.cache.hasOwnProperty(digest)) {
            self.cache[digest] = {
              promise: undefined,
              updatedAt: 0,
              request: undefined
            };
          }
          let cachedRequest = self.cache[digest];
          let time = new Date().getTime();
          if((time - cachedRequest.updatedAt) > 5000) {
            cachedRequest.request = request;
            cachedRequest.updatedAt = time;
            let promise = originalFetch.apply(window, [request, options, ...rest]).then(response => {
              cachedRequest.promise = Promise.resolve(response);
              return response;
            });
            if(typeof cachedRequest.promise === 'undefined') {
              cachedRequest.promise = promise;
            }
          }

          return cachedRequest.promise.then(response => response.clone());
        })
      };
      result = f();
    } finally {
      window.fetch = originalFetch;
    }

    return result;
  }

  hasTraced() {
    return Object.keys(this.cache).length > 0;
  }

  requestCacheKey(...args) {
    return sha256(this.requestToString(...args));
  }

  requestToString(request, options) {
    var input = `request:${request}`;

    // For all keys with string values, just add them
    [
      'method',
      'mode',
      'credentials',
      'cache',
      'redirect',
      'referrer',
      'referrerPolicy',
      'integrity',
      'keepalive'
    ].forEach(attribute => {
      let value = options[attribute]
      if(typeof value !== 'undefined') {
        input += `\n${attribute}:${value}`
      }
    });

    // Serialize the headers to JSON
    if(typeof options['headers'] !== 'undefined') {
      input += `\nheaders:${JSON.stringify(options['headers'])}`
    }

    if(typeof options['body'] !== 'undefined') {
      let body = options['body']
      if(body instanceof FormData) {
        // convert FormData to object and serialize to JSON
        let formDataAsObject = {};
        for(var entry of body.entries()) {
          formDataAsObject[entry[0]] = entry[1];
        }
        input += `\nbody:${JSON.stringify(formDataAsObject)}`
      } else {
        input += `\nbody:${body}`
      }
    }

    return input;
  }
}
