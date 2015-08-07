'use strict';

class LogAppend {
    match(response) {
        return response.url.endsWith('.js');
    }

    transform(response) {
        console.log('LogAppend Transformer V9');

        return response.clone().blob()
            .then(function(blob) {
                console.log('blob');

                // create new Blob
                console.log('BlobType', blob.type);

                function readBlob(blob) {
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
                        return content + '\nconsole.log(123456);';
                    })
                    .then(function packNewBlob(newContent) {
                        return new Blob([newContent], {
                            type: blob.type
                        });
                    });
            })
            .then(function packNewResponse(newBlob) {
                console.log('pack response');
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
