// first lines copied from src/worker/livelyworker.js
self.window = self;

// as lively4url would not be defined otherwise we need to compute it here
const myPath = '/demos/tom/plugin-explorer-worker.js';
self.lively4url = self.location.toString().replace(myPath, "");


importScripts(lively4url + '/src/external/systemjs/system.src.js');
importScripts(lively4url + '/demos/tom/plugin-explorer-systemjs-config.js')

// not sure why I need this but without it I cannot import the plugins
System.import(pluginTransformationPlugin);

const enumerationPlugin = function() {

    let counter = 0;

    const visitor = {
        enter(path) {
            path.node.traceid = counter++;
        }
    };

    return {
        visitor: {
            Program(path) {
                path.node.traceid = counter++;
                path.traverse(visitor)
            }
        }
    }
}

const enumerationConfig = {
    plugins: [enumerationPlugin]
}

async function importPlugin(url) {
    const module = await System.import(url);
    const plugin = module.default;

    const modifiedPlugin = function(...args) {
        const result = plugin(...args)
        result.name = result.name || 'Please name your plugin!';
        return result;
    }

    return modifiedPlugin;
}

function importPlugins(urls) {
    return Promise.all(urls.map(url => importPlugin(url)))
        .then(plugins => {
            let counter = 0;
            for (const plugin of plugins) {
                if (plugin.name === 'Please name your plugin!') {
                    plugin.name += counter;
                    counter++;
                }
            }
            return plugins;
        })
}

const importPromise = Promise.all(['demos/tom/trace.js', 'systemjs-babel-build', 'demos/tom/wrapAST.js'].map(name =>
    System.import(name)));

self.onmessage = function(msg) {
    importPromise.then(function(imports) {
        const Trace = imports[0].default;
        const babel = imports[1].default.babel;
        const wrapAST = imports[2].default;

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
        });

        const trace = new Trace();
        // make it globally available for use in plugins
        window[Trace.traceIdenifierName] = trace;

        importPlugins(msg.data.urls)
            .then(function(modules) {
                config.plugins = modules;
                config.sourceFileName = 'tmpfile.js';
                config.sourceMaps = true;

                config.wrapPluginVisitorMethod = (pluginAlias, visitorType, callback) => {
                    return (...args) => {
                        trace.enterPlugin(pluginAlias);
                        callback(...args);
                        trace.leavePlugin(pluginAlias);
                    }
                };

                trace.startTraversion();
                const ast = babel.transform(msg.data.source, enumerationConfig).ast;
                const oldASTAsString = JSON.stringify(ast);

                wrapAST(ast, trace);
                const result = babel.transformFromAst(ast, undefined, config);

                // const result = babel.transform(msg.data.source, config);
                postMessage({
                    oldAST: oldASTAsString,
                    transformedAST: JSON.stringify(result.ast),
                    transformedCode: result.code,
                    trace: JSON.stringify(trace),
                    locations: Trace.locations
                });
            })
    })
}
