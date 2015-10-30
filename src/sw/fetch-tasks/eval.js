l4.importScripts('src/sw/core.js');
l4.importScripts('src/sw/fetch.js');

(function() {
    var expression = /^(https:\/\/eval\/)/;
    var evaluator = {
        transform: function(request) {
            console.log('Eval Loader', request.url);

            console.log('starting eval');
            var s = request.url.replace(expression, '');

            try {
                console.log('eval try', s);
                var result = eval(s);
            } catch(e) {
                console.log('eval catch', s);
                result = "Error: " + e;
            }
            console.log('eval result:' +  result);

            return new Response(result);
        }
    };

    l4.fetchTask('eval', l4.urlMatch(expression), function(event) {
        return l4.parseEvent(event)
            .then(evaluator.transform)
                // .then(function(result){
                // return new Promise(function(resolve, reject) {
                //     fetch(new Request('index.html')).then(function() {
                //         resolve(new Response("Weiss ich auch nicht!"))
                //     });
                // })
                //});
    });
})();
