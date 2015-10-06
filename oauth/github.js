function onAuthCallback() {
    var authInfo = getAuthInfoFromUrl();
    var token = authInfo["access_token"],
        uuid = authInfo["state"];

    localStorage.GithubToken = token
    focalStorage.setItem("githubToken", token).then(function() {
    	window.opener.githubAuth.onAuthenticated(window.uuid, token, uuid, window);
    })
}

function getAuthInfoFromUrl() {
  if (window.location.hash) {
    var authResponse = window.location.hash.substring(1);
    var authInfo = JSON.parse(
      '{"' + authResponse.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function(key, value) { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
  }
  else {
    alert("failed to receive auth token");
  }
}

