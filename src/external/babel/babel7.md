# Babel 7


- starting point is: https://github.com/systemjs/systemjs-babel
  - works with new https://github.com/systemjs/systemjs
  
- babel itself is written in typescript and we have to compile it https://github.com/babel/babel
  - use webpack... and copy it to `/src/external/babel7/`
  - add additional behavior to src/external/babel/plugin-babel2.js to use babel7 to transpile code when needed....
    - for typescript?
    - for all files in demos/babel7 ?
      - add lots of examples to see if they work
        - cool new features like `foo.?bar` should work there
        - babel6 and babel7 files could depend on each other, because systemjs is shared
      - port our plugins to babel7?
        - var recorder
        - active expressions
        - babylonian programming
        - port our plugins to babel7?
        - debugging-plugin.js 
        - assignment-plugin.js 
        - babel-plugin-tracer.js 
        - condition-plugin.js 
        - defect-demo-plugin.js 
        - enumerationPlugin.js 
        - playground.js 
        - plugin-backup.js 
        - index.js 
        - post-process.js 
        - babel-plugin-polymorphic-identifiers.js 
        - new-implementation-test-plugin.js 
        - babel-plugin-locals.js 
        - babel-plugin-var-recorder-dev.js 
        
  
  