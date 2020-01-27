import ArticleActions from 'src/client/reactive/components/rewritten/conduit/src/components/article/article-actions-rp19.js';
import { convertTimestampToString } from 'src/client/reactive/components/rewritten/conduit/src/date-util-rp19.js';

export default async ({ article, canModify, onDelete }) => {
  const articleActions = { article, onDelete };
  return (
    <div class='article-meta'>
      <link-rp19 v-targetDestination={{ 
        target: 'author',
        author: article.author.username
      }}>
        <img src={ article.author.image } alt='' />
      </link-rp19>

      <div class='info'>
        <link-rp19 
          className="author"
          v-targetDestination={{ 
            target: 'author',
            author: article.author.username
          }}>        
          { article.author.username }
        </link-rp19>
        <span class='date'>
          { convertTimestampToString(article.createdAt) }
        </span>
      </div>

      { canModify && await ArticleActions(articleActions) }
    </div>
  );
}