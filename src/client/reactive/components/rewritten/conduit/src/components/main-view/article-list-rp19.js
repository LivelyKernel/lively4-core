import _ from 'src/external/lodash/lodash.js';
import ListPagination from 'src/client/reactive/components/rewritten/conduit/src/components/main-view/list-pagination-rp19.js';

export default async ({ articles, loading, onSetPage, totalPagesCount, currentPage }) => {
  if (loading && articles.length === 0) {
    return (
      <loading-spinner-rp19 />
    );
  }

  if (articles.length === 0) {
    return (
      <div class='article-preview'>
        No articles are here... yet.
      </div>
    );
  }
  return (
    <div>
      {..._.map(articles, article => (
          <article-preview-rp19 v-article={article} />
        )
      )}
      { await ListPagination({ currentPage, totalPagesCount, onSetPage })}
    </div>
  );
}