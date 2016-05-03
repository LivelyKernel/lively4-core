'use strict';

import Morph from './Morph.js';

export default class Services extends Morph {
  
  initialize() {
    this.windowTitle = "Services"
    this.serviceList = this.getSubmorph(".items");
    var that = this;
    $(this.serviceList).on('click', 'lively-services-item', (evt) => {
      var pid = evt.target.getAttribute('data-pid');
      that.unselectAll();
      evt.target.getSubmorph('.item').classList = "item selected";
      this.showService(pid);
    });
    
    this.serviceTop = this.getSubmorph('.service-top');
    this.serviceNameInput = this.getSubmorph('.service-top input');
    
    this.addButton = this.getSubmorph("#addButton");
    this.addButton.addEventListener("click", (evt) => {
      this.serviceTop.removeAttribute("data-pid");
      this.serviceNameInput.value = "";
      this.codeEditor.editor.setValue("");
      this.logEditor.editor.setValue("");
      this.unselectAll();
    });
    
    this.removeButton = this.getSubmorph("#removeButton");
    this.removeButton.addEventListener("click", (evt) => {
      var pid = this.serviceTop.getAttribute('data-pid');
      this.removeService(pid);
    });
    
    this.refreshButton = this.getSubmorph("#refreshButton");
    this.refreshButton.addEventListener("click", (evt) => { this.refreshServiceList() });
    this.startButton = this.getSubmorph("#startButton");
    this.startButton.addEventListener("click", (evt) => {
      var pid = this.serviceTop.getAttribute('data-pid');
      this.startService(pid);
    });
    this.stopButton = this.getSubmorph("#stopButton");
    this.stopButton.addEventListener("click", (evt) => {
      var pid = this.serviceTop.getAttribute('data-pid');
      this.stopService(pid);
    });
    this.debugButton = this.getSubmorph("#debugButton");
    this.debugButton.addEventListener("click", (evt) => {
      lively.openComponentInWindow('lively-iframe').then(component => {
	      component.setURL('http://lively-kernel.org/foo')
      });
    });
    
    this.codeEditor = this.getSubmorph("#code");
    this.logEditor = this.getSubmorph("#log");
    
    this.refreshServiceList();
  }
  
  unselectAll() {
    var children = this.serviceList.children;
    for (var i = 0; i < children.length; i++) {
      children[i].getSubmorph('.item').classList = "item";
    }
  }
  
  showService(pid) {
    this.serviceTop.setAttribute("data-pid", pid);
    var that = this;
    $.get("https://lively-kernel.org/lively4services/get?pid=" + pid, null, function(service) {
      that.codeEditor.editor.setValue(service.code);
      that.logEditor.editor.setValue(service.log);
    });
  }
  
  startService(pid) {
    var that = this;
    
    console.log(pid)
    
    if (pid === null) {
      var name = that.serviceNameInput.value;
      var code = that.codeEditor.editor.getValue();
      $.ajax({
        url: 'https://lively-kernel.org/lively4services/start',
        type: 'POST',
        data: JSON.stringify({ name: name, code: code }),
        contentType: "application/json",
        success: function(res) {
          console.log(res);
          that.refreshServiceList();
        }
      });
    }else {
      //implement resume process
    }
  }
  
  stopService(pid) {
    var that = this;
    $.ajax({
      url: 'https://lively-kernel.org/lively4services/stop',
      type: 'POST',
      data: JSON.stringify({ pid: pid }),
      contentType: "application/json",
      success: function(res) {
        console.log(res);
        that.refreshServiceList();
      }
    });
  }
  
  removeService(pid) {
    var that = this;
    $.ajax({
      url: 'https://lively-kernel.org/lively4services/remove',
      type: 'POST',
      data: JSON.stringify({ pid: pid }),
      contentType: "application/json",
      success: function(res) {
        console.log(res);
        that.refreshServiceList();
      }
    });
  }
  
  refreshServiceList() {
    var that = this;
    $.get("https://lively-kernel.org/lively4services/list", null, function(services) {
      // Clear all items
      while (that.serviceList.firstChild) {
        that.serviceList.removeChild(that.serviceList.firstChild);
      }
      // Check if any service running
      if (Object.keys(services).length === 0) {
        console.log('No services running yet!');
        return;
      }
      // List all services
  	  var now = new Date().getTime();
  	  for (var pid in services) {
  	    var service = services[pid];
  	    var item = document.createElement("lively-services-item");
  	    item.setAttribute("data-pid", pid);
  	    var title = service.name + ' (#' + pid + ')';
  	    item.getSubmorph('h1').innerHTML = title;
  	    
  	    var status = "unkown";
  	    var statusText = "unkown";
  	    if (service.status === 0) {
  	      status = "not-running";
  	      var uptime = (now - service.start)/1000 + "s";
  	      statusText = "not running (" + uptime + ")";
  	    } else if (service.status === 1) {
  	      status = "running";
  	      var uptime = (now - service.start)/1000 + "s";
  	      statusText = "running (" + uptime + ")";
  	    }
  	    
  	    item.getSubmorph('.status').classList = "status " + status;
  	    item.getSubmorph('small').innerHTML = statusText;
  	    that.serviceList.appendChild(item);
  	  }
  	});
  }
}
