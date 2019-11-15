System.register([], function (_export, _context) {
  "use strict";

  var c;
  return {
    setters: [],
    execute: function () {
      _recorder_.tempfile_js = _recorder_.tempfile_js || {};

      _export("c", c = undefined);

      _export("c", c);

      if (!_recorder_.tempfile_js.hasOwnProperty("c")) {
        Object.defineProperty(_recorder_.tempfile_js, "c", {
          get() {
            return c;
          },

          set(thisIsVererySecretVariableName) {
            _export("c", c = thisIsVererySecretVariableName);

            return true;
          },

          enumerable: true,
          configurable: true
        });
      } else {
        _recorder_.tempfile_js.c = c;
      }

      _recorder_.tempfile_js.c = 3;
    }
  };
});