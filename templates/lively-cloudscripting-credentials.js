import Morph from 'src/components/widgets/lively-morph.js';

const endpoint = 'https://lively4-services.herokuapp.com/';

export default class LivelyCloudscriptingCredentials extends Morph {
  async initialize() {
    this.windowTitle = "Credentials for Cloudscripting";
    this.username;
    this.nameElement = this.getSubmorph('#name');
    this.saveCredentialsButton = this.getSubmorph("#saveCredentials");
    this.saveCredentialsButton.addEventListener('click', this.saveCredentialsClick.bind(this));
    
  }
  
  saveCredentialsClick() {
    var github = this.getSubmorph('#githubCredentials').value;
    var dropbox = this.getSubmorph('#dropboxCredentials').value;
    var sendGrid = this.getSubmorph('#sendGridCredentials').value;
    $.ajax({
      url: endpoint + 'setCredentials',
      type: 'POST',
      data: JSON.stringify({
        user: this.username,
        type: 'dropbox',
        key: dropbox
      }),
      success: (res) => {lively.notify("successfully called setCredentials")},
      error: (res) => {alert("error:" + JSON.stringify(res)); lively.notify("error with credentials")}
    });
    
     $.ajax({
      url: endpoint + 'setCredentials',
      type: 'POST',
      data: JSON.stringify({
        user: this.username,
        type: 'github',
        key: github
      }),
      success: (res) => {lively.notify("successfully called setCredentials")},
      error: (res) => {alert("error:" + JSON.stringify(res)); lively.notify("error with credentials")}
    });
    
    $.ajax({
      url: endpoint + 'setCredentials',
      type: 'POST',
      data: JSON.stringify({
        user: this.username,
        type: 'sendgrid',
        key: sendGrid
      }),
      success: (res) => {lively.notify("successfully called setCredentials")},
      error: (res) => {alert("error:" + JSON.stringify(res)); lively.notify("error with credentials")}
    });
  }
  
  setName(name) {
    lively.notify(name + " inside credentials")
    this.username = name;
    this.nameElement.innerHTML = this.username;
  }
  
  getCredentials(name) {
    lively.notify("trying to get credentials for", name);
    this.username = name;
    var that = this;
    $.ajax({
      url: endpoint + 'getCredentials',
      type: 'POST',
      data: JSON.stringify({
        user: name
      }),
      success: (res) => {that.getSubmorph('#dropboxCredentials').value = res.dropbox; that.getSubmorph('#githubCredentials').value = res.github; that.getSubmorph('#sendGridCredentials').value = res.sendgrid},
      error: (res) => {alert("error:", res, res.dropbox); lively.notify("error with credentials")}
    })
  } 
  
}