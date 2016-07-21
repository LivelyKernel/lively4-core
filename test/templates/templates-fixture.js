


// #TODO extract this to lively.components
export function loadComponent(name) {
  return new Promise(resolve => {
    var component = lively.components.createComponent(name);
    component.addEventListener("created", function (evt) {
      "created component: " + name
      evt.stopPropagation();
      resolve(component);
    }); 
    lively.components.loadByName(name);
  });
}