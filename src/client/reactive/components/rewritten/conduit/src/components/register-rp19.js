'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import authStore from 'src/client/reactive/components/rewritten/conduit/src/stores/authStore.js';
import { router } from 'src/client/reactive/components/rewritten/conduit/rpComponents/router-rp19.js';
import ListErrors from 'src/client/reactive/components/rewritten/conduit/src/components/generic/list-errors-rp19.js'

export default class Register extends ReactiveMorph {
  
  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      authStore.reset();
    });if (this.isDummy()) return;
    authStore.reset();
  }
  
  /* Event handler */
  onRegisterForm(event) {
    authStore.register()
      .then(() => router().navigateTo({ target: 'home' }))
      .catch(e => void e);
    event.preventDefault();
  }
  
  render() {
    return (
      <div class='auth-page'>
        <div class='container page'>
          <div class='row'>

            <div class='col-md-6 offset-md-3 col-xs-12'>
              <h1 class='text-xs-center'>Sign Up</h1>
              <p class='text-xs-center'>
                <link-rp19 v-targetDestination={{ target: 'login' }}>
                  Have an account?
                </link-rp19>
              </p>

              { ListErrors({ errors: authStore.errors }) }

              <form id='registerForm'>
                <fieldset>

                  <fieldset class='form-group'>
                    <input
                      id='usernameInput'
                      class='form-control form-control-lg'
                      type='text'
                      placeholder='Username'
                      value={ authStore.values.username }
                    />
                  </fieldset>

                  <fieldset class='form-group'>
                    <input
                      id='emailInput'
                      class='form-control form-control-lg'
                      type='email'
                      placeholder='Email'
                      value={ authStore.values.email }
                    />
                  </fieldset>

                  <fieldset class='form-group'>
                    <input
                      id='passwordInput'
                      class='form-control form-control-lg'
                      type='password'
                      placeholder='Password'
                      value={ authStore.values.password }
                    />
                  </fieldset>

                  <button
                    class='btn btn-lg btn-primary pull-xs-right'
                    type='submit'
                    disabled={ authStore.inProgress }
                  >
                    Register
                  </button>

                </fieldset>
              </form>
            </div>

          </div>
        </div>
      </div>
    );
  }
}