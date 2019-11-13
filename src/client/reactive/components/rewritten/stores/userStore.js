'enable aexpr';

import { Auth } from 'src/client/reactive/components/rewritten/agent.js'

class UserStore {

  constructor() {
    this.currentUser;
    this.loadingUser;
    this.updatingUser;
    this.updatingUserErrors;
  }

  pullUser() {
    this.loadingUser = true;
    return Auth.current()
      .then(user => 
            this.currentUser = user)
      .finally(() => 
            this.loadingUser = false);
  }

  updateUser(newUser) {
    this.updatingUser = true;
    return Auth.save(newUser)
      .then(({ user }) => 
            this.currentUser = user)
      .finally(() => 
            this.updatingUser = false);
  }

  forgetUser() {
    this.currentUser = undefined;
  }
}

export default new UserStore();