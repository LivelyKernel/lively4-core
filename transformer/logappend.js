'use strict';

class LogAppend {
    match(response) {
        return response.url.endsWith('.js');
    }

    transform(response) {
        console.log('LogAppend Transformer');

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
