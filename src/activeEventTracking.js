function difference(list, without) {
    return list.filter(obj => !without.some(obj2 => obj === obj2));
}

function diff(newList, oldList) {
    var enteredItems = difference(newList, oldList);
    var updatedItems = difference(newList, enteredItems);
    var exitedItems = difference(oldList, newList);

    return [enteredItems, updatedItems, exitedItems];
}

class Notifier {
    constructor(eventType, selector, callback, useCapture) {
        this._eventType = eventType;
        this._selector = selector;
        this._callback = callback;
        this._useCapture = useCapture;

        this._selectedElements = [];

        // install global listener
        this._globalListener = () => this._update();
        document.documentElement.addEventListener(this._eventType, this._globalListener, true);

        this._update();
    }

    _update(newSelection = document.querySelectorAll(this._selector)) {
        let oldSelection = this._selectedElements;
        this._selectedElements = Array.from(newSelection);

        let [newItems, _, oldItems] = diff(this._selectedElements, oldSelection);

        newItems.forEach(item => item.addEventListener(this._eventType, this._callback, this._useCapture));
        oldItems.forEach(item => item.removeEventListener(this._eventType, this._callback, this._useCapture));
    }

    uninstall() {
        document.documentElement.removeEventListener(this._eventType, this._globalListener, true);
        this._update([]);
    }
}

export default function notify(...args) {
    return new Notifier(...args);
}
