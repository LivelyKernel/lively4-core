/**
 * Takes a variable number of source transforming functions and returns
 * a function that consumes a Response object and applies the given
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
