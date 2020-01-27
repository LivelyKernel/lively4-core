'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import userStore from 'src/client/reactive/components/rewritten/conduit/src/stores/userStore.js';
import commonStore from 'src/client/reactive/components/rewritten/conduit/src/stores/commonStore.js';
import LoggedInView from 'src/client/reactive/components/rewritten/conduit/src/components/header/logged-in-view.js';
import LoggedOutView from 'src/client/reactive/components/rewritten/conduit/src/components/header/logged-out-view.js';

export default class Header extends ReactiveMorph {  
  render() {
    const isLoggedIn = !!userStore.currentUser;
    return (
      <nav class="navbar navbar-light">
        <div class="container">
          <link-rp19 class="navbar-brand">
            { commonStore.appName.toLowerCase() }
          </link-rp19>
          
          {isLoggedIn ? (
            LoggedInView(userStore.currentUser)
          ) : (
            LoggedOutView()
          )}
        </div>
      </nav>
    );
  }
}