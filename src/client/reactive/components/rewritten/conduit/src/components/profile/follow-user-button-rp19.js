export default ({ username, following, follow, unfollow }) => (
  <button
    class={ `btn btn-sm action-btn ${following ? 'btn-secondary' : 'btn-outline-secondary'}` }
    click={ evt => {
      following ? unfollow(username) : follow(username);
      evt.preventDefault();
    } }
  >
    <i className="ion-plus-round" />
    &nbsp;
    { following ? 'Unfollow' : 'Follow' } { username }
  </button>
);