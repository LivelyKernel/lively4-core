

export class MockEvent {
  
  constructor(element, options) {
    this.srcElement = element;
    this.generatePath(element)
    
    if (options) {
      Object.keys(options).forEach(ea => {
        this[ea] = options[ea]
      })
    }
  }
  
  generatePath(element) {
    if (!this.path) this.path = [];
    if (element) {
      this.path.push(element)
      this.generatePath(element.parentElement)
    }
  }

  preventDefault() {
    
  }
}





export function testWorld() {
  var world = document.body.querySelector("#testworld");
  if (world) return world;
  world = document.createElement("div");
  world.id = "testworld";
  world.isWorld = true
  world.style.backgroundColor = "gray"
  world.style.display = "none";
  document.body.appendChild(world);
  return world;
}

export function createHTML(htmlString) {
  var tmp = document.createElement("div")
  tmp.innerHTML = htmlString
  var element  = tmp.childNodes[0]
  testWorld().appendChild(element)
  return element
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