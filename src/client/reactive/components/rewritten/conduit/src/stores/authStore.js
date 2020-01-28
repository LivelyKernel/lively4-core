'enable aexpr';

import agent from 'src/client/reactive/components/rewritten/conduit/src/agent.js';
import userStore from 'src/client/reactive/components/rewritten/conduit/src/stores/userStore.js';
import commonStore from 'src/client/reactive/components/rewritten/conduit/src/stores/commonStore.js';

class AuthStore {
  
  constructor() {
    this.reset();
  }
  
  reset() {
    this.inProgress = false;
    this.errors = undefined;
    this.values = {
      username: '',
      email: '',
      password: ''
    }
  }
  
  login() {
    const { email, password } = this.values;
    this.inProgress = true;
    this.errors = undefined;
    return agent.Auth.login(email, password)
      .then(({ user }) => 
            commonStore.token = user.token)
      .then(() => userStore.pullUser())
      .catch(err => {
        this.errors = err.response && err.response.body && err.response.body.errors;
        throw err;
      })
      .finally(() => 
            this.inProgress = false)
  }
  
  register() {
    const { username, email, password } = this.values;
    this.inProgress = true;
    this.errors = undefined;
    return agent.Auth.register(username, email, password)
      .then(({ user }) => 
            commonStore.token = user.token)
      .then(() => userStore.pullUser())
      .catch(err => {
        this.errors = err.response && err.response.body && err.response.body.errors;
        throw err;
      })  
      .finally(() => 
        this.inProgress = false);
  }
  
  logout() {
    commonStore.token = undefined;
    userStore.forgetUser();
    return Promise.resolve();
  }
  
}

const authStore = new AuthStore();
agent.setAuthStore(authStore);
export default authStore;