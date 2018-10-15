# The Home of VivideJS

### naming

For consistent naming, here are some guidelines:

- **object** *\<any\>* - Any domain object we want to inspect using Vivide.
- **data** *\<any[]\>* - Any set of domain objects.
- **model** *\<VivideObject\>* - The framework-specific objects that wrap domain objects. They consist of three parts:
  - **object** *\<any\>* - The wrapped domain object.
  - **properties** *\<Annotations\>* - Object-specific rendering hints for widgets, e.g. `label`.
  - **children** *\<VivideObject[]\>* - Child nodes of this model node representing a part-whole-relationship. (cannot be accessed directly, instead they are computed lazily)
- **forest** *\<VivideObject[]\>* - Any set of models.

# transform steps

current:
```
[(input, output) => {
  for (let item of input) {
    output.push(item);
  }
}, {
  
}]
```

desired:
```
[async function*(input) {
  for await(let item of input) {
    yield item;
  }
}, {
  
}]
```
