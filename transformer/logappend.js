'use strict';

class LogAppend {
    match(response) {
        return response.url.endsWith('.js');
    }

    transform(response) {
        console.log('LogAppend Transformer');

        // TODO: NEXT: actually modify the source code in the response!
/*
        return response.text().then(function(txt) {
            console.log('LogAppend on', txt.split('\n')[0]);
            var blob = new Blob(txt + new Blob('\n console.log("FOOOOOOOOOOOOO");'));

            var reader = new FileReader();
            reader.addEventListener("loadend", function() {
                // reader.result contains the contents of blob as a typed array
            });
            reader.readAsArrayBuffer(blob);

            return new Response(blob, { headers: response.headers });
        });

        var clone = response.clone();
*/

        var clone = response.clone();
        var transformPromise = clone.text().then(function(txt) {
            console.log('LogAppend on', txt.split('\n')[0]);
            //return new Response(txt + '\n console.log("FOOOOOOOOOOOOO");');
            return response.clone();
            return new Response(txt);
            return response;
        });
        return transformPromise;
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
