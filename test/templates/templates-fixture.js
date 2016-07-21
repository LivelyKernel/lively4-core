


// #TODO extract this to lively.components
export function loadComponent(name) {
  return new Promise(resolve => {
    var component = lively.components.createComponent(name);
    window.LastRegistered = component; // I don't understand this #TODO #Jens why does it work when this line is in?
    component.addEventListener("created", function (evt) {
      console.log("created component: " + name)
      evt.stopPropagation();
      resolve(component);
    }); 
    lively.components.loadByName(name);
  });
}