// first lines copied from src/worker/livelyworker.js
self.window = self;

// as lively4url would not be defined otherwise we need to compute it here
const myPath = '/demos/tom/plugin-explorer-worker.js';
self.lively4url = self.location.toString().replace(myPath, "");


importScripts(lively4url + '/src/external/systemjs/system.src.js');
importScripts(lively4url + '/demos/tom/plugin-explorer-systemjs-config.js')

// not sure why I need this but without it I cannot import the plugins
System.import(pluginTransformationPlugin);

const enumerationPlugin = createTraceID => function() {
    const visitor = {
        enter(path) {
            if (!path.node.traceID) {
                path.node.traceID = createTraceID();
            }
        }
    };

    return {
        visitor: {
            Program(path) {
                path.node.traceID = createTraceID();
                path.traverse(visitor)
            }
        }
    }
}

const enumerationConfig = createTraceID => {
    return { plugins: [enumerationPlugin(createTraceID)] }
}


// copied from src/client/lively.js
async function unloadModule(path) {
    var normalizedPath = System.normalizeSync(path)
    try {
        // check, to prevent trying to reloading a module a second time if there was an error #375
        if (System.get(normalizedPath)) {
            await System.import(normalizedPath).then(module => {
                if (module && typeof module.__unload__ === "function") {
                    module.__unload__();
                }
            });
        }
    } catch (e) {
        console.log("WARNING: error while trying to unload " + path)
    }
    System.registry.delete(normalizedPath);
    // #Hack #issue in SystemJS babel syntax errors do not clear errors
    System['@@registerRegistry'][normalizedPath] = undefined;
    delete System.loads[normalizedPath]
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
        window[Trace.traceIdentifierName] = trace;

        function createTraceID() {
            return trace.createTraceID();
        }

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
                const ast = babel.transform(msg.data.source, enumerationConfig(createTraceID)).ast;
                const oldASTAsString = JSON.stringify(ast);

                wrapAST(ast, trace);
                let result
                try {
                    result = babel.transformFromAst(ast, undefined, config);
                } catch (e) {
                    result = null;
                    trace.error(e);
                }

                postMessage({
                    oldAST: oldASTAsString,
                    transformedAST: JSON.stringify(result && result.ast),
                    transformedCode: result && result.code,
                    trace: trace.serialize()
                });

                msg.data.urls.forEach(unloadModule)
            })
    })
}
