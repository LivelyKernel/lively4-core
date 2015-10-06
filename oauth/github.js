function onAuthCallback() {

	var authInfo = getAuthInfoFromUrl()

	if (authInfo && authInfo["access_token"]) {

	    var token = authInfo["access_token"];

	    localStorage.GithubToken = token
	    focalStorage.setItem("githubToken", token).then(function() {
	    	window.opener.githubAuth.onAuthenticated(window.uuid, token);
	    	// window.close()
	    })
	    return 
	}

    var codeInfo = getCodeFromUrl();
    if (!codeInfo) {
    	alert("failed to receive auth code (the token to get the token)");
    	return 
  	}


    var code = codeInfo["code"]

    jQuery.post("https://github.com/login/oauth/access_token",{
    	client_id: "21b67bb82b7af444a7ef",
    	client_secret: "e9ae61b190c5f82a9" + "e3d6d0d2f97e8ad4ba29d18",
    	code: code,
    	redirect_uri: "https://livelykernel.github.io/lively4-core/oauth/github.html",
    	state: ""
    }, 
    function(data, status, xhr) {
    	// we should be redirected.... 
    })

}

function getCodeFromUrl() {
  if (window.location.search) {
    var authResponse = window.location.search.substring(1);
    var authInfo = JSON.parse(
      '{"' + authResponse.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function(key, value) { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
  }
}


function getAuthInfoFromUrl() {
  if (window.location.hash) {
    var authResponse = window.location.hash.substring(1);
    var authInfo = JSON.parse(
      '{"' + authResponse.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function(key, value) { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
  }
}
