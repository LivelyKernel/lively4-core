System.register([], function (_export, _context) {
  "use strict";

  var foo;
  return {
    setters: [],
    execute: function () {
      _recorder_.tempfile_js = _recorder_.tempfile_js || {};

      _export("foo", foo = undefined);

      _export("foo", foo);

      Object.defineProperty(_recorder_.tempfile_js, "foo", {
        get() {
          return foo;
        },

        set(thisIsVererySecretVariableName) {
          _export("foo", foo = thisIsVererySecretVariableName);

          return true;
        },

        enumerable: true,
        configurable: true
      });
      _recorder_.tempfile_js.foo = 5;
    }
  };
});