import CommentList from 'src/client/reactive/components/rewritten/conduit/src/components/article/comment/comment-list-rp19.js';
import ListErrors from 'src/client/reactive/components/rewritten/conduit/src/components/generic/list-errors-rp19.js';

export default async ({ comments, currentUser, errors, onDelete }) => {
  const commentList = currentUser ? {comments, currentUser, onDelete} : {comments, onDelete};
  return currentUser ? (
    <div class='col-xs-12 col-md-8 offset-md-2'>
      <div>
        { ListErrors({ errors }) }
        <comment-input-rp19 v-currentUser={currentUser}/>
      </div>

      { await CommentList(commentList) }
    </div>
  ) : (
    <div class='col-xs-12 col-md-8 offset-md-2'>
      <p>
        <link-rp19 v-targetDestination={{ target: 'login' }}>Sign in</link-rp19>
        &nbsp;or&nbsp;
        <link-rp19 v-targetDestination={{ target: 'register' }}>sign up</link-rp19>
        &nbsp;to add comments on this article.
      </p>

      { await CommentList(commentList) }
    </div>
  );
}