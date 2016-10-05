const AEXPR_IDENTIFIER_NAME = "aexpr";

const SET_MEMBER = "setMember";
const GET_MEMBER = "getMember";
const GET_AND_CALL_MEMBER = "getAndCallMember";

const IGNORE_STRING = "aexpr ignore";
const IGNORE_INDICATOR = Symbol("aexpr ignore");

const SET_MEMBER_BY_OPERATORS = {
    '=': 'setMember',
    '+=': 'setMemberAddition',
    '-=': 'setMemberSubtraction',
    '*=': 'setMemberMultiplication',
    '/=': 'setMemberDivision',
    '%=': 'setMemberRemainder',
    //'**=': 'setMemberExponentiation',
    '<<=': 'setMemberLeftShift',
    '>>=': 'setMemberRightShift',
    '>>>=': 'setMemberUnsignedRightShift',
    '&=': 'setMemberBitwiseAND',
    '^=': 'setMemberBitwiseXOR',
    '|=': 'setMemberBitwiseOR'
};

// const SET_LOCAL = "setLocal";
// const GET_LOCAL = "getLocal";

// const SET_GLOBAL = "setGlobal";
// const GET_GLOBAL = "getGlobal";

export default function(param) {
    let { types: t, template, traverse } = param;
    console.log(arguments);

    function getPropertyFromMemberExpression(node) {
        // We are looking for MemberExpressions, which have two distinct incarnations:
        // 1. we have a computed MemberExpression like a[b], with the property being an Expression
        // 2. a non-computed MemberExpression like a.b, with the property being an Identifier
        return node.computed ?
            // We can easily deal with the first case by replacing the MemberExpression with a call
            node.property :
            // In the second case, we introduce a StringLiteral matching the Identifier
            t.stringLiteral(node.property.name);
    }

    const GENERATED_FUNCTION = Symbol("generated function");
    function isGenerated(path) {
        return path.findParent(p => t.isFunctionDeclaration(p.node) && p.node[GENERATED_FUNCTION])
    }

    let customTemplates = {};
    customTemplates[SET_MEMBER] = template(`
  (function(obj, prop, operator, val) {
    return obj[prop] = val;
  });
`);

    customTemplates[GET_MEMBER] = template(`
  (function(obj, prop) {
    return obj[prop];
  });
`);

    customTemplates[GET_AND_CALL_MEMBER] = template(`
  (function(obj, prop, args) {
    return obj[prop](...args)
  });
`);

    customTemplates[AEXPR_IDENTIFIER_NAME] = template(`
  (function(expr) {
    return { onChange(cb) {}};
  });
`);

    function addCustomTemplate(file, name) {
        let declar = file.declarations[name];
        if (declar) return declar;

        return file.declarations[name] = file.addImport("aexpr-source-transformation-propagation", name, name);

        let ref = customTemplates[name];
        console.log(file.addImport("aexpr-source-transformation-propagation", "aexpr"));
        let uid = file.declarations[name] = file.scope.generateUidIdentifier(name);

        ref = ref().expression;
        ref[GENERATED_FUNCTION] = true;

        if (t.isFunctionExpression(ref) && !ref.id) {
            ref.body._compact = true;
            ref._generated = true;
            ref.id = uid;
            ref.type = "FunctionDeclaration";
            file.path.unshiftContainer("body", ref);
        } else {
            ref._compact = true;
            file.scope.push({
                id: uid,
                init: ref,
                unique: true
            });
        }

        return uid;
    }

    return {
        pre(file) {
            console.log("fff", file, traverse);

            traverse(file.ast, {
                enter(path) {
                    if (
                        path.node.leadingComments &&
                        path.node.leadingComments.some(comment => comment.value.includes(IGNORE_STRING))
                    ) {
                        console.log("IGNORED!!!");
                        file[IGNORE_INDICATOR] = true;
                    }
                }
            });
        },
        visitor: {
            Program: {
                enter(path, state) {
                    console.log("file", path, state);
                    if(state.file[IGNORE_INDICATOR]) { console.log("read ignored"); return; }

                    path.traverse({
                        Identifier(path) {
                            //console.log(path.node.name)
                            // Check for a call to aexpr:
                            if(
                                t.isCallExpression(path.parent) &&
                                path.node.name === AEXPR_IDENTIFIER_NAME &&
                                !path.scope.hasBinding(AEXPR_IDENTIFIER_NAME)
                            ) {
                                path.replaceWith(
                                    addCustomTemplate(state.file, AEXPR_IDENTIFIER_NAME)
                                );
                                return;
                            }

                            return;

                            //if(RESERVED_IDENTIFIERS.includes(path.node.name)) { return; }

                            if(t.isClassDeclaration(path.parent)) {
                                console.log("classDecl", path.node.name);
                                return;
                            }

                            if(t.isClassMethod(path.parent)) {
                                console.log("classMethod", path.node.name);
                                return;
                            }

                            if(t.isObjectMethod(path.parent)) {
                                console.log("objectMethod", path.node.name);
                                return;
                            }
                            if(t.isVariableDeclarator(path.parent)) {
                                console.log("varDecl", path.node.name);
                                return;
                            }

                            // is this correct here?
                            // TODO: is it correct for the locals plugin?
                            if (!path.isReferencedIdentifier()) {
                                console.log("def", path.node.name);
                                return;
                            }

                            // is locally defined variable?
                            if (path.scope.hasBinding(path.node.name)) {
                                console.log("local", path.node.name);
                            } else {
                                // we have a global
                                console.log("global", path.node.name);
                            }
                        },
                        AssignmentExpression(path) {
                            // check, whether we assign to a member (no support for pattern right now)
                            if(!t.isMemberExpression(path.node.left)) { return; }
                            if(isGenerated(path)) { return; }

                            //state.file.addImport

                            if(!SET_MEMBER_BY_OPERATORS[path.node.operator]) { return; }

                            path.replaceWith(
                                t.callExpression(
                                    addCustomTemplate(state.file, SET_MEMBER_BY_OPERATORS[path.node.operator]),
                                    [
                                        path.node.left.object,
                                        getPropertyFromMemberExpression(path.node.left),
                                        //t.stringLiteral(path.node.operator),
                                        path.node.right
                                    ]
                                )
                            );
                        },

                        MemberExpression(path) {
                            // lval (left values) are ignored for now
                            if(t.isAssignmentExpression(path.parent) && path.key === 'left') { return; }
                            if(isGenerated(path)) { return; }

                            path.replaceWith(
                                t.callExpression(
                                    addCustomTemplate(state.file, GET_MEMBER),
                                    [
                                        path.node.object,
                                        getPropertyFromMemberExpression(path.node)
                                    ]
                                )
                            );
                        },

                        CallExpression(path) {
                            if(isGenerated(path)) { return; }

                            // check whether we call a MemberExpression
                            if(t.isMemberExpression(path.node.callee)) {
                                path.replaceWith(
                                    t.callExpression(
                                        addCustomTemplate(state.file, GET_AND_CALL_MEMBER),
                                        [
                                            path.node.callee.object,
                                            getPropertyFromMemberExpression(path.node.callee),
                                            t.arrayExpression(path.node.arguments)
                                        ]
                                    )
                                )
                            } else {
                                if(t.isIdentifier(path.node.callee) && true) {
                                }
                            }

                        }
                    });
                }
            // },
            // // TODO: also
            // Identifier(path, state) {
            //     //console.log(state);
            //     // Check for a call to aexpr:
            //     if(
            //         t.isCallExpression(path.parent) &&
            //         path.node.name === AEXPR_IDENTIFIER_NAME &&
            //         !path.scope.hasBinding(AEXPR_IDENTIFIER_NAME)
            //     ) {
            //         //path.replaceWith(
            //         //addCustomTemplate(state.file, AEXPR_IDENTIFIER_NAME)
            //         //);
            //         return;
            //     }
            //
            //     return;
            //
            //     //if(RESERVED_IDENTIFIERS.includes(path.node.name)) { return; }
            //
            //     if(t.isClassDeclaration(path.parent)) {
            //         console.log("classDecl", path.node.name);
            //         return;
            //     }
            //
            //     if(t.isClassMethod(path.parent)) {
            //         console.log("classMethod", path.node.name);
            //         return;
            //     }
            //
            //     if(t.isObjectMethod(path.parent)) {
            //         console.log("objectMethod", path.node.name);
            //         return;
            //     }
            //     if(t.isVariableDeclarator(path.parent)) {
            //         console.log("varDecl", path.node.name);
            //         return;
            //     }
            //
            //     // is this correct here?
            //     // TODO: is it correct for the locals plugin?
            //     if (!path.isReferencedIdentifier()) {
            //         console.log("def", path.node.name);
            //         return;
            //     }
            //
            //     // is locally defined variable?
            //     if (path.scope.hasBinding(path.node.name)) {
            //         console.log("local", path.node.name);
            //     } else {
            //         // we have a global
            //         console.log("global", path.node.name);
            //     }
            // },

            // AssignmentExpression(path, state) {
            //     // check, whether we assign to a member (no support for pattern right now)
            //     if(!t.isMemberExpression(path.node.left)) { return; }
            //     if(isGenerated(path)) { return; }
            //
            //     //state.file.addImport
            //
            //     //path.replaceWith(
            //     //  t.callExpression(
            //     //addCustomTemplate(state.file, SET_MEMBER)//,
            //     //        [
            //     //          path.node.left.object,
            //     //        getPropertyFromMemberExpression(path.node.left),
            //     //      t.stringLiteral(path.node.operator),
            //     //      path.node.right
            //     //    ]
            //     //  )
            //     //);
            // },

            // MemberExpression(path, state) {
            //     // lval (left values) are ignored for now
            //     if(t.isAssignmentExpression(path.parent) && path.key === 'left') { return; }
            //     if(isGenerated(path)) { return; }
            //
            //     //path.replaceWith(
            //     //  t.callExpression(
            //     //addCustomTemplate(state.file, GET_MEMBER)//,
            //     //    [
            //     //    path.node.object,
            //     //    getPropertyFromMemberExpression(path.node)
            //     //]
            //     //)
            //     //
            // },

            // CallExpression(path, state) {
            //     if(isGenerated(path)) { return; }
            //
            //     // check whether we call a MemberExpression
            //     if(t.isMemberExpression(path.node.callee)) {
            //         //  path.replaceWith(
            //         //    t.callExpression(
            //         //addCustomTemplate(state.file, GET_AND_CALL_MEMBER)//,
            //         //      [
            //         //        path.node.callee.object,
            //         //      getPropertyFromMemberExpression(path.node.callee),
            //         //          t.arrayExpression(path.node.arguments)
            //         //        ]
            //         //      )
            //         //    )
            //     } else {
            //         if(t.isIdentifier(path.node.callee) && true) {
            //         }
            //     }
            //
            }
        }
    };
}