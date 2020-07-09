"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';



export default class LivelyPetrinet extends Morph {
  
  
  
  // Initialization
  
  async initialize() {
    this.windowTitle = "LivelyPetrinet";
    lively.setExtent(this.parentNode, pt(1280,860));
    this.registerButtons();
    this.mouseIsOnNode = false;
  
    
    this.addAllListeners();
    await this.initializeConnectors();
    this.updateConnectorPosition();
    
    this.selectedElement = undefined
  }
  
  addAllListeners() {
    lively.addEventListener("OnDblClick", this, "dblclick", (evt) => this.onDblClick(evt))

    lively.addEventListener("MouseDraw", this, "mousemove", evt => this.onMouseMove(evt));
    

    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false)
    
    for (const place of this.places) {
      this.addListeners(place)
    }
    
    for (const transition of this.transitions) {
      this.addListeners(transition)
    }
  }
  
  // The connectors don't behave probperly when reloaded, because they are not connected to the components with the previous data-lively-id anymore. So we remove them and create new connectors instead (updating didnt properly work)
  async initializeConnectors() {
    for (const connector of this.connectors) {
      const fromComponent = this.getComponentFrom(connector.fromComponentId);
      const toComponent = this.getComponentFrom(connector.toComponentId);
      if (!fromComponent || !toComponent) {
        lively.error("Connector is not connected to component");
      }
      await this.addConnector(fromComponent, toComponent);

      connector.remove();
    }
  }
  
  
  
  // Access Methods
  
  
  
  get places() {
    return Array.from(this.querySelectorAll("lively-petrinet-place"));
  }
  
  get transitions() {
    const probTransitions = Array.from(this.querySelectorAll("lively-petrinet-prob-transition"));
    const codeTransitions = Array.from(this.querySelectorAll("lively-petrinet-code-transition"));
    return [...probTransitions, ...codeTransitions]
  }
  
  get connectors() {
    return Array.from(this.querySelectorAll("lively-petrinet-edge"))
  }
  
  
  
  // Methods For Simulation
  
  
  
  start() {
    for (const place of this.places) {
      place.start();
    }
  }
  
  setState(step) {
    for (const place of this.places) {
      place.setState(step);
    }
  }
  
  resetToState(step) {
    for (const place of this.places) {
      place.resetToState(step);
    }
  }
  
  getCurrentStep() {
    return this.places[0].history.length
  }
  
  *stepUntilFired() {
    while (true) {
       for (const transition of this.transitions) {
        if (this.canFire(transition)) {
          this.fire(transition);
          yield;
        }
        this.persistPlaceState();
      }
    }
  }
  
  async onStep() {
       for (const transition of this.transitions) {
          if (this.canFire(transition)) {
            await this.fire(transition);
          }
      }
      this.persistPlaceState();
  }
  
  
  canFire(transition) {
      const placesBefore = this.getFirstComponents(this.getConnectorsBefore(transition));
      const placesAfter = this.getSecondComponents(this.getConnectorsAfter(transition));
      const firingIsPossible = placesBefore.every((place) => place.tokens.length > 0);
      const transitionAllowsFiring = transition.isActiveTransition();
      if (!firingIsPossible || !transitionAllowsFiring) {
        return false;
      }
      return true;
  }
  
  async fire(transition) {
      const connectorsBefore = this.getConnectorsBefore(transition);
      const connectorsAfter = this.getConnectorsAfter(transition);
      for (const place of this.getFirstComponents(connectorsBefore)) {
        place.deleteToken();
      }
    
      // Animation
      await Promise.all(connectorsBefore.map(connector => connector.animateMovingToken()));
    
      await Promise.all(connectorsAfter.map(connector => connector.animateMovingToken()));
    
      for (const place of this.getSecondComponents(connectorsAfter)) {
        await place.addToken();
      }
      return
  }
  
  getFirstComponents(connectors) {
    return connectors.map(connector => this.getComponentFrom(connector.fromComponentId));
  }
  
  getSecondComponents(connectors) {
    return connectors.map(connector => this.getComponentFrom(connector.toComponentId));
  }
  
  getConnectorsBefore(element) {
    let connectorsBefore = [];
    for (const connector of this.connectors) {
      if (connector.toComponentId == element.componentId) {
        connectorsBefore.push(connector);
      }
    }
    return connectorsBefore;
  }
  
  
  getConnectorsAfter(element) {
    let connectorsAfter = [];
    for (const connector of this.connectors) {
      if (connector.fromComponentId == element.componentId) {
        connectorsAfter.push(connector);
      }
    }
    return connectorsAfter;
  }
  
  getComponentFrom(id) {
    const allComponents = [...this.places, ...this.transitions];
    for (const component of allComponents) {
      if (component.componentId == id) {
        return component;
      }
    }
  }
  
  persistPlaceState() {
    for (const place of this.places) {
      place.persistState();
    }
  }

  
  
  // Lively Methods
  
  
  
  onContextMenu(evt) {
    console.log(evt);
    if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();
        const mousePosition = this.getPositionInWindow(evt);

        var menu = new ContextMenu(this, [
              ["add place", () => this.addPlace(mousePosition)],
              ["delete place", () => this.deletePlace()],
              ["add transition", () => this.addTransition(mousePosition)],
              ["delete transition", () => this.deleteTransition()],
          
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  async livelyExample() {
    await this.addPlace(pt(100, 100));
    this.places[0].addToken();
    await this.addPlace(pt(500, 100));
    await this.addTransition(pt(300, 100));
    this.addConnector(this.places[0], this.transitions[0]);
    this.addConnector(this.transitions[0],this.places[1]);
  }
  
  
  
  // Connector Creation
  
  
  
  async onMouseMove(evt) { 
    const cursor = this.get("#cursor");
    const pos = this.getPositionInWindow(evt)
    const offset = 5;
    if (this.connectionIsStarted()) {
      lively.setPosition(cursor, pt(pos.x - offset,pos.y - offset));
    }
  }
  
  getPositionInWindow(evt){
    const windowPosition = lively.getGlobalPosition(this);
    const x = evt.clientX - windowPosition.x;
    const y = evt.clientY - windowPosition.y;
    return pt(x,y);
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
  
  async connectTo(component) {
    if (!this.unfinishedConnector) {
      return;
    }
    const fromComponent = this.getComponentFrom(this.unfinishedConnector.fromComponentId);
    this.deleteUnfinishedConnector(this.get("#cursor"), this.unfinishedConnector);
    //this.get("#cursor").remove();

    if (fromComponent == component) {
      return
    }
    
    await this.addConnector(fromComponent, component);
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
  
  
  
  // Add And Delete Elements
  
  
  
  async addConnector(fromComponent, toComponent) {
    const newConnector = await(<lively-petrinet-edge></lively-petrinet-edge>);
    this.appendChild(newConnector);
    await newConnector.connectPetrinetComponents(fromComponent, toComponent);
    lively.addEventListener("onClick", newConnector, "click", (evt) => this.onElementClick(evt, newConnector));
    // The connector has some weird behaviour, in that it is not 100% connected to the elements in the beginning. We fix this by manually updating its position.
    setTimeout(() => this.updateConnectorPosition(), 1000);
  }
  
  updateConnectorPosition() {
    // This is very hacky. We set a minimal (impossible to see) position change, which triggers the
    // update position function of the edge. We observed that updateConnector() didn't work for this.
    const allElements = [...this.places, ...this.transitions];
    for (const element of allElements) {
      const originalPosition = lively.getPosition(element);
      lively.setPosition(element, originalPosition.addPt(pt(0,0.01)));
    }
  }
  
  async addTransition(position) {
    var transition = await (<lively-petrinet-prob-transition></lively-petrinet-prob-transition>);
    this.initializeElement(transition, position);
    this.appendChild(transition);
  }
  
  
  async addPlace(position) {
      var node = await (<lively-petrinet-place></lively-petrinet-place>);
      this.initializeElement(node, position);
      this.appendChild(node);
  }
  
  async addListeners(element) {
      element.onmouseover = () => this.mouseIsOnNode = true;
      element.onmouseout = () => this.mouseIsOnNode = false;
      lively.addEventListener("onDblClick", element.graphicElement(), "dblclick", () =>     this.manageNewConnection(element));
      lively.addEventListener("lively", element, "click", (evt) => this.onElementClick(evt, element))
  }
  
  async initializeElement(element, position) {
      lively.setPosition(element, position);
      this.addListeners(element);
  }
  
  deleteSelectedElement(){
    const connectorsBefore = this.getConnectorsBefore(this.selectedElement);
    for (const connector of connectorsBefore) {
      connector.remove();
    }
    const connectorsAfter = this.getConnectorsAfter(this.selectedElement);
    for (const connector of connectorsAfter) {
      connector.remove();
    }
    this.selectedElement.remove();
  }
  
  isSelectedElement(element){
    return element == this.selectedElement;
  }

  onElementClick(evt, element) {
    evt.preventDefault();
    evt.stopPropagation();
    this.selectedElement = element;
    element.setSelectedStyle();
    for (const otherElement of [...this.transitions, ...this.places, ...this.connectors]) {
      if (otherElement != element) {
        otherElement.setDisselectedStyle();
      }
    }
  }
  
  

}