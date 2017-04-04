module('users.timfelgentreff.standalone.Compressor').requires().toRun(function() {
    JSLoader.loadJs(module('users.timfelgentreff.babelsberg.uglify').uri());


    Object.extend(users.timfelgentreff.standalone.Compressor, {
        combineSources: function(sources) {
            var fullSource = sources.inject('', function(acc, s) {
                    var content = new WebResource(
                        URL.ensureAbsoluteCodeBaseURL(this.pathFor(s))
                    ).forceUncached().get().content;
                    if (content.startsWith('<')) throw s; // not found
                    return acc + '\n;;\n' + content;
                }.bind(this)),
                ast = UglifyJS.parse(fullSource),
                code, compressor;
            ast.figure_out_scope();
            compressor = UglifyJS.Compressor();
            ast = ast.transform(compressor);
            code = ast.print_to_string();
            return code;
        },

        doAction: function(spec, name) {
            this.writeCombinedSources(
                this.combineSources(this.sources(spec)),
                name
            );
        },


        pathFor: function(string) {
            return module('users.timfelgentreff.' + string).relativePath();
        },

        sourceObject: {
            prototypejs: ['standalone/prototype'],
            core: ['standalone/minilively',
                    'cop/Layers',

                    'ometa/lib',
                    'ometa/ometa-base',
                    'ometa/parser',
                    'ometa/ChunkParser',
                    'ometa/bs-ometa-compiler',
                    'ometa/bs-js-compiler',
                    'ometa/bs-ometa-js-compiler',
                    'ometa/bs-ometa-optimizer',
                    'ometa/lk-parser-extensions',
                    'ometa/Ometa',

                    'jsinterpreter/generated/Nodes',
                    'jsinterpreter/generated/Translator',
                    'jsinterpreter/LivelyJSParser',
                    'jsinterpreter/Parser',
                    'jsinterpreter/Meta',
                    'jsinterpreter/Rewriting',
                    'jsinterpreter/Interpreter',

                    'babelsberg/core_ext',
                    'babelsberg/constraintinterpreter',
                    'babelsberg/uglify',
                    'babelsberg/src_transform',
                    'standalone/babelsbergscript'],
            cassowary: ['cassowary/Hashtable',
                    'cassowary/HashSet',
                    'cassowary/DwarfCassowary',
                    'babelsberg/cassowary_ext'],
            deltablue: ['deltablue/deltablue',
                    'babelsberg/deltablue_ext'],
            csp: ['csp/underscore-min',
                    'csp/csp',
                    'babelsberg/csp_ext'],
            sutherland: ['sutherland/relax',
                    'sutherland/relax_bbb'],
            z3: ['z3/NaClZ3',
                'z3/CommandLineServerInterface',
                'z3/CommandLineZ3',
                // 'z3/StrZ3',
                'z3/emz3/EmZ3'],
            backtalk: ['backtalk/backtalk',
                       'backtalk/constraints',
                       'backtalk/backtalk_ext'],
            reactive: ['reactive/reactive'],
            tests: ['standalone/test_harness']
        },
        sources: function(list) {
            if (!list || list.length === 0) {
                list = ['prototypejs', 'core', 'cassowary', 'deltablue', 'csp'];
            }
            return [[]].concat(list).reduce(function(acc, key) {
                return acc.concat(this.sourceObject[key]);
            }.bind(this));
        },

        writeCombinedSources: function(code, name) {
            var file = lively.ide.CommandLineInterface.cwd() + '/' +
                            Config.codeBase.replace(Config.rootPath, '') +
                            this.pathFor('standalone/' + name).replace(/_/g, '.');
            lively.ide.CommandLineInterface.writeFile(file, {content: code});
        }
    });
}); // end of module
