'enable rp19-jsx';

import articleStore from 'src/client/reactive/components/rewritten/conduit/src/stores/articleStore.js';
import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import TagList from 'src/client/reactive/components/rewritten/conduit/src/components/generic/tag-list-rp19.js';
import { convertTimestampToString } from 'src/client/reactive/components/rewritten/conduit/src/date-util-rp19.js';

export default class ArticlePreview extends ReactiveMorph {

  onFavoriteButton() {
    const { article: { favorited, slug } } = this.props;
    if (favorited)
      articleStore.unmakeFavorite(slug);
    else
      articleStore.makeFavorite(slug);
  }
  
  async render() {
    if (!this.props.article) return;
    const favoriteButtonClass = this.props.article.favorited ? 'btn-primary' : 'btn-outline-primary';
    const tagList = { tags: this.props.article.tagList };
    return (
      <div class='article-preview'>
        <div class='article-meta'>
          <link-rp19 v-targetDestination={{ 
            target: 'author', 
            username: this.props.article.author.username 
          }}>
            <img src={ this.props.article.author.image } alt='' />
          </link-rp19>

          <div class='info'>
            <link-rp19 className='author' v-targetDestination={{ 
              target: 'author', 
              username: this.props.article.author.username 
            }}>
              { this.props.article.author.username }
            </link-rp19>
            <span class='date'>
              { convertTimestampToString(this.props.article.createdAt) }
            </span>
          </div>

          <div class='pull-xs-right'>
            <button id='favoriteButton' class={ `btn btn-sm ${favoriteButtonClass}` }>
              <i class='ion-heart' /> 
              { this.props.article.favoritesCount }
            </button>
          </div>
        </div>

        <link-rp19 className='preview-link' v-targetDestination={{ 
          target: 'article', 
          slug: this.props.article.slug
        }}>
          <h1>{ this.props.article.title }</h1>
          <p>{ this.props.article.description }</p>
          <span>Read more...</span>
          
          { await TagList(tagList) }
        </link-rp19>
      </div>
    );
  }
}