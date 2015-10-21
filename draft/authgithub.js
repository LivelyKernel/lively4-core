'use strict';

var onAuthenticatedCallbacks = {}

log("load githubAuth")


export function onAuthenticated(windowUuid, authInfo) {

	var state = authInfo.state
	var token = authInfo.access_token

	if (!state) { alert("authinfo: " + JSON.stringify(authInfo))}

	localStorage.GithubToken = token
	focalStorage.setItem("githubToken", localStorage.GithubToken).then(function() {
		var cb = onAuthenticatedCallbacks[state]
		if (cb) {cb(token)}
	})
}

export function logout(cb) {
	localStorage.GithubToken = null
	focalStorage.setItem("githubToken", null).then(cb)
}

function parseAuthInfoFromUrl(data) {
  var authInfo = JSON.parse(
    '{"' + data.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    function(key, value) { return key === "" ? value : decodeURIComponent(value); });
  return authInfo;
}


export function challengeForAuth(uuid, cb) {
	if (uuid && cb) {
		onAuthenticatedCallbacks[uuid] = cb
	}
	function popup(url) {
	    var width = 525,
	        height = 525,
	        screenX = window.screenX,
	        screenY = window.screenY,
	        outerWidth = window.outerWidth,
	        outerHeight = window.outerHeight;

	    var left = screenX + Math.max(outerWidth - width, 0) / 2;
	    var top = screenY + Math.max(outerHeight - height, 0) / 2;
	    
	    var features = [
	              "width=" + width,
	              "height=" + height,
	              "top=" + top,
	              "left=" + left,
	              "status=no",
	              "resizable=yes",
	              "toolbar=no",
	              "menubar=no",
	              "scrollbars=yes"];
	    popup = window.open(url, "oauth", features.join(","));
	    if (!popup) {
	        alert("failed to pop up auth window");
	    }
	    // popup.uuid = lively.net.CloudStorage.addPendingRequest(req);
	    popup.focus();
	}

    var appInfo = {
	        "clientId": "21b67bb82b7af444a7ef",
	        "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/github.html"
	 };

	$.get("https://lively-kernel.org/lively4-auth/open_github_accesstoken?state="+uuid, null, function(data){
	    alert("challenge got a token, too: " + data)
	    var authInfo = parseAuthInfoFromUrl(data)
	    onAuthenticated(uuid, authInfo)
	})

    var url =
        "https://github.com/login/oauth/authorize/" +
        "?client_id=" + appInfo.clientId +
        "&response_type=token" +
       	"&scope=repo" +
        "&state=" + uuid +
        "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);
    popup(url);
}

