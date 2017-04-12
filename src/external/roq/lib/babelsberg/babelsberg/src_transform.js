module('users.timfelgentreff.babelsberg.src_transform').requires(
    'cop.Layers',
    'lively.morphic.Halos',
    'lively.ide.CodeEditor').
toRun(function() {
    JSLoader.loadJs(module('users.timfelgentreff.babelsberg.uglify').uri());

    Object.subclass('BabelsbergSrcTransform', {
        isAlways: function(node) {
            return ((node instanceof UglifyJS.AST_LabeledStatement) &&
                    (node.label.name === 'always') &&
                    (node.body instanceof UglifyJS.AST_BlockStatement));
        },

        isRule: function(node) {
            if ((node instanceof UglifyJS.AST_Label) &&
                    node.name === 'rule') {
                this.__ruleLabelSeen = node;
                return true;
            } else if (this.__ruleLabelSeen &&
                    node instanceof UglifyJS.AST_String) {
                return true;
            } else if ((node instanceof UglifyJS.AST_LabeledStatement) &&
                    (node.label.name === 'rule') &&
                    (node.body instanceof UglifyJS.AST_BlockStatement)) {
                return true;
            } else if ((node instanceof UglifyJS.AST_LabeledStatement) &&
                    (node.body.body instanceof UglifyJS.AST_SimpleStatement) &&
                    (node.body.body.body instanceof UglifyJS.AST_Call) &&
                    (node.body.body.body.expression instanceof UglifyJS.AST_Dot) &&
                    (node.body.body.body.expression.property === 'rule') &&
                    (node.body.body.body.expression.expression.name === 'bbb')) {
                // rule label with string that was transformed... remove the label
                this.__ruleLabelRemove = true;
                return true;
            }
            this.__ruleLabelSeen = null;
            return false;
        },

        isOnce: function(node) {
            return ((node instanceof UglifyJS.AST_LabeledStatement) &&
                    (node.label.name === 'once') &&
                    (node.body instanceof UglifyJS.AST_BlockStatement));
        },

        isTrigger: function(node) {
            var isTrigger = ((node instanceof UglifyJS.AST_Call) &&
                (node.expression instanceof UglifyJS.AST_SymbolRef) &&
                (node.expression.name === 'when'));
            if(isTrigger) { debugger; }

            return isTrigger;
        },

        ensureThisToSelfIn: function(ast) {
            var tr = new UglifyJS.TreeTransformer(function(node) {
                if (node instanceof UglifyJS.AST_This) {
                    return new UglifyJS.AST_SymbolRef({
                        start: node.start,
                        end: node.end,
                        name: '_$_self'
                    });
                }
            }, null);
            ast.transform(tr);
        },

        hasContextInArgs: function(constraintNode) {
            if (constraintNode.args.length == 2) {
                if (!constraintNode.args[0] instanceof UglifyJS.AST_Object) {
                    throw new SyntaxError(
                        "first argument of call to `always' must be an object"
                    );
                }
                return constraintNode.args[0].properties.any(function(ea) {
                    return ea.key === 'ctx';
                });
            } else {
                return false;
            }
        },

        createContextFor: function(ast, constraintNode) {
            var enclosed = ast.enclosed,
                self = this;
            if (constraintNode.args.last() instanceof UglifyJS.AST_Function) {
                enclosed = constraintNode.args.last().enclosed || [];
                enclosed = enclosed.reject(function(ea) {
                    // reject all that
                    //   1. are not declared (var) BEFORE the always
                    //   2. are first referenced (globals, specials, etc) AFTER the always
                    return (ea.init && (ea.init.start.pos > constraintNode.start.pos)) ||
                           (ea.orig && ea.orig[0] &&
                            (ea.orig[0].start.pos > constraintNode.end.pos));
                });
                enclosed.push({name: '_$_self'}); // always include this
            }
            var ctx = new UglifyJS.AST_Object({
                start: constraintNode.start,
                end: constraintNode.end,
                properties: enclosed.collect(function(ea) {
                    return new UglifyJS.AST_ObjectKeyVal({
                        start: constraintNode.start,
                        end: constraintNode.end,
                        key: ea.name,
                        value: self.contextMap(ea.name)
                    });
                })
            });

            var ctxkeyval = new UglifyJS.AST_ObjectKeyVal({
                start: constraintNode.start,
                end: constraintNode.end,
                key: 'ctx',
                value: ctx
            });
            if (constraintNode.args.length == 2) {
                constraintNode.args[0].properties.push(ctxkeyval);
            } else {
                constraintNode.args.unshift(new UglifyJS.AST_Object({
                    start: constraintNode.start,
                    end: constraintNode.end,
                    properties: [ctxkeyval]
                }));
            }
        },

        ensureContextFor: function(ast, constraintNode) {
            if (!this.hasContextInArgs(constraintNode)) {
                this.createContextFor(ast, constraintNode);
            }
        },

        getContextTransformerFor: function(ast) {
            var self = this;
            return new UglifyJS.TreeTransformer(null, function(node) {
                if (self.isAlways(node)) {
                    return self.transformConstraint(ast, node, 'always');
                } else if (self.isOnce(node)) {
                    return self.transformConstraint(ast, node, 'once');
                } else if (self.isTrigger(node)) {
                    return self.transformConstraint(ast, node, 'when');
                } else if (self.isRule(node)) {
                    var node = self.createRuleFor(node);
                    self.isTransformed = true;
                    return node;
                }
            });
        },

        transformConstraint: function(ast, node, name) {
            var node = this.createCallFor(ast, node, name);
            this.isTransformed = true;
            return node;
        },

        transform: function(code) {
            var ast = UglifyJS.parse(code);
            ast.figure_out_scope();
            var transformedAst = ast.transform(this.getContextTransformerFor(ast)),
                stream = UglifyJS.OutputStream({beautify: true, comments: true});
            if (this.isTransformed) {
                transformedAst.print(stream);
                return stream.toString();
            } else {
                return code;
            }
        },
    transformAddScript: function(code) {
        var ast = UglifyJS.parse(code);
            ast.figure_out_scope(),
            transformed = false;
        var transformedAst = ast.transform(new UglifyJS.TreeTransformer(
            null,
            function(node) {
                if (node instanceof UglifyJS.AST_Call &&
                    node.expression instanceof UglifyJS.AST_Dot &&
                    node.expression.property === 'addScript' &&
                    node.expression.expression instanceof UglifyJS.AST_This) {
                    assert(node.args.length === 1);
                    node.args.push(new UglifyJS.AST_String({
                        value: code.slice(node.args[0].start.pos, node.args[0].end.endpos)
                    }));
                    transformed = true;
                    return node;
                }
            })),
            stream = UglifyJS.OutputStream({beautify: true, comments: true});
        if (transformed) {
            transformedAst.print(stream);
            return stream.toString();
        } else {
            return code;
        }
    },

    ensureReturnIn: function(body) {
        var lastStatement = body.last();
        if (!(lastStatement.body instanceof UglifyJS.AST_Return)) {
            body[body.length - 1] = new UglifyJS.AST_Return({
                start: lastStatement.start,
                end: lastStatement.end,
                value: lastStatement
            });
        }
    },

    extractArgumentsFrom: function(constraintNode) {
        var body = constraintNode.body.body,
            newBody = [],
            args = [],
            extraArgs = [],
            store;
        newBody = body.select(function(ea) {
            if (ea instanceof UglifyJS.AST_LabeledStatement) {
                if (!(ea.body instanceof UglifyJS.AST_SimpleStatement)) {
                    throw new SyntaxError(
                        "Labeled arguments in `always:' have to be simple statements"
                    );
                }
                if (ea.label.name == 'store' || ea.label.name == 'name') {
                    store = new UglifyJS.AST_Assign({
                        start: ea.start,
                        end: ea.end,
                        right: undefined /* filled later */,
                        operator: '=',
                        left: ea.body.body
                    });
                } else {
                    extraArgs.push(new UglifyJS.AST_ObjectKeyVal({
                        start: ea.start,
                        end: ea.end,
                        key: ea.label.name,
                        value: ea.body.body
                    }));
                }
                return false;
            } else {
                return true;
            }
        });
        if (extraArgs) {
            args.push(new UglifyJS.AST_Object({
                start: constraintNode.start,
                end: constraintNode.end,
                properties: extraArgs
            }));
        }
        return {body: newBody, args: args, store: store};
    },

    createCallFor: function(ast, constraintNode, methodName) {
        var body, args, store, enclosed,
            self = this;
        if (constraintNode instanceof UglifyJS.AST_LabeledStatement) {
            var splitBodyAndArgs = this.extractArgumentsFrom(constraintNode);
            body = splitBodyAndArgs.body;
            args = splitBodyAndArgs.args;
            store = splitBodyAndArgs.store;
            enclosed = constraintNode.label.scope.enclosed;
        } else if (constraintNode instanceof UglifyJS.AST_Call) {
            var nodeArgs = constraintNode.args,
                funcArg = nodeArgs[nodeArgs.length - 1];
            if (!(funcArg instanceof UglifyJS.AST_Function)) {
                throw new SyntaxError(
                    'Last argument to ' +
                        constraintNode.expression.name +
                        ' must be a function'
                );
            }
            body = funcArg.body;
            args = nodeArgs.slice(0, nodeArgs.length - 1);
            enclosed = funcArg.enclosed;
        } else {
            throw SyntaxError("Don't know what to do with " + constraintNode);
        }

        this.ensureReturnIn(body);
        body.each(function(ea) {
            self.ensureThisToSelfIn(ea);
        });

        var call = new UglifyJS.AST_Call({
            start: constraintNode.start,
            end: constraintNode.end,
            expression: new UglifyJS.AST_Dot({
                start: constraintNode.start,
                end: constraintNode.end,
                property: methodName,
                expression: new UglifyJS.AST_SymbolRef({
                    start: constraintNode.start,
                    end: constraintNode.end,
                    name: 'bbb'
                })
            }),
            args: args.concat([new UglifyJS.AST_Function({
                start: body.start,
                end: body.end,
                body: body,
                enclosed: enclosed,
                argnames: []
            })])
        });

        this.ensureContextFor(ast, call);

        var newBody;
        if (store) {
            store.right = call;
            newBody = store;
        } else {
            newBody = call;
        }
        if (constraintNode instanceof UglifyJS.AST_Statement) {
            return new UglifyJS.AST_SimpleStatement({
                start: constraintNode.start,
                end: constraintNode.end,
                body: newBody
            });
        } else {
            return newBody;
        }
    },

    createRuleFor: function(ruleNode) {
        // remove label
        if (ruleNode instanceof UglifyJS.AST_Label) return ruleNode;

        var stringNode;
        if (ruleNode instanceof UglifyJS.AST_String) {
            stringNode = ruleNode;
            stringNode.value = stringNode.value.replace(/\|\s*-/mg, ':-');
            ruleNode = this.__ruleLabelSeen;
            delete this.__ruleLabelSeen;
        } else if (this.__ruleLabelRemove) {
            delete this.__ruleLabelRemove;
            return ruleNode.body.body;
        } else {
            // ruleNode instanceof UglifyJS.AST_LabeledStatement
            var stream = UglifyJS.OutputStream({beautify: true, comments: true});
            ruleNode.body.print(stream);
            stringNode = new UglifyJS.AST_String({
                start: ruleNode.body.start,
                end: ruleNode.body.end,
                value: stream.toString().
                        replace(/\|\s*-/mg, ':-').
                        replace(/^{\s*/, '').
                        replace(/\s*}\s*$/, '').
                        replace(/\s*;\s*$/, '')
            });
        }

        return new UglifyJS.AST_SimpleStatement({
            start: ruleNode.start,
            end: ruleNode.end,
            body: new UglifyJS.AST_Call({
                start: ruleNode.start,
                end: ruleNode.end,
                expression: new UglifyJS.AST_Dot({
                    start: ruleNode.start,
                    end: ruleNode.end,
                    property: 'rule',
                    expression: new UglifyJS.AST_SymbolRef({
                        start: ruleNode.start,
                        end: ruleNode.end,
                        name: 'bbb'
                    })
                }),
                args: [stringNode]
            })
        });
    },

    contextMap: function(name) {
        // map some custom shortnames to bbb functions
        if (name === '_$_self') {
            return new UglifyJS.AST_Binary({
                operator: '||',
                left: new UglifyJS.AST_Dot({
                    expression: new UglifyJS.AST_This({}),
                    property: 'doitContext'
                }),
                right: new UglifyJS.AST_This({})
            });
        }

        if (name === 'ro') {
            name = 'bbb.readonly';
        }
        if (name === 'system') {
            name = 'bbb.system()';
        }
        return new UglifyJS.AST_SymbolRef({name: name});
    }

});

    if (!(lively && lively.morphic && lively.morphic.Morph && lively.morphic.CodeEditor))
        return;


    cop.create('AddScriptWithFakeOriginalLayer').refineClass(lively.morphic.Morph, {
        addScript: function(funcOrString, origSource) {
            var originalFunction;
            originalFunction = cop.proceed.apply(this, [origSource]);
            var result = cop.proceed.apply(this, [funcOrString]);
            result.getOriginal().setProperty('originalFunction', originalFunction);
            return result;
        }
    });

    cop.create('ConstraintSyntaxLayer').refineClass(lively.morphic.CodeEditor, {
        doSave: function() {
            if (this.owner instanceof lively.ide.BrowserPanel) {
                // XXX: Ad-hoc fragment search
                var matchData = this.textString.match(/[^"](always:|once:)/),
                    t = new BabelsbergSrcTransform(),
                    idx = (matchData && matchData.index) || -1,
                    endIdx = this.textString.indexOf('}', idx + 1),
                    fragments = [],
                    offset = 0,
                    lines = this.textString.split('\n').map(function(line) {
                        return [line, offset += line.length + 1];
                    });
                while (idx !== -1 && endIdx !== -1) {
                    try {
                        var str = t.transform(this.textString.slice(idx, endIdx + 1));
                        var line;
                        lines.some(function(ary) {
                            line = ary[0]; return ary[1] > idx;
                        });
                        var indent = new Array(line.match(/always:|once:/).index + 1).
                                                join(' ');
                        str = str.split('\n').inject('', function(acc, line) {
                            return acc + '\n' + indent + line;
                        }).slice('\n'.length + indent.length);
                        // remove first newline+indent
                        fragments.push([idx + 1, endIdx, str]);
                        matchData = this.textString.slice(idx + 1).
                                        match(/[^"](always:|once:)/);
                        idx = (matchData && (matchData.index + idx + 1)) || -1;
                        endIdx = this.textString.indexOf('}', idx + 2);
                    } catch (e) {
                        // parsing exception
                        endIdx = this.textString.indexOf('}', endIdx + 1);
                    }
                }

                if (fragments.length !== 0) {
                    var textPos = 0;
                    var newTextString = fragments.inject(
                        '',
                        function(memo, fragment) {
                            var r = this.textString.slice(
                                textPos,
                                fragment[0]
                            ) + fragment[2];
                            textPos = fragment[1] + 1;
                            return memo + r;
                        }.bind(this));
                    newTextString += this.textString.slice(textPos);
                    this.textString = newTextString;
                }
                return cop.withoutLayers([ConstraintSyntaxLayer], function() {
                    return cop.proceed();
                });
            } else {
                return cop.proceed();
            }
        },

        boundEval: function(code) {
            var t = new BabelsbergSrcTransform(),
                addScriptWithOrigCode = t.transformAddScript(code),
                constraintCode = t.transform(addScriptWithOrigCode);
            if (addScriptWithOrigCode === constraintCode) {
                // no constraints in code
                return cop.proceed.apply(this, [code]);
            } else {
                return cop.withLayers([AddScriptWithFakeOriginalLayer], function() {
                    // If this layer is not global but only on the
                    // morph, make sure we use it here
                    return cop.proceed.apply(this, [constraintCode]);
                });
            }
        }
    });
    ConstraintSyntaxLayer.beGlobal();

}); // end of module
