System.register([], function (_export, _context) {
  "use strict";

  return {
    setters: [],
    execute: function () {
      _recorder_.tempfile_js = _recorder_.tempfile_js || {};
      var a = undefined;

      _export("a", a);

      if (!_recorder_.tempfile_js.hasOwnProperty("a")) {
        Object.defineProperty(_recorder_.tempfile_js, "a", {
          get() {
            return a;
          },

          set(thisIsVererySecretVariableName) {
            _export("a", a = thisIsVererySecretVariableName);

            return true;
          },

          enumerable: true,
          configurable: true
        });
      } else {
        _recorder_.tempfile_js.a = a;
      }

      _recorder_.tempfile_js.a = 3;
      console.log("a=" + _recorder_.tempfile_js.a);

      const __result__ = a;

      _export("__result__", __result__);
    }
  };
});