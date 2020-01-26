import _ from 'src/external/lodash/lodash.js';

import Comment from 'src/client/reactive/components/rewritten/conduit/src/components/article/comment/comment-rp19.js';

export default async ({ comments, currentUser, onDelete }) => {
  const commentObjects = _.map(comments, comment => ({ 
    comment, 
    currentUser,
    onDelete
  }));
  return (
    <div>
      {...await _.map(commentObjects, comment => 
                      Comment(comment))
      }
    </div>
  );
}