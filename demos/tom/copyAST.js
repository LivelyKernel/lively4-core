function copyArrayOfRound(arr, roundNumber) {
    const copy = [];
    
    for(const entry of arr) {
        copy.push(copyASTPartsOfRound(entry, roundNumber));
    }
    
    return copy;
}

export default function copyASTPartsOfRound(object, roundNumber) {
    // simply check if the object is an astNode
    if (object && object.type) {
        // if already in AST return only a reference
        if (object.traceID && object.traceID.pluginRoundID !== roundNumber) {
            return object.traceID;
        }
        
        const objectCopy = {};
        const keys = Object.keys(object).filter(key => key[0] !== '_');
        for (const key of keys) {
            const value = object[key];

            if (Array.isArray(value)) {
                objectCopy[key] = copyArrayOfRound(value, roundNumber);

                continue;
            }

            if (value === null) {
                objectCopy[key] = value;
                continue;
            }

            switch (typeof value) {
                case 'function':
                    // ignore functions
                    break;
                case 'object':
                    // assume it is an astNode
                    objectCopy[key] = copyASTPartsOfRound(value, roundNumber);
                    break;
                default:
                    objectCopy[key] = value;
            }
        }
        
        return objectCopy;
    } else {
        if(Array.isArray(object)) {
            return copyArrayOfRound(object, roundNumber);
        } else {
            // do a simple copy
            return JSON.parse(JSON.stringify(object));
        }
    }
}