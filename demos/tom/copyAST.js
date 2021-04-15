import { wrapCurrentASTNode } from 'demos/tom/wrapAST.js';

function copyArray(array, observer) {
    return array.map(elm => copyAndWrapUnkownSubtree(elm, observer));
}

// Copies subtree of new ASTNodes. Every ASTNode it visits gets wrapped and a traceID assigned. 
export default function copyAndWrapUnkownSubtree(object, observer) {
    // simply check if the object is an astNode
    if (object && object.type) {
        // if already in AST return only a reference
        if (object.traceID) {
            return object.traceID;
        }
        
        wrapCurrentASTNode(object, observer);
        
        const objectCopy = {};
        const keys = Object.keys(object).filter(key => key[0] !== '_');
        for (const key of keys) {
            const value = object[key];

            if (Array.isArray(value)) {
                objectCopy[key] = copyArray(value, observer);

                continue;
            }

            if (!value) {
                objectCopy[key] = value;
                continue;
            }

            switch (typeof value) {
                case 'function':
                    // ignore functions
                    break;
                case 'object':
                    objectCopy[key] = copyAndWrapUnkownSubtree(value, observer);
                    break;
                default:
                    objectCopy[key] = value;
            }
        }
        
        return objectCopy;
    } else {
        if(Array.isArray(object)) {
            return copyArray(object, observer);
        } else if (!object) {
            return object;
        } else {
            // do a simple copy
            return JSON.parse(JSON.stringify(object));
        }
    }
}