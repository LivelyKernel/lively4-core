'enable rp19-jsx';

import marked from 'src/external/marked.js';
import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import articleStore from 'src/client/reactive/components/rewritten/conduit/src/stores/articleStore.js';
import userStore from 'src/client/reactive/components/rewritten/conduit/src/stores/userStore.js';
import commentStore from 'src/client/reactive/components/rewritten/conduit/src/stores/commentStore.js';
import ArticleMeta from 'src/client/reactive/components/rewritten/conduit/src/components/article/article-meta-rp19.js';
import TagList from 'src/client/reactive/components/rewritten/conduit/src/components/generic/tag-list-rp19.js';
import CommentContainer from 'src/client/reactive/components/rewritten/conduit/src/components/article/comment/comment-container-rp19.js';


import { router } from 'src/client/reactive/components/rewritten/conduit/rpComponents/router-rp19.js';

export default class Article extends ReactiveMorph {

  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      const slug = this.getSlugFromRoutingProps();
      articleStore.loadArticle(slug, { acceptCached: true });
      commentStore.articleSlug = slug;
    });
  }
  
  isArticleAuthor(article, user) {
    return user && user.username === article.author.username;
  }
  
  getSlugFromRoutingProps() {
    const routingProps = router() && router().current;
    return routingProps && routingProps.slug;
  }
  
  handleDeleteArticle(slug) {
    articleStore.deleteArticle(slug)
      .then(() => router().navigateTo({ target: 'home' }))
  }
  
  handleDeleteComment(id) {
    commentStore.deleteComment(id);
  }
  
  async render() {
    const article = articleStore.articlesRegistry[this.getSlugFromRoutingProps()];
    if (!article) return <red-error-rp19 v-message="Can't load article" />;
    const markdown = <div />;
    markdown.innerHTML = marked(article.body, { sanitize: true });
    const tagList = { tags: article.tagList };
    const commentContainer = { 
      comments: commentStore.comments,
      errors: commentStore.commentErrors,
      currentUser: userStore.currentUser,
      onDelete: this.handleDeleteComment
    };
    const articleMeta = { 
      article, 
      canModify: this.isArticleAuthor(article, userStore.currentUser), 
      onDelete: this.handleDeleteArticle
    };
    return (
      <div class='article-page'>
        <div class='banner'>
          <div class='container'>

            <h1>{ article.title }</h1>
            { await ArticleMeta(articleMeta) }
          </div>
        </div>
        <div class='container page'>
          <div class='row article-content'>
            <div class='col-xs-12'>
              { markdown }
              { await TagList(tagList) }
            </div>
          </div>
          <hr />

          <div className="article-actions" />
          <div className="row">
            { await CommentContainer(commentContainer) }
          </div>
        </div>
      </div>
    );
  }
}