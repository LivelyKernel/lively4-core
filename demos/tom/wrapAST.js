import Trace from 'demos/tom/trace.js';
import copyAndWrapUnkownSubtree from 'demos/tom/copyAST.js';

export const excludedProperties = ['end', 'loc', 'start', 'traceID', 'type'];

function createObservingAccessorsOn(object, propertyName, observer) {
    if(!observer) debugger;
    const newPropertyName = '_' + propertyName;
    object[newPropertyName] = object[propertyName];
    Object.defineProperty(object, propertyName, {
        get() { return object[newPropertyName]; },
        set(value) {
            observer.notify(object.traceID, 
                            propertyName, 
                            copyAndWrapUnkownSubtree(object[newPropertyName], observer), 
                            copyAndWrapUnkownSubtree(value, observer));
            object[newPropertyName] = value;
        }
    })
}

const handler = (nodeID, observer, key) => {
    return {
        set: function(obj, prop, value) {
            // notify only on array entry change
            if (Number.isInteger(Number.parseInt(prop))) {
                observer.notify(nodeID, 
                                prop, 
                                copyAndWrapUnkownSubtree(obj[prop], observer), 
                                copyAndWrapUnkownSubtree(value, observer), 
                                key);
            }
            
            return Reflect.set(obj, prop, value);
        }
    }
};

function wrappedArray(array, nodeID, observer, key) {
    return new Proxy(array, handler(nodeID, observer, key));
}


// Wraps only the current ASTNode so the observer gets notified if
// changes are applied to it. Ignores children of ASTNode
export function wrapCurrentASTNode(astNode, observer) {
    if (astNode.traceID) {
        return;
    } else {
        astNode.traceID = window[Trace.traceIdentifierName].createTraceID();
    }

    const keys = Object.keys(astNode).filter(key => !excludedProperties.includes(key));
    for (const key of keys) {
        const value = astNode[key];


        if (Array.isArray(value)) {
            astNode[key] = wrappedArray(value, astNode.traceID, observer, key);

            // notify if the array is replaced
            createObservingAccessorsOn(astNode, key, observer);

            continue;
        }

        if (!value) {
            createObservingAccessorsOn(astNode, key, observer);
            continue;
        }

        switch (typeof value) {
            case 'function':
                // ignore functions
                break;
            default:
                createObservingAccessorsOn(astNode, key, observer);
        }
    }
}

// Wraps the current ASTNode and all its children so the observer gets notified if
// changes are applied to it
export default function wrapAST(astNode, observer, onlyUnknownNodes) {
    // simply check if the object is an astNode
    if (astNode && astNode.type) {
        if (onlyUnknownNodes) {
            if (astNode.traceID) {
                return;
            } else {
                astNode.traceID = window[Trace.traceIdentifierName].createTraceID();
            }
        }

        const keys = Object.keys(astNode).filter(key => !excludedProperties.includes(key));
        for (const key of keys) {
            const value = astNode[key];


            if (Array.isArray(value)) {
                for (const entry of value) {
                    wrapAST(entry, observer, onlyUnknownNodes);
                }

                astNode[key] = wrappedArray(value, astNode.traceID, observer, key);

                // notify if the array is replaced
                createObservingAccessorsOn(astNode, key, observer);

                continue;
            }

            if (!value) {
                createObservingAccessorsOn(astNode, key, observer);
                continue;
            }

            switch (typeof value) {
                case 'function':
                    // ignore functions
                    break;
                case 'object':
                    // assume it is an astNode
                    wrapAST(value, observer, onlyUnknownNodes);
                    // fallthrough as we want to know if a node is replaced
                default:
                    createObservingAccessorsOn(astNode, key, observer);
            }
        }
    }
}
