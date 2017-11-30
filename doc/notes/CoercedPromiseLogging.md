# Coerced Promise Logging

## Problem

- "printf" / console.log debugging can does not caputure call dependencies in async JavaScript code
- Example: module loading in SystemJS cannot be measures / logged with console.log or console.group statements
- Domain specific solution: write a custom domain specific logging framework
- Problem: tedious, not generic and not reusable 

## Idea: Make Aysnc Promise execution log aware

- use ContextJS to layer Promise.then 
- caputure console.log / console.group while executing a promise.
- replay and print log information in a semantic order based on the dependencies of each promise...


## Notes

### Basic Dynamically scoped COP

```javascript
cop.withLayers([SomeLayer], () => {
  doSomething()
})
```

### Basic Dynamically scoped COP

```javascript
cop.withLayers([SomeLayer], async () => {
  doSomethingFirst() // SomeLayer is active
  await someTime() 
  doSomething() // // SomeLayer might not be active....
})
```



## Workspace

```javascript
cop.withLayers([LogPromisesLayer], () => {

  var p = new Promise((r,f) => {
    r("A")
    // f("B")
  })


  return p.then( r => {
    console.log("result ")
  })
})
```

