'use strict';

class LogAppend {
    match(response) {
        return response.url.endsWith('.js');
    }

    transform(response) {
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
                        return content + '\nconsole.log(1234567);';
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

//var srcTransform = new BabelsbergSrcTransform();
//var src = srcTransform.transform(callback.toString());
