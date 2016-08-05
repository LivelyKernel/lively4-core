const SET_MEMBER = "setMember";
const GET_MEMBER = "getMember";
const GET_AND_CALL_MEMBER = "getAndCallMember";

// const SET_LOCAL = "setLocal";
// const GET_LOCAL = "getLocal";

// const SET_GLOBAL = "setGlobal";
// const GET_GLOBAL = "getGlobal";

export default function(param) {
    let { types: t, template } = param;
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

    let customTemplates = {}
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

    function addCustomTemplate(file, name) {
        let declar = file.declarations[name];
        if (declar) return declar;

        let ref = customTemplates[name];
        let uid = file.declarations[name] = file.scope.generateUidIdentifier(name);

        ref = ref().expression;
        ref[GENERATED_FUNCTION] = true

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
        visitor: {
            // TODO: also
            Identifier(path) {
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

            AssignmentExpression(path, state) {
                // check, whether we assign to a member (no support for pattern right now)
                if(!t.isMemberExpression(path.node.left)) { return; }
                if(isGenerated(path)) { return; }

                path.replaceWith(
                    t.callExpression(
                        addCustomTemplate(state.file, SET_MEMBER),
                        [
                            path.node.left.object,
                            getPropertyFromMemberExpression(path.node.left),
                            t.stringLiteral(path.node.operator),
                            path.node.right
                        ]
                    )
                );
            },

            MemberExpression(path, state) {
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

            CallExpression(path, state) {
                // check whether we call a MemberExpression
                if(!t.isMemberExpression(path.node.callee)) { return; }
                if(isGenerated(path)) { return; }

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
            }
        }
    };
}