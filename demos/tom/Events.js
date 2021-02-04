const excludedProperties = ['end', 'loc', 'start', 'traceID', 'type'];

export class Event {
    constructor(type, data, position) {
        this.type = type;
        this.position = position;
        this.data = data;

        this.changes = [];
        this.hasChanges = false;

        this.__type__ = 'Event';
    }

    addChange(changeEvent) {
        this.hasChanges = true;
        this.changes.push(changeEvent);
    }

    apply(ast) {
        for (const change of this.changes) {
            change.apply(ast);
        }
    }

    visit(object) {
        object.visitEvent(this);
    }
}

export class ErrorEvent extends Event {
    constructor() {
        super(...arguments);
        this.__type__ = 'ErrorEvent';
    }
    
    visit(object) {
        object.visitErrorEvent(this);
    }
}

export class ASTChangeEvent {
    constructor(id, propertyName, oldValue, newValue) {
        this.type = 'astChangeEvent';
        this.objectID = id;
        this.propertyName = propertyName;
        this.oldValue = oldValue;
        this.newValue = newValue;

        this.__type__ = 'ASTChangeEvent';
    }

    getNode(id, astNode) {
        if (astNode.type) {
            const isSearchedNode = value => value && value.traceID !== undefined && value.traceID.nodeID === id.nodeID;

            if (isSearchedNode(astNode)) {
                return astNode;
            }

            const keys = Object.keys(astNode).filter(key => !excludedProperties.includes(key));
            for (const key of keys) {
                const value = astNode[key];


                if (Array.isArray(value)) {
                    for (const entry of value) {
                        const node = this.getNode(id, entry)
                        if (isSearchedNode(node)) {
                            return node;
                        }
                    }

                    continue;
                }

                if (!value) {
                    continue;
                }

                switch (typeof value) {
                    case 'function':
                        // ignore functions
                        break;
                    case 'object':
                        // assume it is an astNode
                        const node = this.getNode(id, value)
                        if (isSearchedNode(node)) {
                            return node;
                        }
                        break;
                    default:
                        // ignore value
                }
            }
        }
    }
    
    resolve(copy, ast) {
        
        // Todo: optimize by caching: traceID -> ASTNode
        if(copy.isTraceID) {
            return this.getNode(copy, ast);
        } else if(Array.isArray(copy)) {
            const result = [];
            for(const entry of copy) {
                result.push(this.resolve(entry, ast));
            }
            return result;
        } else if(copy.traceID) { // is astNode
            const result = {};
            
            for(const key in copy) {
                // do not expand the reference of the object itself
                if(key === 'traceID') {
                    result[key] = copy[key];
                    continue;
                }
                result[key] = this.resolve(copy[key], ast);
            }
            
            return result;
        } else {
            return copy;
        }
    }

    apply(ast) {
        let astNode = this.getNode(this.objectID, ast);
        if (this.arrayProperty) {
            astNode = astNode[this.arrayProperty];
        }
        astNode[this.propertyName] = this.resolve(this.newValue, ast);
    }

    visit(object) {
        object.visitASTChangeEvent(this);
    }
}

export const eventTypes = {
    ASTChangeEvent: ASTChangeEvent,
    Event: Event,
    ErrorEvent: ErrorEvent
};