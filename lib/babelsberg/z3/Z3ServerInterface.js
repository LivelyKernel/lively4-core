module('users.timfelgentreff.z3.Z3ServerInterface').requires().toRun(function() {

Object.subclass("Z3ServerInterface");

Object.extend(Z3ServerInterface, {
    createEvalExpression: function(code) {
        return code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    },
    
    evalSync: function(expr, callback) {
        return this.eval(true, expr, callback);
    },
    eval: function(sync, expr, callback) {
        var sanitizedExpr = this.createEvalExpression(expr),
            wr = this.getZ3WR(callback);
        sync ? wr.beSync() : wr.beAsync();
        return wr.post(JSON.stringify({expr: sanitizedExpr, timeout: 3000}), 'application/json');
    },
    getZ3WR: function(callback) {
        var url = new URL(Config.nodeJSURL + '/').withFilename('Z3Server/eval');
        return url.asWebResource().withJSONWhenDone(function(json, status) {
            var err = status.isSuccess() ? null : json.error || json.message || json.result || 'unknown error';
            callback(err, String(json.result).trim());
        })
    },
    evalAsync: function(expr, callback) {
        return this.eval(false, expr, callback);
    },
    
    resetZ3Server: function() {
        new URL((Config.nodeJSWebSocketURL || Config.nodeJSURL) + '/Z3Server/reset')
            .asWebResource().beAsync().post();
    }
});

}) // end of module
