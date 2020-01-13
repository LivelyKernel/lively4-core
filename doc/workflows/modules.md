# Modules

We use ECMAScript modules. See [Exploring ES6. Modules](https://exploringjs.com/es6/ch_modules.html) and [ES modules: A cartoon deep-dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/) for explanations.... 

The short version looks like this. Defining a module in `foo.js`:

```javascript
export default class Foo {
  static bar() {
    // do something
  }
}
```

And using it:

```javascript
import Foo from "./foo.js"

Foo.bar()

```

## External Code

By using modern JavaScript modules (import/export), we can structure the project internally quite well. But integrating external projects and libraries into that world is still an #OpenProblem. We used three approaches, but we are stuck with the first...

1. **Copy a self contained module into "[/src/external](../../src/external/)"**
    - pros: it is stable, and we can directly edit and debug them (e.g. insert "import" statements or customize them)
    - cons: they don't update themselves
2. Clone whole other repositories as subtrees into our repository
    - pros: same as copy, and we can update them and push changes back #Deprectated
    - cons: 
      - not every repository has usable packages without building them first
      - can get pretty big 
3. Use npm: #Deprectated
    - pros: 
      - is fast and updates itself
      - does not increase our source
      - can use building to actually produce something in usable in the browser
    - cons: 
      - hard to customize
      - requires npm on the "server" side

