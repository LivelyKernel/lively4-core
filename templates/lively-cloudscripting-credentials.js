import Morph from 'src/components/widgets/lively-morph.js';


export default class LivelyCloudscriptingCredentials extends Morph {
  async initialize() {
    this.windowTitle = "Credentials for Cloudscripting";
    lively.notify("Credentials are notifying lskdjfhsdlkfjsdklfjsdlkjf")
    this.name;
    
    var nameElement = this.getSubmorph('#name');
    alert(nameElement.toString());
    
    this.saveCredentialsButton = this.getSubmorph("#saveCredentials");
    this.saveCredentialsButton.on('click', this.saveCredentialsClick.bind(this));
    
  }
  
  saveCredentialsClick() {
    var github = this.getSubmorph('#githubCredentials');
    var dropbox = this.getSubmorph('#dropboxCredentials');
    lively.warning("TODO: Send credentials to backend");
  }
  
}