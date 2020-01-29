'enable aexpr';

import agent from 'src/client/reactive/components/rewritten/conduit/src/agent.js';

class UserStore {

  pullUser() {
    this.loadingUser = true;
    return agent.Auth.current()
      .then(({ user }) => 
            this.currentUser = user)
      .finally(() => 
            this.loadingUser = false);
  }

  updateUser(newUser) {
    this.updatingUser = true;
    return agent.Auth.save(newUser)
      .then(({ user }) => 
            this.currentUser = user)
      .catch(err => {
        this.updatingUserErrors = err.response && err.response.body && err.response.body.errors;
      })
      .finally(() => 
            this.updatingUser = false);
  }

  forgetUser() {
    this.currentUser = undefined;
  }
}

export default new UserStore();