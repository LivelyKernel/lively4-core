export default ({ tab }) => (
  <li class='nav-item'>
    <link-rp19
      className='nav-link'
      v-isActive={ tab === 'feed' }
      v-targetDestination={{
        target: 'home',
        tab: 'feed'
      }}
    >
      Your Feed
    </link-rp19>
  </li>
);