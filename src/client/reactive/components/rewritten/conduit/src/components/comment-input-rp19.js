'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import commentStore from 'src/client/reactive/components/rewritten/conduit/src/stores/commentStore.js';

export default class CommentInput extends ReactiveMorph {
  
  constructor() {
    super();
    this.comment = '';
  }
  
  /* Event handler */
  
  onCommentForm(event) {
    commentStore.createComment({ body: this.comment })
      .then(() => this.comment = '');
    event.preventDefault();
  }  
  
  render() {
    return (
      <form id='commentForm' class='card comment-form'>
        <div class='card-block'>
          <textarea 
            id='commentTextArea'
            class='form-control'
            placeholder='Write a comment...'
            value={ this.comment }
            disabled={ commentStore.isCreatingComment }
            rows='3'>{ this.comment }</textarea>
        </div>
        <div class='card-footer'>
          <img
            src={ this.props.currentUser.image }
            class='comment-author-img'
            alt=''
          />
          <button
            class='btn btn-sm btn-primary'
            type='submit'
          >
            Post Comment
          </button>
        </div>
      </form>
    );  
  }
}