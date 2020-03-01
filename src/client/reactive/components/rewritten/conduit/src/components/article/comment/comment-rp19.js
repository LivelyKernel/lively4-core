import { convertTimestampToString } from 'src/client/reactive/components/rewritten/conduit/src/date-util-rp19.js';

const isCreatorOfComment = (comment, user) =>
  user && user.username === comment.author.username;

export default ({ comment, currentUser, onDelete }) => (
  <div class='card'>
    <div class='card-block'>
      <p class='card-text'>{ comment.body }</p>
    </div>
    <div class='card-footer'>
      <link-rp19
        v-targetDestination={{ 
          target: 'author',
          author: comment.author.username
        }}
        class='comment-author'
      >
        <img src={ comment.author.image } class='comment-author-img' alt='' />
      </link-rp19>
      &nbsp;
      <link-rp19
        v-targetDestination={{ 
          target: 'author',
          author: comment.author.username
        }}
        class='comment-author'
      >
        { comment.author.username }
      </link-rp19>
      <span class='date-posted'>
        { convertTimestampToString(comment.createdAt) }
      </span>
      {isCreatorOfComment(comment, currentUser) && (
        <span class='mod-options'>
          <i class='ion-trash-a' click={() => onDelete(comment.id)} />
        </span>
      )}
    </div>
  </div>
);