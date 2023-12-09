"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';



export default class LivelyPetrinet extends Morph {
  
  
  
  // Initialization
  
  async initialize() {
    this.windowTitle = "LivelyPetrinet";
    this.registerButtons();
    this.mouseIsOnNode = false;
    this.positionUpdate = setInterval(() => this.updateConnectorPosition(), 1000);
    
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
  
  disconnectedCallback() {
    clearInterval(this.positionUpdate);
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
  
  
  getComponentFrom(id) {
    const allComponents = [...this.places, ...this.transitions];
    for (const component of allComponents) {
      if (component.componentId == id) {
        return component;
      }
    }
  }
  
  
  // Lively Methods
  
  
  async livelyExample() {
    await this.addPlace(pt(100, 100));
    this.places[0].addToken();
    await this.addPlace(pt(500, 300));
    await this.addTransition(pt(300, 200));
    this.addConnector(this.places[0], this.transitions[0]);
    this.addConnector(this.transitions[0],this.places[1]);
  }
  
  
  
  // Connector Creation
  

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
    // The connector has some weird behaviour, in that it is not 100% connected to the elements in the beginning. We fix this by manually updating its position.
    return newConnector;
  }
  
  updateConnectorPosition() {
    for (const connector of this.connectors) {
      connector.updateConnector();
    }
  }
  
  async addTransition(position) {
    var transition = await (<lively-petrinet-prob-transition></lively-petrinet-prob-transition>);
    this.initializeElement(transition, position);
    this.appendChild(transition);
    return transition;
  }
  
  
  async addPlace(position) {
      var place = await (<lively-petrinet-place></lively-petrinet-place>);
      this.initializeElement(place, position);
      this.appendChild(place);
      return place;
  }
  
  async addCodeTransition(position) {
    var codeTransition = await (<lively-petrinet-code-transition></lively-petrinet-code-transition>);
    this.initializeElement(codeTransition, position);
    this.appendChild(codeTransition);
    return codeTransition;
  }
  
  
  async initializeElement(element, position) {
      lively.setPosition(element, position);
  }

}