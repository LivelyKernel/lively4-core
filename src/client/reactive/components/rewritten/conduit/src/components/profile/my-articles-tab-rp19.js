export default ({ tab, username }) => (
  <li class='nav-item'>
    <link-rp19
      className='nav-link'
      v-isActive={ tab === 'author' }
      v-targetDestination={{
        target: 'author',
        tab: 'author',
        author: username
      }}
    >
      My Articles
    </link-rp19>
  </li>
);