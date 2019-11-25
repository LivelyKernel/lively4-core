## 2019-11-19 #VarRecorder and #ActiveExpressions

We run into an integration issue... #ActiveExpressions interfere with our new rewriting of VarRecorder.

The test case:

```javascript
"use proxies for aexprs";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Proxy-based Implementation', () => {

  it('placeholder behavior', () => {
    const obj = { prop: 42 };
    expect(obj).to.equal('your proxy');
  });

  xit('detecting assignment to a property with proxies', () => {
    const obj = { prop: 42 };
    const spy = sinon.spy();
    const ae = aexpr(() => obj.prop);
    ae.onChange(spy);

    obj.prop = 17;

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith(17);
  });

});
```

## Rewritten in our old system

```javascript
(function(System, SystemJS) {"use proxies for aexprs";

System.register(['active-expression-proxies', 'src/external/chai.js', 'src/external/sinon-3.2.1.js', 'src/external/sinon-chai.js'], function (_export, _context) {
  "use strict";

  var _wrap, chai, expect, sinon, sinonChai;

  return {
    setters: [function (_activeExpressionProxies) {
      _wrap = _activeExpressionProxies.wrap;
    }, function (_srcExternalChaiJs) {
      chai = _srcExternalChaiJs.default;
      expect = _srcExternalChaiJs.expect;
    }, function (_srcExternalSinon321Js) {
      sinon = _srcExternalSinon321Js.default;
    }, function (_srcExternalSinonChaiJs) {
      sinonChai = _srcExternalSinonChaiJs.default;
    }],
    execute: function () {
      _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js = _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js || {};
      _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.expect = expect;
      _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.chai = chai;
      _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.sinon = sinon;
      _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.sinonChai = sinonChai;

      _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.chai.use(_recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.sinonChai);

      describe('Proxy-based Implementation', () => {

        it('placeholder behavior', () => {
          const obj = _wrap({ prop: 42 });
          _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.expect(obj).to.equal('your proxy');
        });

        xit('detecting assignment to a property with proxies', () => {
          const obj = _wrap({ prop: 42 });
          const spy = _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.sinon.spy();
          const ae = aexpr(() => obj.prop);
          ae.onChange(spy);

          obj.prop = 17;

          _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.expect(spy).to.have.been.calledOnce;
          _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.expect(spy).to.have.been.calledWith(17);
        });
      });
    }
  };
});
})(System, System);
```


### Broken transpilation  in new VarRecorder ....

```javascript
(function(System, SystemJS) {"use proxies for aexprs";

System.register(['active-expression-proxies', 'src/external/chai.js', 'src/external/sinon-3.2.1.js', 'src/external/sinon-chai.js'], function (_export, _context) {
  "use strict";

  var _wrap, chai, expect, sinon, sinonChai;

  return {
    setters: [function (_activeExpressionProxies) {
      _wrap = _activeExpressionProxies.wrap;
    }, function (_srcExternalChaiJs) {
      chai = _srcExternalChaiJs.default;
      expect = _srcExternalChaiJs.expect;
    }, function (_srcExternalSinon321Js) {
      sinon = _srcExternalSinon321Js.default;
    }, function (_srcExternalSinonChaiJs) {
      sinonChai = _srcExternalSinonChaiJs.default;
    }],
    execute: function () {
      _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js = _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js || {};
      Object.defineProperty(_recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js, 'expect', _wrap({
        get() {
          return expect;
        },

        set(thisIsVererySecretVariableName) {
          expect = thisIsVererySecretVariableName;
          return true;
        },

        enumerable: true,
        configurable: true
      }));
      Object.defineProperty(_recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js, 'chai', _wrap({
        get() {
          return chai;
        },

        set(thisIsVererySecretVariableName) {
          chai = thisIsVererySecretVariableName;
          return true;
        },

        enumerable: true,
        configurable: true
      }));
      Object.defineProperty(_recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js, 'sinon', _wrap({
        get() {
          return sinon;
        },

        set(thisIsVererySecretVariableName) {
          sinon = thisIsVererySecretVariableName;
          return true;
        },

        enumerable: true,
        configurable: true
      }));
      Object.defineProperty(_recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js, 'sinonChai', _wrap({
        get() {
          return sinonChai;
        },

        set(thisIsVererySecretVariableName) {
          sinonChai = thisIsVererySecretVariableName;
          return true;
        },

        enumerable: true,
        configurable: true
      }));

      _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.chai.use(_recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.sinonChai);

      describe('Proxy-based Implementation', () => {

        it('placeholder behavior', () => {
          const obj = _wrap({ prop: 42 });
          _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.expect(obj).to.equal('your proxy');
        });

        xit('detecting assignment to a property with proxies', () => {
          const obj = _wrap({ prop: 42 });
          const spy = _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.sinon.spy();
          const ae = aexpr(() => obj.prop);
          ae.onChange(spy);

          obj.prop = 17;

          _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.expect(spy).to.have.been.calledOnce;
          _recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js.expect(spy).to.have.been.calledWith(17);
        });
      });
    }
  };
});
})(System, System);
```

And we get the following error:

```
lively-container.js:1167 Uncaught (in promise) TypeError: Property description must be an object: your proxy
    at Function.defineProperty (<anonymous>)
    at Object.execute (VM1419 active-expression-proxies.spec.js!transpiled:21)
    at doExecute (eval at loadJavaScript (boot.js:14), <anonymous>:1606:13)
    at doEvaluate (eval at loadJavaScript (boot.js:14), <anonymous>:1554:13)
    at ensureEvaluate (eval at loadJavaScript (boot.js:14), <anonymous>:1482:13)
    at eval (eval at loadJavaScript (boot.js:14), <anonymous>:985:14)
    at async Function.reloadModule (lively.js:217)
    at async HTMLElement.loadTestModule (lively-container.js:696)
    at async HTMLElement.onSave (lively-container.js:1147)
```

Which should be this line:

```javascript
Object.defineProperty(_recorder_._src_client_reactive_test_active_expression_proxies_active_expression_proxies_spec_js, 'expect', _wrap({
```

And without the transpilation it looks like this:

```javascript
Object.defineProperty(_recorder_.tempfile_js, 'expect', {
  get() {
    return expect;
  },
```

So @onsetsu, the4 `_wrap` seems to be the problem?







