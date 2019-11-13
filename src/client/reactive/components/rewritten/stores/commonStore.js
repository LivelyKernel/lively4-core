'enable aexpr';

import _ from 'src/external/lodash/lodash.js'
import { Tags } from 'src/client/reactive/components/rewritten/agent.js'

class CommonStore {
  
  constructor() {
    this.appName = 'Conduit';
    this.token = window.localStorage.getItem('jwt');
    this.appLoaded = false;
    this.tags = [];
    this.isLoadingTags = false;
    aexpr(() => this.token)
      .onChange(token => {
        if (token) {
          window.localStorage.setItem('jwt', token);
        } else {
          window.localStorage.removeItem('jwt');
        }
      });
  }
  
  loadTags() {
    this.isLoadingTags = true;
    return Tags.getAll()
      .then(tags => 
           this.tags = _(tags).map(tag => tag.toLowerCase()))
      .finally(() =>
           this.isLoadingTags = false);
  }
  
  setToken(token) {
    this.token = token;
  }
  
  setAppLoaded() {
    this.appLoaded = true;
  }
}

export default new CommonStore();