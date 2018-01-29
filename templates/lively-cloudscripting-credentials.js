import Morph from 'src/components/widgets/lively-morph.js';


export default class LivelyCloudscriptingCredentials extends Morph {
  async initialize() {
    this.windowTitle = "Credentials for Cloudscripting";
    this.username;
    this.nameElement = this.getSubmorph('#name');
    this.saveCredentialsButton = this.getSubmorph("#saveCredentials");
    this.saveCredentialsButton.addEventListener('click', this.saveCredentialsClick.bind(this));
    
  }
  
  saveCredentialsClick() {
    var github = this.getSubmorph('#githubCredentials');
    var dropbox = this.getSubmorph('#dropboxCredentials');
    lively.warn("TODO: Send credentials to backend");
  }
  
  setName(name) {
    alert(name + " inside credentials")
    this.username = name;
    this.nameElement.innerHTML = this.username;
  }
  
}