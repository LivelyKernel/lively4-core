export default ({ username, image }) => (
  <ul class="nav navbar-nav pull-xs-right">
    <li id="home" class="nav-item">
      <link-rp19 
        v-targetDestination={{ target: 'home', tab: 'all' }} 
        className="nav-link"
      >
        Home
      </link-rp19>
    </li>

    <li id="editor" class="nav-item">
      <link-rp19 
        v-targetDestination={{ target: 'article-editor' }} 
        className="nav-link"
      >
        <i class="ion-compose" />{ ' New Post' }
      </link-rp19>
    </li>

    <li id="settings" class="nav-item">
      <link-rp19 
        v-targetDestination={{ target: 'settings' }} 
        className="nav-link"
      >
        <i class="ion-gear-a" />{ ' Settings' }
      </link-rp19>
    </li>
    
    <li id="user" class="nav-item">
      <link-rp19
        v-targetDestination={{ 
          target: 'author',
          tab: 'author',
          author: username
        }}
        className="nav-link"
      >
        <img src={ image } class="user-pic" />
        { username }
      </link-rp19>
    </li>
  </ul>
);

