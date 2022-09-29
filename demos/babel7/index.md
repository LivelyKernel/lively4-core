# Migration Path to Babel7?


## Open Issues


- [ ] make CodeMirror use babel7 as needed.
  - [ ] for syntax checking
  - [ ] for linting
- [ ] make our plugins work with babel 7 
- [ ] refactor and cleanup `src/external/babel/plugin-babel6.js`
- [ ] migrate to latest SystemJS


## New SystemJS

- https://babeljs.io/docs/en/v7-migration
- https://github.com/systemjs/systemjs-babel

```markdown

<script src="systemjs/dist/s.js"></script>
<script src="dist/systemjs-babel.js"></script>
<script>
  // TypeScript modules supported with ".ts" extension
   System.import('./ts-module.ts');
  
  // ES modules
  System.import('./es-module.js');
</script>



```


- [x] establish a second new system js world inside of lively as upgrade strategy
- [ ] customize systemjs-babel.js to use new babel7



## Possible Ways to Go

- New SystemJS + Babel7 + Typescript works

### New SystemJS + Babel7 and Babel6

- Webpack Core....
- a) webpack all additional plugins separately
- b) include all transformations in webpack and expose them as needed...
- Idee: look systemjs-babel project... 
  - lots of webpacking
    - expose core and plugsins
  - configure -> MOVE to runtime
  - overwriting systemjs.fetch -> MOVE TO Runtime
    - incl. transpile etc.
- make Babel6 available in new SystemJS... 
- rewrite boot.js 
- rewrite lively.js to use new systemjs
  - e.g. undloading and (re-)loading of modules
- what about systemjs.config



### Old SystemJS + Babel6 ... with addition of Babel7

- webpack Babel7 and plugins
- customize old systemjs config to OPTIONALY use new Babel7 
  - 
  
  
  



