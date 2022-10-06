# Examples and Test for our Babel7 Migration

- [babel7 package](edit://../lively4-babel7/src/babel7.js)
- [babel7 plugin](edit://src/external/babel/plugin-babel7.js)

Why are we not using Tests here? Because this would add another layer of indirection and won't allow us to the if it works in the actual system, e.g. these here are integration tests of Babel7 in Lively4. 

Testing our Babel7 migration relies on a lot of context and a lot of configuration files. The the individual parts work, has been shown by their Unit Tests etc, but we use these files here as feedback if the configuration and our usage of those works. We see if the complex system works by automatically probing inner parts. 

## Our Plugins

- [ ] [babel-plugin-constraint-connectors-active-expression](edit:///src/client/reactive/babel-plugin-constraint-connectors-active-expression/babel-plugin-constraint-connectors-active-expression.js)
- [ ] [babel-plugin-constraint-connectors](edit://src/client/reactive/babel-plugin-constraint-connectors/babel-plugin-constraint-connectors.js)
- [ ] [babel-plugin-polymorphic-identifiers](edit://src/client/reactive/babel-plugin-polymorphic-identifiers/babel-plugin-polymorphic-identifiers.js)
- [x] [babel-plugin-rp19-jsx](edit://src/client/reactive/rp19-jsx/babel-plugin-rp19-jsx.js)
- [x] [babel-plugin-jsx-lively]()
- [x] [babel-plugin-transform-do-expressions](edit://demos/babel7/examples/do-expressions.js)
- [x] [babel-plugin-transform-function-bind](edit://src/external/babel-plugin-transform-function-bind.js)
- [x] [babel-plugin-syntax-async-generators](edit://src/external/babel-plugin-syntax-async-generators.js)
- [ ] [babel-plugin-syntax-object-rest-spread](edit://src/external/babel-plugin-syntax-object-rest-spread.js)
- [ ] [babel-plugin-syntax-class-properties](edit://src/external/babel-plugin-syntax-class-properties.js)
- [ ] [babel-plugin-var-recorder](edit://src/external/babel-plugin-var-recorder.js)
- [ ] [babel-plugin-ILA](edit://src/client/reactive/babel-plugin-ILA/index.js)
- [ ] [babel-plugin-databindings](edit://src/client/reactive/babel-plugin-databindings/index.js)
- [X] [babel-plugin-active-expression-rewriting](edit://src/client/reactive/babel-plugin-active-expression-rewriting/index-babel7.js)
- [ ] [babel-plugin-databindings-post-process](edit://src/client/reactive/babel-plugin-databindings/post-process.js)
- [ ] [babel-plugin-active-expression-proxies](edit://src/client/reactive/babel-plugin-active-expression-proxies/index-babel7.js)