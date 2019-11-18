System.register([], function (_export, _context) {
  "use strict";

  var a;
  return {
    setters: [],
    execute: function () {
      _recorder_.tempfile_js = _recorder_.tempfile_js || {};
      "(var...)";
      Object.defineProperty(_recorder_.tempfile_js, "a", {
        get() {
          return a;
        },

        set(thisIsVererySecretVariableName) {
          a = thisIsVererySecretVariableName;
          return true;
        },

        enumerable: true,
        configurable: true
      });
      _recorder_.tempfile_js.a = [1, 2, 3];


      {

        let b = _recorder_.tempfile_js.a;
      }
    }
  };
});