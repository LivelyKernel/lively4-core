

export function testWorld() {
  var world = document.body.querySelector("#testworld");
  if (world) return world;
  world = document.createElement("div");
  world.id = "testworld";
  world.style.backgroundColor = "gray"
  world.style.display = "none";
  document.body.appendChild(world);
  return world;
}


// #TODO extract this to lively.components
export function loadComponent(name) {

  var world = testWorld();
  var component = lively.components.createComponent(name);
  component.isInTesting = true;

  return lively.components.openIn(world, component);
    
    // window.LastRegistered = component; // I don't understand this #TODO #Jens why does it work when this line is in?
    // component.addEventListener("created", function (evt) {
    //   console.log("[TEST LOAD ] " + name + " LOADED " + evt.path[0].tagName)
    //   if (evt.path[0] !== component) return; // not me
    //   console.log("created component: " + name)
    //   evt.stopPropagation();
    //   resolve(component);
    // }); 
    // lively.components.loadByName(name);

}