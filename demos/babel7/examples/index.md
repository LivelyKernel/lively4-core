# Examples and Test for our Babel7 Migration

- [babel7 package](edit://../lively4-babel7/src/babel7.js)
- [babel7 plugin](edit://src/external/babel/plugin-babel7.js)

Why are we not using Tests here? Because this would add another layer of indirection and won't allow us to the if it works in the actual system, e.g. these here are integration tests of Babel7 in Lively4. 

Testing our Babel7 migration relies on a lot of context and a lot of configuration files. The the individual parts work, has been shown by their Unit Tests etc, but we use these files here as feedback if the configuration and our usage of those works. We see if the complex system works by automatically probing inner parts. 

## Our Plugins

- [ ] babel-plugin-constraint-connectors-active-expression
- [ ] babel-plugin-constraint-connectors
- [ ] babel-plugin-polymorphic-identifiers
- [x] babel-plugin-rp19-jsx
- [x] babel-plugin-jsx-lively
- [ ] [babel-plugin-transform-do-expressions](edit://demos/babel7/examples/do-expressions.js)
- [x] babel-plugin-transform-function-bind
- [x] babel-plugin-syntax-async-generators
- [ ] babel-plugin-syntax-object-rest-spread
- [ ] babel-plugin-syntax-class-properties
- [ ] babel-plugin-var-recorder
- [ ] babel-plugin-ILA
- [ ] babel-plugin-databindings
- [ ] babel-plugin-active-expression-rewriting
- [ ] babel-plugin-databindings-post-process      
- [ ] babel-plugin-active-expression-proxies