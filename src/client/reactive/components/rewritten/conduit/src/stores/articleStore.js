'enable aexpr';

import _ from 'src/external/lodash/lodash.js'
import agent from 'src/client/reactive/components/rewritten/conduit/src/agent.js';

const LIMIT = 10;

class ArticleStore {

  constructor() {
    this.articlesRegistry = {};
    this.predicate = {};
    this.page = 0;
    aexpr(() => this.page).onChange(() => this.loadArticles());
    aexpr(() => this.predicate).onChange(() => this.loadArticles());
  }
  
  get articles() {
    return _.values(this.articlesRegistry);
  }

  clear() {
    this.articlesRegistry = {};
    this.page = 0;
  }

  setPredicate(predicate) {
    if (JSON.stringify(predicate) === JSON.stringify(this.predicate)) return;
    this.clear();
    this.predicate = predicate;
  }

  $req() {
    if (this.predicate.tab === 'feed') 
      return agent.Articles.feed(this.page, LIMIT);
    if (this.predicate.tab === 'tag') 
      return agent.Articles.byTag(this.predicate.tag, this.page, LIMIT);
    if (this.predicate.target === 'author' && this.predicate.tab === 'favorites') 
      return agent.Articles.favoritedBy(this.predicate.favoritedBy, this.page, LIMIT);
    if (this.predicate.target === 'author' && this.predicate.tab === 'author') 
      return agent.Articles.byAuthor(this.predicate.author, this.page, LIMIT);
    return agent.Articles.all(this.page, LIMIT);
  }

  loadArticles() {
    this.isLoading = true;
    return this.$req()
      .then(({ articles, articlesCount }) => {
        this.articlesRegistry = _.fromPairs(
          _.map(articles, article => [article.slug, article]));
        this.totalPagesCount = Math.ceil(articlesCount / LIMIT);
      })
      .finally(() => 
        { this.isLoading = false; });
  }

  loadArticle(slug, { acceptCached = false } = {}) {
    if (acceptCached && _.has(this.articlesRegistry, slug))
      return Promise.resolve(this.articlesRegistry[slug]);
    this.isLoading = true;
    return agent.Articles.get(slug)
      .then(({ article }) => {
        this.articlesRegistry[slug] = article;
        return article;
      })
      .finally(() => 
        { this.isLoading = false; });
  }

  makeFavorite(slug) {
    const article = this.articlesRegistry[slug];
    if (article && !article.favorited) {
      article.favorited = true;
      article.favoritesCount++;
      return agent.Articles.favorite(slug)
        .catch(() => {
          article.favorited = false;
          article.favoritesCount--;
        });
    }
    return Promise.resolve();
  }

  unmakeFavorite(slug) {
    const article = this.articlesRegistry[slug];
    if (article && article.favorited) {
      article.favorited = false;
      article.favoritesCount--;
      return agent.Articles.unfavorite(slug)
        .catch(err => {
          article.favorited = true;
          article.favoritesCount++;
          throw err;
        });
    }
    return Promise.resolve();
  }

  createArticle(article) {
    return agent.Articles.create(article)
      .then(({ article }) => {
        this.articlesRegistry[article.slug] = article;
        return article;
      });
  }

  updateArticle(data) {
    return agent.Articles.update(data)
      .then(({ article }) => {
        this.articlesRegistry[article.slug] = article;
        return article;
      });
  }

  deleteArticle(slug) {
    _.unset(this.articlesRegistry, slug);
    return agent.Articles.del(slug)
      .catch(err => { 
      this.loadArticles(); 
      throw err; 
    });
  }
}

export default new ArticleStore();