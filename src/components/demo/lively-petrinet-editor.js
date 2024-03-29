"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';
import {Helper} from "src/components/demo/lively-petrinet-helper.js"




export default class LivelyPetrinetEditor extends Morph {
  
  
  
  // Initialization
  
  async initialize() {
    this.windowTitle = "LivelyPetrinetEditor";
    this.registerButtons();
    this.mouseIsOnNode = false;
    this.selectedElement = undefined;
    if (this.petrinet != undefined) {
        await this.petrinet.initializeConnectors();
        this.addAllListeners();
    }
  }
  
  
  async initializePetrinet(petrinet) {
    await this.appendChild(petrinet);
    this.addAllListeners();
  }
  
  
  
  // Access
  
  
  
  get petrinet() {
    return this.get("lively-petrinet");
  }
  
  get places() {
    return this.petrinet.places;
  }
  
  
  get transitions(){
    return this.petrinet.transitions;
  }
  
  
  get connectors() {
    return this.petrinet.connectors;
  }
  
  get tokens() {
    return this.places.reduce((accumulator, place) => [...accumulator, ...place.tokens], []);
  }
  
  addAllListeners() {
    lively.addEventListener("OnDblClick", this, "dblclick", (evt) => this.onDblClick(evt))
    lively.addEventListener("MouseDraw", this, "mousemove", evt => this.onMouseMove(evt));
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);

    for (const place of this.places) {
      this.addListeners(place)
    }
    for (const transition of this.transitions) {
      this.addListeners(transition)
    }
    
    for (const connector of this.connectors) {
      this.listenForSelect(connector);
    }
    
    for (const token of this.tokens) {
      this.listenForSelect(token);
    }
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
       for (const transition of Helper.shuffled(this.transitions)) {
        if (this.canFire(transition)) {
          this.fire(transition);
          this.persistPlaceState();
          yield;
        }
      }
    }
  }
  
  async onStep() {
      let hasFired = false;
      for (const transition of Helper.shuffled(this.transitions)) {
          if (this.canFire(transition)) {
            await this.fire(transition);
            hasFired = true;
          }
      }
      if (hasFired) {
        this.persistPlaceState();
      }
  }
  
  canFire(transition) {
      const placesBefore = this.getFirstComponents(this.getConnectorsBefore(transition));
      const placesAfter = this.getSecondComponents(this.getConnectorsAfter(transition));
      const firingIsPossible = placesBefore.every((place) => place.tokens.length > 0);
      const transitionAllowsFiring = transition.isActiveTransition(placesBefore, placesAfter);
      if (!firingIsPossible || !transitionAllowsFiring) {
        return false;
      }
      return true;
  }
  
  async fire(transition) {
      const connectorsBefore = this.getConnectorsBefore(transition);
      const connectorsAfter = this.getConnectorsAfter(transition);
      const placesBefore = this.getFirstComponents(connectorsBefore);
      const placesAfter = this.getSecondComponents(connectorsAfter);
      const placesToRemoveTokenFrom = transition.getPlacesToRemoveTokenFrom(placesBefore, placesAfter);
      const placesToAddTokenTo = transition.getPlacesToAddTokenTo(placesBefore, placesAfter);
      for (const [place,colour] of placesToRemoveTokenFrom) {
        await place.deleteToken(colour);
      }
    
      // Animation
      await this.animateTokens(placesToRemoveTokenFrom, connectorsBefore);
      await this.animateTokens(placesToAddTokenTo, connectorsAfter);
      
    
      for (const [place,colour] of placesToAddTokenTo) {
        await place.addToken(colour);
      }
      return
  }
  
  async animateTokens(placesToChangeToken, connectorsConnectedToThem) {
    let animationPromises = []
    for (const [place, colour] of placesToChangeToken) {
      const connectorOfPlace = this.getConnectorOfPlace(place, connectorsConnectedToThem);
  animationPromises.push(connectorOfPlace.animateMovingToken(colour));
    }
    await Promise.all(animationPromises);
  }
  
  getConnectorOfPlace(place, connectorsToCompare) {
    for (const connector of connectorsToCompare) {
      if (connector.fromComponentId === place.componentId || connector.toComponentId === place.componentId) {
            return connector;
      }
    }
    lively.error("When transitioning, did not found connector that connects the place with the transition")
  }
  
  getFirstComponents(connectors) {
    return connectors.map(connector => this.petrinet.getComponentFrom(connector.fromComponentId));
  }
  
  getSecondComponents(connectors) {
    return connectors.map(connector => this.petrinet.getComponentFrom(connector.toComponentId));
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
        const offset = lively.getClientPosition(this.get("lively-petrinet")).y - lively.getClientPosition(this).y;
        const positionInPetrinet = pt(mousePosition.x, mousePosition.y - offset);
        const toolbarToggleText = this.toolbarIsActive() ? "disable toolbar" : "activate toolbar";

        var menu = new ContextMenu(this, [
              ["add place", () => this.addPlace(positionInPetrinet)],
              ["add transition", () => this.addTransition(positionInPetrinet)],
              ["add code transition", () => this.addCodeTransition(positionInPetrinet)],
              [toolbarToggleText, () => this.toggleToolbar()]
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  toggleToolbar() {
    if (this.toolbarIsActive()){
      this.get("lively-petrinet-toolbar").style.display = "none";
    } else {
      this.get("lively-petrinet-toolbar").style.display = "block";
    }
  }
  
  toolbarIsActive() {
    return this.get("lively-petrinet-toolbar").style.display != "none";
  }
  
  async livelyExample() {
    const petrinet = await (<lively-petrinet></lively-petrinet>);
    await this.initializePetrinet(petrinet);
    await this.addPlace(pt(0,0));
    this.petrinet.places[0].addToken("black");
    await this.addPlace(pt(500, 100));
    await this.addTransition(pt(300, 100));
    this.addConnector(this.places[0], this.transitions[0]);
    this.addConnector(this.transitions[0],this.places[1]);
    this.toggleToolbar();
  }

  
  
  // Connector Creation
  
  
  
  async onMouseMove(evt) { 
    const cursor = this.get("#cursor");
    const pos = pt(evt.clientX, evt.clientY);
    if (this.connectionIsStarted()) {
      lively.setClientPosition(cursor, pt(pos.x-5, pos.y-5));
    }
  }
  
  getPositionInWindow(evt){
    const windowPosition = lively.getClientPosition(this);
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
    console.log(this.mouseIsOnNode);
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
    lively.setExtent(cursor, pt(5,5));
    const position = lively.getClientPosition(element);
    await this.append(cursor);
    lively.setClientPosition(cursor, position);
    
    //Connect Cursor To Connector
    connector.connectTo(cursor);
    this.unfinishedConnector = connector;

    return connector
  }
  
  async connectTo(component) {
    if (!this.unfinishedConnector) {
      return;
    }
    const fromComponent = this.petrinet.getComponentFrom(this.unfinishedConnector.fromComponentId);
    this.deleteUnfinishedConnector(this.get("#cursor"), this.unfinishedConnector);

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
    const newConnector = await this.petrinet.addConnector(fromComponent, toComponent);
    lively.addEventListener("onClick", newConnector, "click", (evt) => this.onElementClick(evt, newConnector));
  }
  
  async addTransition(position) {
    const transition = await this.petrinet.addTransition(position);
    this.initializeElement(transition, position);
  }
  
  
  async addPlace(position) {
      const place = await this.petrinet.addPlace(position);
      this.initializeElement(place, position);
  }
  
  async addCodeTransition(position) {
    const codeTransition = await this.petrinet.addCodeTransition(position);
    this.initializeElement(codeTransition, position);
  }
  
  async addListeners(element) {
      element.graphicElement().onmouseover = () => this.mouseIsOnNode = true;
      element.graphicElement().onmouseout = () => this.mouseIsOnNode = false;
      lively.addEventListener("onDblClick", element.graphicElement(), "dblclick", () =>     this.manageNewConnection(element));
    this.listenForSelect(element);
  }
  
  listenForSelect(element) {
    lively.addEventListener("lively", element, "click", (evt) => this.onElementClick(evt, element));
  }
  
  async initializeElement(element, position) {
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
    for (const otherElement of [...this.transitions, ...this.places, ...this.connectors, ...this.tokens]) {
      if (otherElement != element) {
        otherElement.setDisselectedStyle();
      }
    }
  }
  
  

}