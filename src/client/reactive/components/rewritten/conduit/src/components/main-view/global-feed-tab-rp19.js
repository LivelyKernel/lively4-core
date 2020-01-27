export default ({ tab }) => (
  <li class='nav-item'>
    <link-rp19
      className='nav-link'
      v-isActive={ tab === 'all' }
      v-targetDestination={{
        target: 'home',
        tab: 'all'
      }}
    >
      Global Feed
    </link-rp19>
  </li>
);