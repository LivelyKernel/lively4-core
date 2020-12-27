// first lines copied from src/worker/livelyworker.js
self.window = self;

// as lively4url would not be defined otherwise we need to compute it here
const myPath = '/demos/tom/plugin-explorer-worker.js';
self.lively4url = self.location.toString().replace(myPath, "");


importScripts(lively4url + '/src/external/systemjs/system.src.js');
importScripts(lively4url + '/demos/tom/plugin-explorer-systemjs-config.js')

// not sure why I need this but without it I cannot import the plugins
System.import(pluginTransformationPlugin);


Promise.all(['demos/tom/trace.js', 'systemjs-babel-build'].map(name => System.import(name)))
    .then(function(arr) {
        const Trace = arr[0].default;
        const babel = arr[1].default.babel;

        self.onmessage = function(msg) {
            const config = {
                filename: 'tmpfile.js',
                moduleIds: false,
                babelrc: false,
            };
            System.config({
                meta: {
                    '*.js': pluginOptions,
                    [pluginTransformationPlugin]: moduleOptionsNon
                }
            })

            Promise.all(msg.data.urls.map(url => System.import(url)))
                .then(function(modules) {
                    config.plugins = modules.map(module => module.default);
                    config.sourceFileName = 'tmpfile.js';
                    window[Trace.traceIdenifierName] = new Trace();
                    const result = babel.transform(msg.data.source, config);
                    debugger
                    postMessage({transformedAST: JSON.stringify(result.ast), transformedCode: result.code, trace: window[Trace.traceIdenifierName]});
                })
        }
    });
