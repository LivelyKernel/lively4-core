'use strict';

class LogAppend {
    match(response) {
        return response.url.endsWith('.js');
    }

    transform(response) {
        console.log('LogAppend Transformer V8');

        return response.clone().blob()
            .then(function(blob) {
                console.log('blob');

                // create new Blob
                console.log('BlobType', blob.type);

                return new Promise(function(resolve, reject) {
                    var reader = new FileReader();
                    reader.addEventListener("load", function() {
                        console.log('Result Text', reader.result);

                        var newContent = reader.result + '\nconsole.log(12345);';

                        var newBlob = new Blob([newContent], {
                            type: blob.type
                        });
                        resolve(newBlob);
                    });
                    reader.readAsBinaryString(blob);
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

//    var clone = response.clone();
//    var clone2 = clone.clone();
//    var transformPromise = clone.text().then(function(txt) {
//console.log('TRANSFORM', txt);
//        return new Response(txt + '\n console.log("FOOOOOOOOOOOOO");');
//    }).catch(function(error) {
//        console.log('ERROR DURING TRANBSFORM', error);
//        return response;
//    });

//var srcTransform = new BabelsbergSrcTransform();
//var src = srcTransform.transform(callback.toString());
