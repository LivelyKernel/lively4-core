// TODO: 
//
//  new User Action
//  credentials window
//  create cloudscripting-item that allows us to connect actions to trigger
//  show state of script (running or stopped) in cloudscriptin-item
//  Set status when script is started/stopped (addClass on item)

import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js';

const endpoint = 'https://lively4-services.herokuapp.com/';
var name;
var filename; 
var loggingId;

export default class LivelyCloudscripting extends Morph {
  async initialize() {
    this.windowTitle = "Cloudscripting";
    this.addButton = this.getSubmorph('#addTriggerButton');
    this.addButton.addEventListener('click', this.addButtonClick.bind(this));
    this.login = this.getSubmorph('#login');
    this.login.addEventListener('click', this.loginClick.bind(this));
    this.credentials = this.getSubmorph('#credentials');
    this.credentials.addEventListener('click', this.credentialsClick.bind(this));
    this.codeEditor = this.getSubmorph('#code').editor;
    this.codeEditor.commands.addCommand({
      name: "save",
      bindKey: {win: "Ctrl-S", mac: "Command-S"},
      exec: (editor) => {
        this.saveCode()
      }
    });
    this.logsEditor = this.getSubmorph('#logs').editor;
    if (this.logsEditor) { // editor is not initialized during testing
      this.logsEditor.setReadOnly(true);
    }
    this.startButton = this.getSubmorph('#startButton');
    this.startButton.addEventListener('click', this.startButtonClick.bind(this));
    this.stopButton = this.getSubmorph('#stopButton');
    this.stopButton.addEventListener('click', this.stopButtonClick.bind(this));
  }
  
  /*
   * Event handlers
   */
  addButtonClick(evt) {
    lively.openComponentInWindow('lively-file-browser').then(browser => {
      browser.path = endpoint + 'mount/';
      lively.setGlobalPosition(browser.parentElement, lively.getGlobalPosition(this.parentElement).addPt(pt(30,30)))
      browser.setMainAction((url) => {

        this.addTrigger(url);
        browser.parentElement.onCloseButtonClicked();
      });
    });
  }
  
  loginClick(evt) {
    name = this.getSubmorph('#name').value;
    this.getTriggers();
  }
  
  credentialsClick(evt) {
    var that = this;
    lively.openComponentInWindow('lively-cloudscripting-credentials').then(credentialsWindow => {
      credentialsWindow.setName(name);
    });
  }
  
  startButtonClick(entryPoint) {
    var that = this;
    clearInterval(this.loggingId);
    this.loggingId = setInterval(function() {
      that.getTriggerLogs(filename);  
    },2000)
    $.ajax({
      url: endpoint + 'runTrigger',
      type: 'POST',
      data: JSON.stringify({
        user: name,
        triggerId: filename
      }),
      success: () => {lively.notify("start script")},
      error: this.handleAjaxError.bind(this)
    })
    
  }

  stopButtonClick(entryPoint) {
    clearInterval(this.loggingId); 
    $.ajax({
      url: endpoint + 'stopTrigger',
      type: 'POST',
      data: JSON.stringify({
        user: name,
        triggerId: filename
      }),
      success: () => {lively.notify("stop")},
      error: this.handleAjaxError.bind(this)
    })
  }
  
  // functions
  addTrigger(triggerName) {
    triggerName = triggerName.toString();
    triggerName = triggerName.substring(triggerName.lastIndexOf('/') + 1);
    $.ajax({
      url: endpoint + 'assignTrigger',
      type: 'POST',
      data: JSON.stringify({
        user: name,
        triggerId: triggerName
      }),
      success: this.getTriggers.bind(this),
      error: this.handleAjaxError.bind(this)
    })
  }
  
  getTriggers() {
    $.ajax({
      url: endpoint + 'getUserTriggers',
      type: 'POST',
      data: JSON.stringify({
        user: name
      }),
      success: this.reRender.bind(this),
      error: function(res){lively.notify(JSON.stringify(res)); lively.notify("user doesn't exist? Trying again."); this.getTriggers(); } //this.handleAjaxError.bind(this)
    })
  }
  
  getTriggerLogs(triggerName) {
    var that = this;
    $.ajax({
      url: endpoint + 'getTriggerLogs',
      type: 'POST',
      data: JSON.stringify({
        triggerId: triggerName,
        user: name
      }),
      success: function(res) {that.logsEditor.setValue(res), that.logsEditor.gotoPageDown()},
      error: this.handleAjaxError.bind(this)
    })
  }
  
  reRender(triggers) {
    var triggerWrapper = this.getSubmorph('#trigger-wrapper');
    while(triggerWrapper.firstChild) {
      triggerWrapper.removeChild(triggerWrapper.firstChild)
    }
    
    for(var prop in triggers) {
      var that = this;
      if(!triggers.hasOwnProperty(prop)) continue;
      
      var item = document.createElement('lively-cloudscripting-item');
      
      item.addEventListener('click', this.showCode.bind(this))
      item.setAttribute('data-id', prop);
      if (prop == 'selected') {
        item.getSubmorph('.item').classList.add('selected');
      }
      var title = prop;
      item.getSubmorph('h4').innerHTML = title;
      
      // Only show active actions
      var actionList = item.getSubmorph('.action-list');
      var length = triggers[prop]['actions'] ? triggers[prop]['actions'].length : 0;
      for(var i=0; i<length; i++) {
        var actionName = triggers[prop]['actions'][i];
        var action = document.createElement('lively-cloudscripting-action-item');
        action.addEventListener('click', this.showCode.bind(this))
        action.setAttribute('data-id', actionName);
        action.getSubmorph('h5').innerHTML = actionName;
        var icon = action.getSubmorph('i')
        icon.addEventListener('click', function(event) {
          event.stopPropagation();
          that.unassignAction();
        })
        action.appendChild(icon);
        actionList.appendChild(action);
      }
      
      item.getSubmorph('.add-action').addEventListener('click', function(event){
        event.stopPropagation();
        var triggerName = event.target.parentNode.parentNode.children[0].innerHTML;
        that.assignAction.bind(that);
        that.assignAction(triggerName);
      });

      var status = triggers[prop].running === 'true' ? 1 : 0;
      var statusText = 'unkown';
      if (triggers[prop].running) {
        status = 'running';
      } else if (!triggers[prop].running) {
        status = 'not-running';
      }
      
      item.getSubmorph('.status').classList.add(status); 
      triggerWrapper.appendChild(item);
    }
  }
  
  handleAjaxError(jqXHR, textStatus, errorThrown) {
    lively.notify("ajax error: " + errorThrown);
  }

  showCode(evt) {
    filename = evt.target.dataset.id;
    var that = this;
    this.loggingId = setInterval(function() {
      that.getTriggerLogs(filename);  
    },2000)
    var endpoint = 'https://lively4-services.herokuapp.com/mount/' + filename;
    lively.notify(endpoint);
    $.ajax({
      url: endpoint,
      type: 'GET',
      success: function(res){that.codeEditor.setValue(res)},   
      done: function(res){that.codeEditor.setValue(res.responseText)},
      error: function(res){that.codeEditor.setValue(res.responseText)}
    }); 
  }
  
  saveCode() {
    var that = this;
    $.ajax({
      url: endpoint + 'mount/' + filename,
      type: 'PUT',
      data: JSON.stringify({data:that.codeEditor.getValue(),user:name}),
      success: function(){lively.notify("File saved on Heroku", undefined, undefined, undefined, "green")},
      error: this.handleAjaxError.bind(this)
    }); 
  }
  
  unassignAction(triggerName, actionName) {
    lively.warn("TODO: unassign " + actionName + "for trigger" + triggerName + " and user " + name);
  }
  
  assignAction(triggerName) {
    var that = this;
    lively.openComponentInWindow('lively-file-browser').then(browser => {
      browser.path = endpoint + 'mount/';
      lively.setGlobalPosition(browser.parentElement, lively.getGlobalPosition(this.parentElement).addPt(pt(30,30)))
      browser.setMainAction((url) => {
        that.assignActionUrl(url, triggerName, that);
        browser.parentElement.onCloseButtonClicked();
      });
    });
  }
  
  assignActionUrl(url, triggerName, that) {
    url = url.toString();
    url = url.substring(url.lastIndexOf('/') + 1);
    $.ajax({
      url: endpoint + 'assignAction',
      type: 'POST',
      data: JSON.stringify({
        triggerId: triggerName,
        actionId: url,
        user: name
      }),
      success: that.getTriggers.bind(that),
      error: this.handleAjaxError.bind(this)
    })
  }
  
}