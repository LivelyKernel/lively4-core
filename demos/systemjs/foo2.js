System.register([], function (_export, _context) {
  "use strict";

  var __SystemJSRewritingHack, x;
  function foo() {
    return "foo";
  }
  _export("foo", foo);
  return {
    setters: [],
    execute: function () {
      __SystemJSRewritingHack = {};
      _recorder_._demos_systemjs_foo_js = _recorder_._demos_systemjs_foo_js || {};
      Object.defineProperty(_recorder_._demos_systemjs_foo_js, "foo", {
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
      console.log("Foo was here!");
      _export("x", x = 42);
      Object.defineProperty(_recorder_._demos_systemjs_foo_js, "x", {
        get() {
          return x;
        },
        set(thisIsVererySecretVariableName) {
          _export("x", x = thisIsVererySecretVariableName);
          return true;
        },
        enumerable: true,
        configurable: true
      });
    }
  };
});