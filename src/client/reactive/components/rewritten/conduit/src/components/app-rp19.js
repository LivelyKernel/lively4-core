'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import commonStore from 'src/client/reactive/components/rewritten/conduit/src/stores/commonStore.js';
import userStore from 'src/client/reactive/components/rewritten/conduit/src/stores/userStore.js';

export default class App extends ReactiveMorph {
  
  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      if (!commonStore.token)
        commonStore.appLoaded = true;
      else
        userStore.pullUser()
          .then(() => commonStore.appLoaded = true);
    });
  }
  
  render() {
    return commonStore.appLoaded && (
      <div class="conduit">
        <header-rp19 />
        <router-rp19 v-start={{ target: 'home', tab: 'all' }}>
          <home-rp19 v-showOn={{ target: 'home' }} />
          <login-rp19 v-showOn={{ target: 'login' }} />
          <settings-rp19 v-showOn={{
              target: 'settings',
              condition: () => !!userStore.currentUser
            }} />
          <register-rp19 v-showOn={{ target: 'register' }} />
          <article-rp19 v-showOn={{ target: 'article' }} />
          <editor-rp19 v-showOn={{ target: 'article-editor' }} />
          <profile-rp19 v-showOn={{ target: 'author' }} />
        </router-rp19>
      </div>
    );
  }
}