import Morph from 'src/components/widgets/lively-morph.js';
import MultiSelection from 'src/client/vivide/multiselection.js';
import { uuid, getTempKeyFor, fileName, hintForLabel, listAsDragImage } from 'utils';

export default class VivideWidget extends Morph {
  getViewParent() {
    function findParent(obj, condition) {
      if(!obj) { return; }
      if(condition(obj)) { return obj; }
      
      return findParent(obj.parentNode || obj.host, condition);
    }
    
    return findParent(this, view => view.tagName === 'VIVIDE-VIEW');
  }
  
  display(data, config) {
    this.data = data;
    this.config = config;
  }
  
  livelyMigrate(other) {
    this.display(other.data, other.config);
  }
}
