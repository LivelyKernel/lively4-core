// transpiled version of code found here: https://stackoverflow.com/questions/19752516/renaming-object-keys-recursively

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

export function deepMapKeys(originalObject, callback) {
  return Object.keys(originalObject || {}).reduce(function (newObject, key) {
    var newKey = callback(key);
    var originalValue = originalObject[key];
    var newValue = originalValue;
    if (Array.isArray(originalValue)) {
      newValue = originalValue.map(function (item) {
        return deepMapKeys(item, callback);
      });
    } else if ((typeof originalValue === 'undefined' ? 'undefined' : _typeof(originalValue)) === 'object') {
      newValue = deepMapKeys(originalValue, callback);
    }
    return _extends({}, newObject, _defineProperty({}, newKey, newValue));
  }, {});
}