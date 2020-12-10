"enable aexpr";

/*MD ## Fuck it, ... here come Connections Again 
  - has nothing to do yet with the connection in the Halo
  - is also completely differently implemented from old lively-kernel connections
MD*/
export default class Bindings {
  
  static connect(object, name, element, elementPropertyName="value") {
    aexpr(() => element[elementPropertyName]).onChange(v => object[name] = v);
    aexpr(() =>  object[name]).onChange(v => element[elementPropertyName] = v);
    element[elementPropertyName] = object[name] // force first update
  }
  
}