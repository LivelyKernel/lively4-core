## 2019-12-16 #VarRecorder 

Failing Test:

```javascript
expect(isFunction(function foo() {}), "function foo() {}").to.be.true;
    expect(isFunction(async function foo() {}), "async function foo() {}").to.be.true;
```