// --------------------------------------------------------------------
// Transformers
// --------------------------------------------------------------------
//importScripts('transformer/identity.js');

function applySourceTransformationMatch(response) {
    var blackList = [
        'babel-core/browser.js',
        'es6-module-loader/es6-module-loader-dev.src.js',
        'bootworker.js',
        'serviceworker.js',
        'system-polyfills.src.js',
        'system.src.js',
        'serviceworker-loader.js',
        'https://code.jquery.com/jquery-2.1.4.js'
    ];

    var isJS = response.url.indexOf('.js') > -1;
    var inBlackList = false;
    for(var i = 0; i < blackList.length; i++) {
        inBlackList = inBlackList || response.url.indexOf(blackList[i]) > -1;
    }
    return isJS && !inBlackList;
}

/**
 * Takes a variable number of source transforming functions and returns
 * a function that consumes a response object and applies the given
 * transformations on the response.
 * @returns {Function}
 */
function transform() {
    var transformers = Array.prototype.slice.call(arguments);

    return function applyTransformationsOn(response) {
        return response.clone().blob()
            .then(function(blob) {
                function readBlob(blob) {
                    console.log('Read blob of type ' + blob.type);
                    return new Promise(function(resolve, reject) {
                        var reader = new FileReader();

                        reader.addEventListener("load", function() {
                            resolve(reader.result);
                        });
                        reader.addEventListener("error", function(err) {
                            reject(err, 'Error during reading Blob');
                        });

                        reader.readAsBinaryString(blob);
                    });
                }

                return readBlob(blob)
                    .then(function srcTransform(content) {
                        console.log("BEFORE TRANSFORM");
                        //console.log(content);
                        console.log("AFTER TRANSFORM");
                        //var transformed = babelTransform(content);
                        // TODO: transformers should be able to return Promises
                        transformers.forEach(function(transformer) {
                            content = transformer(content);
                        });
                        //console.log(transformed);

                        return content;
                    })
                    .then(function packNewBlob(newContent) {
                        return new Blob([newContent], {
                            type: blob.type
                        });
                    });
            })
            .then(function packNewResponse(newBlob) {
                // pack new Response from a Blob and the given Response
                return new Response(newBlob, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            });
    }
}

function babelTransform(content) {
    return babel.transform(content, {
        //modules: 'system'
    }).code;
}

