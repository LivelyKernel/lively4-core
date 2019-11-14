import { Auth } from 'src/client/reactive/components/rewritten/agent.js';
import userStore from 'src/client/reactive/components/rewritten/stores/userStore.js';
import commonStore from 'src/client/reactive/components/rewritten/stores/commonStore.js';

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
    return Auth.login(email, password)
      .then(({ user }) => 
            commonStore.setToken(user.token))
      .then(() => userStore.pullUser())
      .catch(err => {
        this.errors = err.response && err.response.body && err.response.body.errors;
        throw err;
      })
      .finally(() => 
            this.inProgress = false);
  }
  
  register() {
    const { username, email, password } = this.values;
    this.inProgress = true;
    this.errors = undefined;
    return Auth.register(username, email, password)
      .then(({ user }) => 
            commonStore.setToken(user.token))
      .then(() => userStore.pullUser())
      .catch(err => {
        this.errors = err.response && err.response.body && err.response.body.errors;
        throw err;
      })
      .finally(() => 
            this.inProgress = false);
  }
  
  logout() {
    commonStore.setToken(undefined);
    userStore.forgetUser();
    return Promise.resolve();
  }
  
}

export default new AuthStore();