import { PropertyAccessor } from './property-accessor.js';
import { isPrimitive } from '../utils.js';

const LISTENERS_BY_ACCESSOR = new Map();

export class Listener {
    constructor(obj, propName) {
        this.selectionItems = new Set();

        this.propertyAccessor = new PropertyAccessor(obj, propName);
        this.propertyAccessor.setterCallback(newValue => this.newValueSet(newValue));
    }

    static watchProperty(obj, propName) {
        var mapObj;
        if(LISTENERS_BY_ACCESSOR.has(obj)) {
            mapObj = LISTENERS_BY_ACCESSOR.get(obj);
        } else {
            mapObj = {};
            LISTENERS_BY_ACCESSOR.set(obj, mapObj);
        }

        if(!mapObj.hasOwnProperty(propName)) {
            mapObj[propName] = new Listener(obj, propName);
        }

        return mapObj[propName];
    };

    addHandler(selectionItem) {
        this.selectionItems.add(selectionItem);
        selectionItem.propertyAccessors.add(this);
    }

    newValueSet(newValue) {
        if(!isPrimitive(newValue)) {
            this.recalculate();
        }

        this.applyCallbacks();
    }

    applyCallbacks() {
        this.selectionItems.forEach(function(selectionItem) {
            selectionItem.propertyAssigned();
        });
    }

    recalculate() {
        console.log('should recalculate');

        var selectionItems = [];
        this.selectionItems.forEach(function(selectionItem) {
            selectionItems.push(selectionItem);
        });

        selectionItems.forEach(function(selectionItem) {
            selectionItem.removeListeners();
        });
        selectionItems.forEach(function(selectionItem) {
            selectionItem.installListeners();
        });
    }
}
