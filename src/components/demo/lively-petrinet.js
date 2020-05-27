"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';



export default class LivelyPetrinet extends Morph {

  async initialize() {
    this.windowTitle = "LivelyPetrinet";
    this.registerButtons();
    this.mouseIsOnNode = false;
    
    lively.addEventListener("OnMouseClick", this,     "pointerdown", (evt) => this.onMouseClick(evt))
    

    lively.html.registerKeys(this); // automatically installs handler for some methods

    lively.addEventListener("MouseDraw", this, "mousemove", evt => this.onMouseMove(evt));

    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false)

  }
  
  get nodes() {
    return Array.from(this.querySelectorAll("lively-petrinet-node"));
  }
  
  async livelyExample() {
    /*
    var a = await (<div></div>)
    a.style.backgroundColor = "red"
    a.textContent = "a"
    lively.setExtent(a, pt(100,100))
    lively.setPosition(a, pt(100,100))
    lively.addEventListener("petri", a, "click", () => this.manageNewConnection(a))


    var b = await (<div></div>)
    b.style.backgroundColor = "blue"
    b.textContent = "b"
    lively.setExtent(b, pt(100,100))
    lively.setPosition(b, pt(300,100));
    lively.addEventListener("b_listener", b, "click", () => this.manageNewConnection(b))


    this.appendChild(a)
    this.appendChild(b)
    */
}

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    this.setAttribute("data-mydata", this.get("#textField").value)
  }


  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();

        var menu = new ContextMenu(this, [
              ["add node", () => this.addNode()],
              ["delete node", () => this.deleteNode()],
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  
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
  
  onMouseClick(evt) {
    if (this.mouseIsOnNode || !this.connectionIsStarted())      {
        return;
    }
    
    let cursor = this.get("#cursor");
    cursor.remove();
    this.unfinishedConnector.remove();
  }
  
  async startConnectionFrom(element) {
    //Create Connector
    var connector = await (<lively-petrinet-edge></lively-petrinet-edge>);
    this.append(connector);
    connector.connectFrom(element);
    
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
    this.unfinishedConnector.connectTo(element);
    this.get("#cursor").remove();
  }
  
  
  
  async manageNewConnection(element) {
    if (!this.connectionIsStarted()) {
      await this.startConnectionFrom(element);
    } else {
      await this.connectTo(element);
    }
  }
  
  
    async addNode() {
      var node = await (<lively-petrinet-node></lively-petrinet-node>);
      var x = Math.random() * 100;
      var y = Math.random() * 100;
      lively.setPosition(node, pt(x,y));
      node.onmouseover = () => this.mouseIsOnNode = true;
      node.onmouseout = () => this.mouseIsOnNode = false;
      this.appendChild(node);
      lively.addEventListener("ClickOnNode", node, "click", () => this.manageNewConnection(node));
      

  }

    async deleteNode(){
    this.nodes[0].remove()
  }

  
//  onDblClick() {
//    this.animate([
//     {backgroundColor: "lightgray"},
//     {backgroundColor: "red"},
//      {backgroundColor: "lightgray"},
//    ], {
//      duration: 1000
//    })
//  }


}