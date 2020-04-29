## Getting Started

### Access the Library

Using NPM
```
npm install object-queries
```

From Github
- Get the source code from the [github repository](https://github.com/onsetsu/active-collection-prototype)
- run `npm install`

### Testing

Manual Testing
- optionally: run the Python server (Python 2.X required)
- point your browser to the `run-tests.html` in the top folder

To run the same tests automatically in a test suite:
```
npm test
```

### Update Documentation
```
jsdoc src/select.js src/view.js src/withlogging.js
```

### Contributing

The project is structured as follows:
- *lib* dependencies such as babelsberg and a modified require.js library
- *src* main source code
  - *select.js* provides the `select` function
  - *withLogging.js* have to be invoked in order to track objects
- *tests* the mocha tests
