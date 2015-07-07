// Runs Z3 interactively. Must be symlinked into LK_DIR/core/servers/
var util = require('util');
var i = util.inspect
var spawn = require("child_process").spawn;
var fs = require('fs');
var path = require('path');
// var WebSocketServer = require('core/servers/support/websockets').WebSocketServer;

var domain = require('domain').create();
domain.on('error', function(er) {
    console.error('Z3Server error %s\n%s', er, er.stack);
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var state = {};
var debug = false;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function evalAtStartup(rState, thenDo) {
    // thenDo()
    var initCode = "(set-option :pp.decimal true)\
    (set-option :produce-models true)\
    (set-option :produce-unsat-cores true)";
    evalSMTExpression(rState, {timeout: 10*1000}, initCode,
        function(err, result) { thenDo(err) })
}

function runZ3(rState, args, thenDo) {
    if (rState.process) { thenDo(null, rState); return }
    var cmd = "./z3";
    var options = {cwd: __dirname, stdio: 'pipe', env: process.env};
    if (debug) console.log('Running command: %s', [cmd].concat(args));
    rState.process = spawn(cmd, args, options);

    domain.add(rState.process);

    debug && rState.process.stdout.on('data', function (data) {
        console.log('STDOUT: ' + data); });
    debug && rState.process.stderr.on('data', function (data) {
        console.log('STDERR: ' + data); });

    rState.process.on('close', function (code) {
        debug && console.log('R process exited with code ' + code);
        rState.process.stdout.removeAllListeners();
        rState.process.stderr.removeAllListeners();
        rState.process.removeAllListeners();
        rState.process = null;
    });

    evalAtStartup(rState, function(err) { thenDo(err, rState); });
}

function evalSMTExpression(rState, options, expr, thenDo) {
    // options = {timeout: MILLISECONDS}
    if (!rState.process) {
        runZ3(rState, ['-smt2', '-in'], function(err, rState) {
            if (err || !rState.process) thenDo(err || 'Error: Z3 process could not be started.');
            else evalSMTExpression(rState, options, expr, thenDo);
        });
        return;
    }
    var endMarker = 'true\n',
        output = '',
        done = false,
        timeout = options.timeout || 1000,
        p = rState.process;
    function capture(data) { output += data.toString(); }
    function attach() {
        p.stdout.on('data', capture);
        p.stderr.on('data', capture);
        p.on("close", detach);
    }
    function detach(err) {
        p.stdout.removeListener('data', capture);
        p.stderr.removeListener('data', capture);
        p.removeListener('close', detach);
        clearInterval(resultPoll);
        done = true;
        thenDo(err, output);
    }
    attach();
    setTimeout(function() { if (!done) detach('timeout'); }, timeout);
    var resultPoll = setInterval(function() {
        var endMarkerPos = output.indexOf(endMarker);
        if (endMarkerPos === -1) return;
        output = output.slice(0, endMarkerPos);
        detach(null);
    }, 40);
    p.stdin.write(expr + "\n(display true)\n");
    if (debug) console.log('Z3 evaluates: %s', expr);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function cleanup(subserver) {
    console.log('Z3Server is shutting down...');
    if (state.process) state.process.kill();
    subserver && subserver.removeAllListeners();
    state = {};
}

module.exports = domain.bind(function(route, app, subserver) {
    // var webSocketHandler = new WebSocketServer();
    // webSocketHandler.debug = false;
    // webSocketHandler.listen({
    //     route: route + 'connect',
    //     subserver: subserver,
    //     actions: {
    //         eval: function(c, msg) {
    //             var expr = msg,
    //                 timeout = 3000;
    //             if (!expr) {
    //                 var msg = {error: 'Cannot deal with request', message: 'No expression'};
    //                 c.send({action: 'evalReply', data: JSON.stringify({error: 'No expression given'})});
    //             } else {
    //                 evalSMTExpression(state, {timeout: timeout}, expr, function(err, output) {
    //                     if (err) {
    //                         c.send({action: 'evalReply', data: JSON.stringify({error: String(err)})});
    //                     } else {
    //                         c.send({action: 'evalReply', data: JSON.stringify({data: output})});
    //                     }
    //                 });
    //             }
    //         }
    //     }
    // });

    subserver.on('close', cleanup.bind(null, subserver));

    app.post(route+'eval', function(req, res) {
        var expr = req.body && req.body.expr,
            timeout = req.body && req.body.timeout;
        if (!expr) {
            var msg = {error: 'Cannot deal with request', message: 'No expression'};
            res.status(400).json(msg).end();
            return;
        }
        evalSMTExpression(state, {timeout: timeout}, expr, function(err, output) {
            if (err) { res.status(500).json({error: String(err)}).end(); return; }
            res.json({result: output}).end();
        });
    });

    app.post(route + 'reset', function(req, res) {
        console.log('Resetting Z3 process');
        cleanup();
        res.json({message: 'Z3 process reset'}).end();
    });

    app.post(route + 'setDebug', function(req, res) {
        debug = req.body.value || false;
        console.log('Setting Z3Server debug mode to ', debug);
        res.end();
    });

    app.get(route, function(req, res) {
        res.end("Z3Server is running!");
    });
});
