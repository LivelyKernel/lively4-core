System.register(["demos/foo.js"], function (_export, _context) {
  "use strict";

  var c;
  return {
    setters: [function (_demosFooJs) {
      c = _demosFooJs.c;
    }],
    execute: function () {
      _recorder_.tempfile_js = _recorder_.tempfile_js || {};
      Object.defineProperty(_recorder_.tempfile_js, "c", {
        get() {
          return c;
        },

        set(thisIsVererySecretVariableName) {
          c = thisIsVererySecretVariableName;
          return true;
        },

        enumerable: true,
        configurable: true
      });
    }
  };
});