'enable aexpr';

import articleStore from 'src/client/reactive/components/rewritten/conduit/src/stores/articleStore.js';
import _ from 'src/external/lodash/lodash.js'

class ArticleEditorStore {

  constructor() {
    this.reset();
  }
  
  reset() {
    this.title = '';
    this.description = '';
    this.body = '';
    this.tagList = [];
  }

  setArticleSlug(articleSlug) {
    if (this.articleSlug !== articleSlug) {
      this.reset();
      this.articleSlug = articleSlug;
    }
  }

  loadInitialData() {
    if (!this.articleSlug) return Promise.resolve();
    this.inProgress = true;
    return articleStore.loadArticle(this.articleSlug, { acceptCached: true })
      .then(article => {
        if (!article) throw new Error('Can\'t load original article');
        this.title = article.title;
        this.description = article.description;
        this.body = article.body;
        this.tagList = article.tagList;
      })
      .finally(() => 
        this.inProgress = false);
  }

  addTag(tag) {
    if (_.includes(this.tagList, tag)) return;
    this.tagList.push(tag);
  }

  removeTag(tag) {
    this.tagList = _.without(this.tagList, tag)
  }

  submit() {
    this.inProgress = true;
    this.errors = undefined;
    const article = {
      title: this.title,
      description: this.description,
      body: this.body,
      tagList: this.tagList,
      slug: this.articleSlug,
    };
    return (this.articleSlug ? articleStore.updateArticle(article) : articleStore.createArticle(article))
      .catch(err => {
        this.errors = err.response && err.response.body && err.response.body.errors; 
        throw err;
      })
      .finally(() => 
        this.inProgress = false);
  }
}

export default new ArticleEditorStore();
