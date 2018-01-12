// TODO: 
//
//  new User Action
//  credentials window
//  create cloudscripting-item that allows us to connect actions to trigger
//  show state of script (running or stopped) in cloudscriptin-item

import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js';

const endpoint = 'https://lively4-services.herokuapp.com/';
var name;
var filename; 
var loggingId;

export default class LivelyCloudscripting extends Morph {
  async initialize() {
    this.windowTitle = "Cloudscripting";
//     this.loginButton = this.getSubmorph('.login-button');
//     this.credentialsButton = this.getSubmorph('.credentials button.toggle-list');
//     this.credentialsList = this.getSubmorph('.credentials-list');
//     this.isLoggedIn = false;  
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
    lively.notify("TODO: Should open credentials window")
    // lively.openComponentInWindow('lively-cloudscripting-credentials').then(browser => {
    //   lively.notify("TODO: save credentials?")
    // });
  }
  
  startButtonClick(entryPoint) {
    var that = this;
    clearInterval(this.loggingId);
    this.loggingId = setInterval(function() {
      lively.notify("Trying to set logging intervall")
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
    // set name in db
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
      error: this.handleAjaxError.bind(this)
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
  
  reRender(res) {
    var triggerWrapper = this.getSubmorph('#trigger-wrapper');
    while(triggerWrapper.firstChild) {
      triggerWrapper.removeChild(triggerWrapper.firstChild)
    }
    var htmlString = '';
    var triggers = res;
    for(var prop in triggers) {
      if(!triggers.hasOwnProperty(prop)) continue;
      
      var item = document.createElement('lively-cloudscripting-item');
      
      item.addEventListener('click', this.showCode.bind(this))
      item.setAttribute('data-id', prop);
      if (prop == 'selected') {
        item.getSubmorph('.item').classList.add('selected');
      }
      var title = prop;
      item.getSubmorph('h1').innerHTML = title;

      var status = 'unkown';
      var statusText = 'unkown';
      if (1 === 0) {
        status = 'not-running';
        var since = (now - service.kill);
        statusText = 'not running (' + this.msToString(since) + ')';
      } else if (1 === 1) {
        status = 'running';
        // var uptime = (now - service.start);
        statusText = '...';
      }

      item.getSubmorph('.status').classList.add(status);
      item.getSubmorph('small').innerHTML = statusText;
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
      lively.notify("Trying to set logging intervall")
      that.getTriggerLogs(filename);  
    },2000)
    var endpoint = 'https://lively4-services.herokuapp.com/mount/' + filename;
    lively.notify(endpoint);
    $.ajax({
      url: endpoint,
      type: 'GET',
      success: function(){lively.notify("Success")},   
      done: function(res){lively.notify("Done:", JSON.stringify(res))},
      error: function(res){that.codeEditor.setValue(res.responseText)}
    }); 
  }
  
  saveCode() {
    var that = this;
    $.ajax({
      url: endpoint + 'mount/' + filename,
      type: 'PUT',
      data: JSON.stringify({data:that.codeEditor.getValue(),user:name}),
      success: function(){lively.notify("File saved on Heroku")},
      error: this.handleAjaxError.bind(this)
    }); 
  }

// Helpers
  post(endpoint, data, success) {
    $.ajax({
      url: servicesURL + endpoint,
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: (data) => {
        console.log(data);
        if (success) {
          success(data);
        }
      },
      error: this.handleAjaxError.bind(this)
    });
  }
  
}