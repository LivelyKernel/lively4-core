


// #TODO extract this to lively.components
export function loadComponent(name) {
  return new Promise(resolve => {
    var component = lively.components.createComponent(name);
    lively.components.loadByName(name)
    component.addEventListener("created", function (evt) {
      evt.stopPropagation();
      resolve(component);
    }); 
  })
}