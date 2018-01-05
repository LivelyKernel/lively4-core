import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js';

const endpoint = 'https://lively4-services.herokuapp.com/';
var name;
var filename; 

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
    
    this.editor = this.getSubmorph('#log').editor;
    this.editor.commands.addCommand({
      name: "save",
      bindKey: {win: "Ctrl-S", mac: "Command-S"},
      exec: (editor) => {
        this.saveCode()
      }
    });
    
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
  
  // functions
  addTrigger(triggerName) {
    triggerName = triggerName.toString();
    alert(triggerName);
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
  
  reRender(res) {
    var triggerWrapper = this.getSubmorph('#trigger-wrapper');
    while(triggerWrapper.firstChild) {
      triggerWrapper.removeChild(triggerWrapper.firstChild)
    }
    var htmlString = '';
    var triggers = res;
    for(var prop in triggers) {
      if(!triggers.hasOwnProperty(prop)) continue;
      
      var item = document.createElement('lively-services-item');
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
    alert(errorThrown);
  }

  showCode(evt) {
    filename = evt.target.dataset.id;
    var that = this;
    $.get('https://lively4-services.herokuapp.com/mount/' + filename)
      .then(function(res) {
        that.editor.setValue(res);  
    }); 
  }
  
  saveCode() {
    var that = this;
    $.ajax({
      url: endpoint + 'mount/' + filename,
      type: 'PUT',
      data: that.editor.getValue(),
      success: function(){alert("Yeah")},
      error: this.handleAjaxError.bind(this)
    }); 
  }
}