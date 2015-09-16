'use strict';

class EvalLoader {
    static getExpression() {
        return /^(https:\/\/eval\/)/;
    }

    static match(request) {
        return request.url.match(EvalLoader.getExpression());
    }

    static transform(request) {
        console.log('Eval Loader', request.url);

        console.log('starting eval');
        var s = request.url.replace(EvalLoader.getExpression(), '');
        try {
            console.log('eval try', s);
            var result = eval(s);
        } catch(e) {
            console.log('eval catch', s);
            result = "Error: " + e;
        }
        console.log('eval result', result);

        return new Response(result);
    }
}
