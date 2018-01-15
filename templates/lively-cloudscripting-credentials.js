import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js';

const endpoint = 'https://lively4-services.herokuapp.com/';
var name;

export default class LivelyCloudscriptingCredentials extends Morph {
  async initialize() {
    this.windowTitle = "Credentials for Cloudscripting";
    lively.notify("Credentials are notifying lskdjfhsdlkfjsdklfjsdlkjf")
    this.name;
    
    var nameElement = this.getSubmorph('#name');
    alert(nameElement.toString());
    
  }
  
}