'enable aexpr';

import Morph from 'src/components/widgets/lively-morph.js';
import authStore from 'src/client/reactive/components/rewritten/stores/authStore.js';
import userStore from 'src/client/reactive/components/rewritten/stores/userStore.js';

export default class ConduitLogin extends Morph {
    
  async initialize() {
    this.windowTitle = 'Conduit Login';
    authStore.reset();
    this.hookRender();
  }
  
  /* Event handler */
  
  onLoginForm(event) {
    event.preventDefault();
    authStore.login();
  }
  
  /* Render */  
  hookRender() {
    aexpr(() => this.render()).onChange(htmlDoc => this._render(htmlDoc));
    this._render(this.render());
  }
  
  _render(htmlDoc) {
    const root = this.get('#root');
    root.innerHTML = '<div />';
    root.appendChild(htmlDoc);
    this.registerForms();
    this.bindInputFields();
  }
  
  bindInputFields() {
    aexpr(() => this.get('#emailInput').value)
      .onChange(email => authStore.values.email = email);
    aexpr(() => this.get('#passwordInput').value)
      .onChange(password => authStore.values.password = password);
  }
  
  render() {
    const isLoggedIn = !!userStore.currentUser;
    const { inProgress, values: { email, password } } = authStore;
    const submitButtonProps = inProgress ? { disabled: true } : {};
    return (
      <div class="auth-page">
        <div class="container page">
          <div class="row">
            <div class="col-md-6 offset-md-3 col-xs-12">
              <h1 class="text-xs-center">Sign In</h1>
              <form id="loginForm">
                <fieldset>
                  <fieldset class="form-group">
                    <input
                           id="emailInput"
                           type="email"
                           class="form-control form-control-lg"
                           placeholder="Email"
                           value={ email } />
                  </fieldset>
                  <fieldset class="form-group">
                    <input
                           id='passwordInput'
                           type="password"
                           class="form-control form-control-lg"
                           placeholder="Password"
                           value={ password } />
                  </fieldset>
                  <button
                          id='submitLoginButton'
                          class="btn btn-lg btn-primary pull-xs-right"
                          type="submit"
                          {...submitButtonProps}
                    >
                    Sign in
                  </button>
                </fieldset>
              </form>
            </div>
          </div>
          <div class="row">
            Status: { isLoggedIn ? 'Logged in' : 'Not logged in'}
          </div>
        </div>
      </div>
    );
  }
}