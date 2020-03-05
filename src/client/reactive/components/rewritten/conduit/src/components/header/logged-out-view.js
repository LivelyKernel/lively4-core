export default () => (
  <ul class="nav navbar-nav pull-xs-right">
    <li id="home" class="nav-item">
      <link-rp19 
        v-targetDestination={{ target: 'home', tab: 'all' }} 
        className="nav-link"
      >
        Home
      </link-rp19>
    </li>

    <li id="sign-in" class="nav-item">
      <link-rp19
        v-targetDestination={{ target: 'login'}} 
        className="nav-link"
      >
        Sign in
      </link-rp19>
    </li>

    <li id="sign-up" class="nav-item">
      <link-rp19 
        v-targetDestination={{ target: 'register'}} 
        className="nav-link"
      >
        Sign up
      </link-rp19>
    </li>
  </ul>
);