import Morph from 'src/components/widgets/lively-morph.js';
import {Message} from "src/client/gmail.js"

/*MD 
# Gmail Messages

 #Example #LivelyApplication #POID 


![](gmail-messages.png) 

MD*/


export default class GmailMessages extends Morph {
  async initialize() {
    this.updateView()
  }
  
  get userId() {
    return this.getAttribute("userid")
  }
  
  onMessageSelect(li, message) {
    if (this.lastSelectedItem) this.lastSelectedItem.classList.remove("selected")
    li.classList.add("selected")
    this.lastSelectedItem = li
    
    
    var comp = this.get("#message")
    comp.userId = this.userId
    comp.messageId = message.id
    comp.updateView()
  }
  
  async onThreadSelect(li, thread) {
    if (this.lastSelectedItem) {
      this.lastSelectedItem.classList.remove("selected")
      Array.from(this.lastSelectedItem.childNodes).forEach(ea => ea.remove())
    }
    li.classList.add("selected")
    this.lastSelectedItem = li      
    this.thread = await fetch(`gmail://${this.userId}/threads/${thread.id}?labelIds=CATEGORY_PERSONAL`).then(r => r.json())
     var ul = <ul>{...(this.thread.messages.map(ea => {
        var li = <li click={()=> this.onMessageSelect(li, ea)}>{ea.snippet}</li>
        return li
      }))}</ul>
    li.innerHTML =""
    li.appendChild(ul)
  
  }
  
  async renderMessageItem(li, messageId) {
    var message = await Message.get(this.userId, messageId)
    li.innerHTML = message.subject
  }
  
  
  async updateView() {
    // this.threads = await fetch(`gmail://${this.userId}/threads?labelIds=CATEGORY_PERSONAL`).then(r => r.json())
    // var root = this.get("#content")
    // root.innerHTML = ""
    // var ul = <ul>{...(this.threads.threads.map(ea => {
    //   var li = <li click={()=> this.onThreadSelect(li, ea)}>{ea.snippet}</li>
    //   return li
    // }))}</ul>

    this.messages = await fetch(`gmail://${this.userId}/messages?labelIds=CATEGORY_PERSONAL`).then(r => r.json())
    var root = this.get("#content")
    root.innerHTML = ""
    var ul = <ul>{...(this.messages.messages.map(ea => {
      var li = <li click={()=> this.onMessageSelect(li, ea)}>{ea.id}</li>
      this.renderMessageItem(li, ea.id)
      return li
    }))}</ul>    
    root.appendChild(ul)
  }
  
  livelyInspect(contentNode, inspector) {
    if (this.messages) {
      contentNode.appendChild(inspector.display(this.messages, false, "#messages", this));
    } 
     if (this.threads) {
      contentNode.appendChild(inspector.display(this.threads, false, "#threads", this));
    } 
     if (this.thread) {
      contentNode.appendChild(inspector.display(this.thread, false, "#thread", this));
    } 
  }
  
  async livelyExample() {
    this.setAttribute("userid", "jenslincke@gmail.com")
    this.updateView()
  }
  
  
}