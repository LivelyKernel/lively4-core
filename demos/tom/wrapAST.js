const excludedProperties = ['end', 'loc', 'start', 'traceid', 'type'];

function copy(value) {
    return value; // JSON.parse(JSON.stringify(value));
}

function createObservingAccessorsOn(object, propertyName, observer) {
    const newPropertyName = '_' + propertyName;
    object[newPropertyName] = object[propertyName];
    Object.defineProperty(object, propertyName, {
        get() { return object[newPropertyName]; },
        set(value) {
            observer.notify(propertyName, object[newPropertyName], value)
            object[newPropertyName] = value;
        }
    })
}

const handler = (observer) => {
    return {
        set: function(obj, prop, value) {
            // Todo: Reflect.set()
            if(prop !== 'length') {
                // observer.notify(prop, copy(obj[prop]), copy(value));
            }
            obj[prop] = value;
            return true;
        }
    }
};

function wrappedArray(array, observer) {
    return new Proxy(array, handler(observer));
}

export default function wrapAST(astNode, observer) {
    // simply check if the object is an astNode
    if (astNode.type) {
        const keys = Object.keys(astNode).filter(key => !excludedProperties.includes(key));
        for (const key of keys) {
            const value = astNode[key];

            if (Array.isArray(value)) {
                for (const entry of value) {
                    wrapAST(entry, observer);
                }
                
                // Todo: do better handling
                astNode[key] = wrappedArray(value, observer);

                // notify if the array is replaced
                createObservingAccessorsOn(astNode, key, observer);

                continue;
            }
            
            if (value === null) {
                createObservingAccessorsOn(astNode, key, observer);
                continue;
            }

            switch (typeof value) {
                case 'function':
                    // ignore functions
                    break;
                case 'object':
                    // assume it is an astNode
                    wrapAST(value, observer);
                    // fallthrough as we want to know if a node is replaced
                default:
                    createObservingAccessorsOn(astNode, key, observer);
            }
        }
    }
}
