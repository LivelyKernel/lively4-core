'enable aexpr';

import agent from 'src/client/reactive/components/rewritten/conduit/src/agent.js';

class ProfileStore {

  loadProfile(username) {
    this.isLoadingProfile = true;
    agent.Profile.get(username)
      .then(({ profile }) => this.profile = profile)
      .finally(() => 
        this.isLoadingProfile = false);
  }

  follow() {
    if (this.profile && !this.profile.following) {
      this.profile.following = true;
      agent.Profile.follow(this.profile.username)
        .catch(() => 
          this.profile.following = false);
    }
  }

  unfollow() {
    if (this.profile && this.profile.following) {
      this.profile.following = false;
      agent.Profile.unfollow(this.profile.username)
        .catch(() =>
          this.profile.following = true);
    }
  }
}

export default new ProfileStore();