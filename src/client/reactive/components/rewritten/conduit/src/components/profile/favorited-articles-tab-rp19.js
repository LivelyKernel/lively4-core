export default ({ tab, username }) => (
  <li class='nav-item'>
    <link-rp19
      className='nav-link'
      v-isActive={ tab === 'favorites' }
      v-targetDestination={{
        target: 'author',
        tab: 'favorites',
        author: username
      }}
    >
      Favorited Articles
    </link-rp19>
  </li>
);