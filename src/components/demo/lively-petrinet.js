"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';



export default class LivelyPetrinet extends Morph {
  

  async initialize() {
    this.windowTitle = "LivelyPetrinet";
    this.registerButtons();
    this.mouseIsOnNode = false;
                
    lively.addEventListener("OnDblClick", this, "dblclick", (evt) => this.onDblClick(evt))
    
    lively.html.registerKeys(this); // automatically installs handler for some methods

    lively.addEventListener("MouseDraw", this, "mousemove", evt => this.onMouseMove(evt));

    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false)

}
  
  
  
  // Access Methods
  
  
  
  get places() {
    return Array.from(this.querySelectorAll("lively-petrinet-place"));
  }
  
  get transitions() {
    return Array.from(this.querySelectorAll("lively-petrinet-transition"));
  }
  
  get connectors() {
    return Array.from(this.querySelectorAll("lively-petrinet-edge"))
  }
  
  
  
  // Methods For Simulation
  
  
  
  getState() {
    const numberOfTokens = {}
    for (const place of this.places) {
      numberOfTokens[place.placeId] = place.numberOfTokens();
    }
    return numberOfTokens;

  }
  
  saveState() {
    this.testState = this.getState();
  }
  
  
  async setState(state) {
    for (const placeId of Object.keys(state)) {
      const place = this.places.filter(place => place.placeId === placeId)[0];
      place.deleteAllTokens();
      for (let i = 0; i < state[placeId]; i++) {
        place.addToken();
      }
    }
  }
  
  onStep() {
    for (const transition of this.transitions) {
      const placesBefore = this.getPlacesBefore(transition);
      const placesAfter = this.getPlacesAfter(transition);
      const firingIsPossible = placesBefore.every((place) => place.tokens.length > 0);
      const transitionAllowsFiring = transition.isActiveTransition();
      if (!firingIsPossible || !transitionAllowsFiring) {
        continue;
      }
      for (const place of placesBefore) {
        place.deleteToken();
      }
      for (const place of placesAfter) {
        place.addToken();
      }
      }
    }

  getPlacesBefore(transition) {
    let placesBefore = [];
    for (const connector of this.connectors) {
      if (connector.toComponent == transition) {
        placesBefore.push(connector.fromComponent);
      }
    }
    return placesBefore;
  }
  
  getPlacesAfter(transition) {
    let placesAfter = [];
    for (const connector of this.connectors) {
      if (connector.fromComponent == transition) {
        placesAfter.push(connector.toComponent);
      }
    }
    return placesAfter;
  }

  
  
  /* Lively-specific API */
  

  
  // store something that would be lost
  livelyPrepareSave() {
    
  }
    

  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();

        var menu = new ContextMenu(this, [
              ["add place", () => this.addPlace()],
              ["delete place", () => this.deletePlace()],
              ["add transition", () => this.addTransition()],
              ["delete transition", () => this.deleteTransition()],
          
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  async livelyExample() {
    await this.addPlace();
    this.places[0].addToken();
    await this.addPlace();
    await this.addTransition();
    lively.setPosition(this.places[1], pt(500, 100))
    lively.setPosition(this.transitions[0], pt(300, 100));
    const connector1 = await(<lively-petrinet-edge></lively-petrinet-edge>);
    this.appendChild(connector1);
    connector1.connectPetrinetComponents(this.places[0], this.transitions[0]);
    const connector2 = await(<lively-petrinet-edge></lively-petrinet-edge>);
    this.appendChild(connector2);
    connector2.connectPetrinetComponents(this.transitions[0],this.places[1]);
  }
  
  
  
  // Handle Connector Creation
  
  
  
  async onMouseMove(evt) { 
    const cursor = this.get("#cursor");
    const windowPosition = lively.getGlobalPosition(this);
    const x = evt.clientX - windowPosition.x;
    const y = evt.clientY - windowPosition.y;
    const offset = 5;
    if (this.connectionIsStarted()) {
      lively.setPosition(cursor, pt(x - offset,y - offset));
    }
  }
  
  connectionIsStarted() {
    const cursor = this.get("#cursor");
    const startedConnection = cursor != null;
    return startedConnection;
  }
  
  onDblClick(evt) {
    if (this.mouseIsOnNode || !this.connectionIsStarted())      {
        return;
    }
    this.deleteUnfinishedConnector(this.get("#cursor"),   this.unfinishedConnector);
  }
  
  async deleteUnfinishedConnector(cursor, connector) {
    cursor.remove();
    connector.remove();
  }
  
  async startConnectionFrom(element) {
    //Create Connector
    var connector = await (<lively-petrinet-edge></lively-petrinet-edge>);
    this.append(connector);
    connector.connectFromPetrinetComponent(element);
    
    // Create Cursor That Moves Connector
    var cursor = await (<div></div>)
    cursor.style.backgroundColor = "blue"
    cursor.id = "cursor"
    lively.setExtent(cursor, pt(5,5))
    lively.setPosition(cursor, lively.getPosition(element));
    this.append(cursor);
    
    //Connect Cursor To Connector
    connector.connectTo(cursor);
    this.unfinishedConnector = connector;

    return connector
  }
  
  async connectTo(element) {
    if (!this.unfinishedConnector) {
      return;
    }
    const fromElement = this.unfinishedConnector.fromElement;
    if (fromElement == element) {
      this.deleteUnfinishedConnector(this.get("#cursor"), this.unfinishedConnector);
      return
    }
    this.unfinishedConnector.connectToPetrinetComponent(element);
    this.get("#cursor").remove();
  }
  
  async manageNewConnection(element) {
    if (!this.connectionIsStarted()) {
      await this.startConnectionFrom(element);
    } else {
      await this.connectTo(element);
    }
  }
  
  updateAllConnectors() {
    for (const connector of this.connectors) {
      connector.updateConnector();
    }
  }
  
  
  
  
  
  // Add and Delete Elements
  
  
  
  async addPlace() {
      var node = await (<lively-petrinet-place></lively-petrinet-place>);
      this.initializeElement(node);
      this.appendChild(node);
  }
  
  async addListeners(element) {
      element.onmouseover = () => this.mouseIsOnNode = true;
      element.onmouseout = () => this.mouseIsOnNode = false;
      lively.addEventListener("onDblClick", element.graphicElement(), "dblclick", () =>     this.manageNewConnection(element));
  }
  
  setInitialPosition(element) {
      var x = Math.random() * 50 + 50;
      var y = Math.random() * 50 + 50;
      lively.setPosition(element, pt(x,y));
  }
  
  async initializeElement(element) {
      this.setInitialPosition(element);
      this.addListeners(element);
  }

  
  async deletePlace(){
    this.places[0].remove()
  }
  
  
  async addTransition() {
    var transition = await (<lively-petrinet-transition></lively-petrinet-transition>);
    this.initializeElement(transition);
    this.appendChild(transition);
  }

  
  async deleteTransition(){
      this.transitions[0].remove()
  }
  
  
  
  
// Array Helper Methods

  
  
  copyElements(elementsArray) {
     return elementsArray.map(element => element.cloneNode());
  }
  
  deleteAllElements(elementsArray) {
    const arrayLength = elementsArray.length;
    for (let i = 0; i < arrayLength; i++) {
      // Is it risky to delete While in For Loop?
      elementsArray[i].remove();
    }
  }
  
  async addAllElements(elementsArray) {
    for (const element of elementsArray) {
      await this.appendChild(element);
    }
  }

}