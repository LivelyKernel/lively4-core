# New SystemJS

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

