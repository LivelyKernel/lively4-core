

import {babel} from 'systemjs-babel-build';
var tt = babel.types

import { plugins} from "babylon/lib/parser";

plugins.topLevelAwait = function (instance) {
    instance.extend("parseTopLevel", function(file, program){
        return function(file, program){
            program.sourceType = this.options.sourceType;
            
            // set state to inAsync to allow awaits
            this.state.inAsync = true;

            // allow strings at the top of a script
            // plus the only useful directive is "use strict"
            // which gets added by babel anyways

            var allowDirectives = false;
            this.parseBlockBody(program, allowDirectives, true, tt.eof);

            file.program  = this.finishNode(program, "Program");
            file.comments = this.state.comments;
            file.tokens   = this.state.tokens;

            return this.finishNode(file, "File");
        }
    })
}

export default function({ types: t }) {
    return {
        manipulateOptions(opts, parserOpts) {
            parserOpts.plugins.push("topLevelAwait");
        },
        visitor: {
            Program(path){
                // check if this program contains top-level awaits
                // or if it contains exports (which aren't supported)
                var has_export = false,
                    has_await = false;

                path.traverse({
                    AwaitExpression(path){
                        var parent = path.getFunctionParent();
                        if(parent.type === 'Program') has_await = true;
                    },
                    ExportDeclaration(){ has_export = true },
                    ExportNamespaceSpecifier(){ has_export = true },
                    ExportSpecifier(){ has_export = true },
                    ExportDefaultSpecifier(){ has_export = true },
                })

                // fast path shortcut if there are no top-level awaits
                if (!has_await) return;
                if ( has_export) throw new SyntaxError('Modules using top level await must not have exports');
                
                // we need to hoist all the imports
                var statements = [],
                    imports = [];

                path.node.body.forEach(stmt => {
                    // hoist import statements
                    if(t.isImportDeclaration(stmt) || t.isImportDefaultSpecifier(stmt)
                    || t.isImportNamespaceSpecifier(stmt) || t.isImportSpecifier(stmt)){
                        imports.push(stmt)
                    }else{
                        statements.push(stmt)
                    }
                })

                // here's the actual magical mess
                path.replaceWith(t.program(imports.concat([
                    t.exportNamedDeclaration(t.variableDeclaration("const", [
                        t.variableDeclarator(t.identifier('__async'), t.callExpression(
                            t.functionExpression(
                                null, // anonymous
                                [], // params
                                t.blockStatement(statements), 
                                false, // generator
                                true), // async
                            []))
                    ]), [], null)
                ])))
            }
        }
    };
}
