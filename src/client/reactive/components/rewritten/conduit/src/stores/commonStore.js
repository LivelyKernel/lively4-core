'enable aexpr';

import _ from 'src/external/lodash/lodash.js'
import agent from 'src/client/reactive/components/rewritten/conduit/src/agent.js';

class CommonStore {
  
  constructor() {
    this.appName = 'Conduit';
    this.token = window.localStorage.getItem('jwt-rp19');
    this.appLoaded = false;
    this.tags = [];
    this.isLoadingTags = false;
    aexpr(() => this.token)
      .onChange(token => {
        if (token) {
          window.localStorage.setItem('jwt-rp19', token);
        } else {
          window.localStorage.removeItem('jwt-rp19');
        }
      });
  }
  
  loadTags() {
    this.isLoadingTags = true;
    return agent.Tags.getAll()
      .then(({tags}) => 
        this.tags = _.map(tags, tag => tag.toLowerCase()))
      .finally(() =>
           this.isLoadingTags = false);
  }
}

const commonStore = new CommonStore();
agent.setCommonStore(commonStore);
export default commonStore;