'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import profileStore from 'src/client/reactive/components/rewritten/conduit/src/stores/profileStore.js';
import userStore from 'src/client/reactive/components/rewritten/conduit/src/stores/userStore.js';
import articleStore from 'src/client/reactive/components/rewritten/conduit/src/stores/articleStore.js';
import { router } from 'src/client/reactive/components/rewritten/conduit/rpComponents/router-rp19.js';
import ArticleList from 'src/client/reactive/components/rewritten/conduit/src/components/main-view/article-list-rp19.js';
import FollowUserButton from 'src/client/reactive/components/rewritten/conduit/src/components/profile/follow-user-button-rp19.js';
import MyArticlesTab from 'src/client/reactive/components/rewritten/conduit/src/components/profile/my-articles-tab-rp19.js';
import FavoritedArticlesTab from 'src/client/reactive/components/rewritten/conduit/src/components/profile/favorited-articles-tab-rp19.js';

export default class Profile extends ReactiveMorph {
  
  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      this.addAExpr(
        aexpr(() => router().current)
          .onChange(newTarget => {
            if (newTarget['target'] !== 'author') return;
            articleStore.setPredicate(newTarget);
            profileStore.loadProfile(this.getUsernameFromRoutingProps());
          }));
      articleStore.setPredicate(router().current);
      profileStore.loadProfile(this.getUsernameFromRoutingProps());
    });
  }
  
  getUsernameFromRoutingProps() {
    const routingProps = router() && router().current;
    return routingProps && routingProps.author;
  }
  
  async render() {
    const routingProps = router() && router().current;
    if (!routingProps) return;
    if (profileStore.isLoadingProfile) return <loading-spinner-rp19 />;
    if (!profileStore.profile) return <red-error-rp19 v-message="Can't load profile"/>;
    const profile = profileStore.profile;
    const isUser = userStore.currentUser && profile.username === userStore.currentUser.username;
    const tab = routingProps.tab;
    const articleList = {
      articles: articleStore.articles,
      loading: articleStore.isLoading,
      totalPagesCount: articleStore.totalPagesCount,
      currentPage: articleStore.page,
      onSetPage: page => articleStore.page = page
    };
    const followUserButton = {
      username: profile.username,
      following: profile.following,
      follow: profileStore.follow,
      unfollow: profileStore.unfollow
    };
    const myArticlesTab = { tab, username: profile.username, };
    const favoritedArticlesTab = { tab, username: profile.username, };
    return (
      <div class='profile-page'>
        <div class='user-info'>
          <div class='container'>
            <div class='row'>
              <div class='col-xs-12 col-md-10 offset-md-1'>

                <img src={profile.image} class='user-img' alt='' />
                <h4>{profile.username}</h4>
                <p>{profile.bio}</p>

                { isUser && (
                  <link-rp19 
                    v-targetDestination={{ target: 'settings' }} 
                    className='btn btn-sm btn-outline-secondary action-btn'
                  >
                    <i class='ion-gear-a' /> Edit Profile Settings
                  </link-rp19>
                )}
                { !isUser && FollowUserButton(followUserButton) }
              </div>
            </div>
          </div>
        </div>

        <div class='container'>
          <div class='row'>
            <div class='col-xs-12 col-md-10 offset-md-1'>
              <div class='articles-toggle'>
                <div class='feed-toggle'>
                  <ul class='nav nav-pills outline-active'>
                    { await MyArticlesTab(myArticlesTab) }
                    { await FavoritedArticlesTab(favoritedArticlesTab) }
                  </ul>
                </div>
              </div>
              { await ArticleList(articleList) }
            </div>
          </div>
        </div>
      </div>
    );
  }
}