'enable aexpr';

import _ from 'src/external/lodash/lodash.js'
import agent from 'src/client/reactive/components/rewritten/conduit/src/agent.js';

class CommentStore {

  constructor() {
    this.comments = [];
    aexpr(() => this.articleSlug).onChange(() => this.loadComments());
  }

  loadComments() {
    this.isLoadingComments = true;
    this.commentErrors = undefined;
    return agent.Comments.forArticle(this.articleSlug)
      .then(({ comments }) => this.comments = comments)
      .catch(err => {
        this.commentErrors = err.response && err.response.body && err.response.body.errors;
        throw err;
      })
      .finally(() => this.isLoadingComments = false);
  }
  
  createComment(comment) {
    this.isCreatingComment = true;
    return agent.Comments.create(this.articleSlug, comment)
      .then(() => this.loadComments())
      .finally(() => this.isCreatingComment = false);
  }
  
  deleteComment(id) {
    return agent.Comments.delete(this.articleSlug, id)
      .then(() => 
        _.remove(this.comments, comment => comment.id = id))
      .catch(err => { 
        this.loadComments();
        throw err 
      });
  }
}

export default new CommentStore();