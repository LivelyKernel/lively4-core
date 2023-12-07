'enable rp19-jsx';

import articleStore from 'src/client/reactive/components/rewritten/conduit/src/stores/articleStore.js';
import userStore from 'src/client/reactive/components/rewritten/conduit/src/stores/userStore.js';
import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import YourFeedTab from 'src/client/reactive/components/rewritten/conduit/src/components/main-view/your-feed-tab-rp19.js';
import GlobalFeedTab from 'src/client/reactive/components/rewritten/conduit/src/components/main-view/global-feed-tab-rp19.js';
import TagFilterTab from 'src/client/reactive/components/rewritten/conduit/src/components/main-view/tag-filter-tab-rp19.js';
import ArticleList from 'src/client/reactive/components/rewritten/conduit/src/components/main-view/article-list-rp19.js';

import { router } from 'src/client/reactive/components/rewritten/conduit/rpComponents/router-rp19.js';

export default class MainView extends ReactiveMorph {

  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      this.addAExpr(
        aexpr(() => router().current)
          .onChange(newTarget => articleStore.setPredicate(newTarget)));
      articleStore.setPredicate(router().current);
    });
  }
  
  async render() {
    const routingProps = router() && router().current;
    if (!routingProps) return;
    const tab = routingProps.tab;
    const tag = routingProps.tag;
    const articleList = {
      articles: articleStore.articles,
      loading: articleStore.isLoading,
      totalPagesCount: articleStore.totalPagesCount,
      currentPage: articleStore.page,
      onSetPage: page => articleStore.page = page
    };
    const tagFilterTab = { tag };
    const globalFeedTab = { tab };
    const yourFeedTab = { tab };
    return (
      <div>
        <div class='feed-toggle'>
          <ul class='nav nav-pills outline-active'>

            { userStore.currentUser && await YourFeedTab(yourFeedTab) }

            { await GlobalFeedTab(globalFeedTab) }

            { tag && await TagFilterTab(tagFilterTab) }

          </ul>
        </div>
        { await ArticleList(articleList) }
      </div>
    );
  }
}