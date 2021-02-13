import Morph from 'src/components/widgets/lively-morph.js';
import {Message} from "src/client/gmail.js"


/*MD 
![](gmail-message.png)
MD*/


export default class GmailMessage extends Morph {
  async initialize() {
    this.updateView()
    this.registerButtons()
  }
  
  get userId() {
    return this.getAttribute("userid")
  }
  
  set userId(v) {
    return this.setAttribute("userid", v)
  }
  
  get messageId() {
    return this.getAttribute("messageid")
  }

  set messageId(v) {
    return this.setAttribute("messageid", v)
  }

  async updateView() {
    if (!this.userId || !this.messageId) return;
    
    
    var message = await Message.get(this.userId, this.messageId)
    this.message = message 
    
    var root = this.get("#content")
    root.innerHTML = ""
    
    
    this.get("#from").innerHTML = message.from
    this.get("#subject").innerHTML = message.subject
    this.get("#body").innerHTML = message.body
    
  
//     } else {
//       root.innerHTML = `<pre>${JSON.stringify(this.message, undefined, 2)}</pre>`
      
//     }
    
    
    
  }
  
 
  livelyInspect(contentNode, inspector) {
     if (this.message) {
      contentNode.appendChild(inspector.display(this.message, false, "#message", this));
    }
     
  }
  
  async livelyExample() {
    this.setAttribute("userid", "jenslincke@gmail.com")
    this.setAttribute("messageid", "16edab4107a1e22a")
    this.updateView()
  }
  
  
}