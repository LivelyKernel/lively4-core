export default ({ article, onDelete }) => (
  <span>
    <link-rp19
      v-targetDestination={{
        target: 'article-editor',
        slug: article.slug
      }}
      className='btn btn-outline-secondary btn-sm'
    >
      <i class='ion-edit' /> Edit Article
    </link-rp19>

    <button 
      class='btn btn-outline-danger btn-sm' 
      click={ () => onDelete(article.slug) }
    >
      <i class='ion-trash-a' /> Delete Article
    </button>

  </span>
);