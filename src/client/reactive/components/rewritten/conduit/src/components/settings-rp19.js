'enable rp19-jsx';

import _ from 'src/external/lodash/lodash.js'
import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import userStore from 'src/client/reactive/components/rewritten/conduit/src/stores/userStore.js';
import authStore from 'src/client/reactive/components/rewritten/conduit/src/stores/authStore.js';
import { router } from 'src/client/reactive/components/rewritten/conduit/rpComponents/router-rp19.js';
import ListErrors from 'src/client/reactive/components/rewritten/conduit/src/components/generic/list-errors-rp19.js'

const EMPTY_USER = {
  image: '',
  username: '',
  bio: '',
  email: '',
  password: ''
};

export default class Settings extends ReactiveMorph {
  
  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      this.addAExpr(aexpr(() => userStore.currentUser).onChange(user => 
        this.createLocalUserCopy(user)));
      this.createLocalUserCopy(userStore.currentUser);
    });
  }
                  
  createLocalUserCopy(user = EMPTY_USER) {
    this.user = _.pick(user, _.keys(EMPTY_USER));
  }
  
  onLogoutButton() {
    authStore.logout()
      .then(() => router().navigateTo({ target: 'home' }));
  }
  
  onSettingsForm(event) {
    const user = _.assign({}, this.user);
    if (!user.password.length)
      delete user.password;
    userStore.updateUser(user);
    event.preventDefault();
  }
  
  render() {
    return this.user && (
      <div class="settings-page">
        <div class="container page">
          <div class="row">
            <div class="col-md-6 offset-md-3 col-xs-12">

              <h1 class="text-xs-center">Your Settings</h1>
              
              { ListErrors({ errors: userStore.updatingUserErrors }) }

              <form id='settingsForm'>
                <fieldset>

                  <fieldset class="form-group">
                    <input
                      id='imageInput'
                      class="form-control"
                      type="text"
                      placeholder="URL of profile picture"
                      value={ this.user.image }
                    />
                  </fieldset>
                  
                  <fieldset class="form-group">
                    <input
                      id='usernameInput'
                      class="form-control form-control-lg"
                      type="text"
                      placeholder="Username"
                      value={ this.user.username }
                    />
                  </fieldset>
                  
                  <fieldset class="form-group">
                    <textarea
                      id='bioTextArea'
                      class="form-control form-control-lg"
                      rows="8"
                      placeholder="Short bio about you"
                      value={ this.user.bio }
                    >{ this.user.bio }</textarea>
                  </fieldset>
                  
                  <fieldset class="form-group">
                    <input
                      id='emailInput'
                      class="form-control form-control-lg"
                      type="email"
                      placeholder="Email"
                      value={ this.user.email }
                    />
                  </fieldset>
                  
                  <fieldset class="form-group">
                    <input
                      id='passwordInput'
                      class="form-control form-control-lg"
                      type="password"
                      placeholder="New Password"
                      value={ this.user.password }
                    />
                  </fieldset>
                  
                  <button
                    class="btn btn-lg btn-primary pull-xs-right"
                    type="submit"
                    disabled={ userStore.updatingUser }
                  >
                    Update Settings
                  </button>
                </fieldset>
              </form>
              
              <hr />

              <button
                id='logoutButton'
                class="btn btn-outline-danger"
              >
                Or click here to logout.
              </button>

            </div>
          </div>
        </div>
      </div>
    );
  }
}