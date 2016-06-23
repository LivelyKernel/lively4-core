const PROPERTY_ACCESSOR_NAME = 'wrappedValue';

export class PropertyAccessor {
    constructor(obj, propName) {
        this.safeOldAccessors(obj, propName);

        try {
            obj.__defineGetter__(propName, (function() {
                if(propName === 'prop') debugger;
                obj;
                return this[PROPERTY_ACCESSOR_NAME];
            }).bind(this));
        } catch (e) { /* Firefox raises for Array.length */ }
        var newGetter = obj.__lookupGetter__(propName);
        if (!newGetter) {
            // Chrome silently ignores __defineGetter__ for Array.length
            this.externalVariables(solver, null);
            return;
        }

        obj.__defineSetter__(propName, (function(newValue) {
            var returnValue = this[PROPERTY_ACCESSOR_NAME] = newValue;
            console.log('newValue for', obj, propName, newValue);
            this.setPropertyWith(newValue);
            return returnValue;
        }).bind(this));
    }

    safeOldAccessors(obj, propName) {
        // take existing getter, if existent, and assign to
        var existingSetter = obj.__lookupSetter__(propName),
            existingGetter = obj.__lookupGetter__(propName);
        if (existingGetter && existingSetter) {
            this.__defineGetter__(PROPERTY_ACCESSOR_NAME, existingGetter);
            this.__defineSetter__(PROPERTY_ACCESSOR_NAME, existingSetter);
        }

        // assign old value to new slot
        if (!existingGetter &&
            !existingSetter &&
            obj.hasOwnProperty(propName)
        ) {
            this[PROPERTY_ACCESSOR_NAME] = obj[propName];
        }
    }

    setterCallback(callback) {
        this.callbackForSetProperty = callback;
    }

    setPropertyWith(newValue) {
        this.callbackForSetProperty && this.callbackForSetProperty(newValue);
    }
}
