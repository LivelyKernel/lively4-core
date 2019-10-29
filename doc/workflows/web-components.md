# Web-Components

We provide a set of new HTML elemnts that can be loaded using `lively.create("lively-editor")` or using as tags `<lively-editor></lively-editor>`. 
All components are stored together with their prototype definitions (JavaScript classes in a module) in the [components directory](browse://src/components/).



## Open a component in a window

```javascript 
lively.openComponentInWindow("lively-table").then(comp => {
  comp.setFromArray([["A","B"],[2,3]])
})

```