"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (_ref) {
    var t = _ref.types;

    return {
        visitor: {
            Identifier: function Identifier(path) {
                // The identifier should have the expected name
                if (path.node.name !== LOCALS_NAME) {
                    return;
                }
                // The identifier should not be part of a declaration
                if (!path.isReferencedIdentifier()) {
                    return;
                }
                // The identifier should not reference a variable in current scope
                if (path.scope.hasBinding(LOCALS_NAME)) {
                    return;
                }

                // console.log('locals expanded to', Object.keys(path.scope.getAllBindings()));

                var vars = Object.keys(path.scope.getAllBindings()).map(function (label) {
                    return t.objectProperty(t.identifier(label), // key
                    t.identifier(label), // value
                    undefined, // computed?
                    true, // shorthand?
                    undefined // decorators array
                    );
                });

                path.replaceWith(t.objectExpression(vars));
            }
        }
    };
};

var LOCALS_NAME = "locals";