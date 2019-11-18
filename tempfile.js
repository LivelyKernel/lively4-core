System.register(["active-expression-rewriting", "demos/foo2.js"], function (_export, _context) {
  "use strict";

  var _getLocal, _getMember, c;

  return {
    setters: [function (_activeExpressionRewriting) {
      _getLocal = _activeExpressionRewriting.getLocal;
      _getMember = _activeExpressionRewriting.getMember;
    }, function (_demosFoo2Js) {
      c = _demosFoo2Js.c;
    }],
    execute: function () {
      _recorder_.tempfile_js = _recorder_.tempfile_js || {};

      var _scope;

      "(var...)";
      Object.defineProperty(_recorder_.tempfile_js, "_scope", {
        get() {
          return _scope;
        },

        set(thisIsVererySecretVariableName) {
          _scope = thisIsVererySecretVariableName;
          return true;
        },

        enumerable: true,
        configurable: true
      });
      _recorder_.tempfile_js._scope = {};
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

      const __result__ = _getMember((self.__expressionAnalysisMode__ ? _getLocal(_scope, "c", c) : void 0, c), "d");

      _export("__result__", __result__);
    }
  };
});