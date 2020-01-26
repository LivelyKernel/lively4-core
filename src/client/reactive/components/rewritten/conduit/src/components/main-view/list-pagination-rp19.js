import _ from 'src/external/lodash/lodash.js'

export default async ({ currentPage, onSetPage, totalPagesCount }) => {
  if (totalPagesCount < 2) return;
  const pageRange = _.range(1, totalPagesCount + 1);
  return (
    <nav>
      <ul class='pagination'>
        {...await Promise.all(
          _.map(pageRange, page => {
            const isCurrent = page === currentPage;
            return (
              <li 
                class={ isCurrent ? 'page-item active' : 'page-item' } 
                click={() => onSetPage(page)}
              >
                <a class="page-link" href="#" click={evt => evt.preventDefault()}>{ page }</a>
              </li> 
            );
          })
        )}
      </ul>
    </nav>
  );
}