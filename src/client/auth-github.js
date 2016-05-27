'use strict';

import * as messaging from './messaging.js';

import focalStorage from '../external/focalStorage.js';

console.log("focalStorage: ", focalStorage)

console.log("load githubAuth")

function parseAuthInfoFromUrl(data) {
  var authInfo = JSON.parse(
    '{"' + data.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    function(key, value) { return key === "" ? value : decodeURIComponent(value); });
  return authInfo;
}

function notifyMe(title, text, cb) {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification(title, {
      icon: 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png',
      body: text,
    });
    notification.onclick = cb
  }
}


export default class AuthGithub {



  static onAuthenticated(windowUuid, authInfo) {

  	var state = authInfo.state
  	var token = authInfo.access_token

  	if (!state) { console.log("not state! authinfo: " + JSON.stringify(authInfo))}

    if (this.iframe) document.body.removeChild(this.iframe)
    this.iframe = false;


  	localStorage.GithubToken = token // #TODO refactor / remove it
  	focalStorage.setItem("githubToken", localStorage.GithubToken).then(function() {
  		var cb = AuthGithub.onAuthenticatedCallbacks[state]
  		if (cb) {
  			console.log("running onAuthenticated callback: " + cb)
  			cb(token)
  		} else {
  			console.log("no callback found for" + state)
  		}
  	})
  }

  static logout(cb) {
  	localStorage.GithubToken = null
  	focalStorage.setItem("githubToken", null).then(cb)
  }


  static challengeForAuth(uuid, cb) {
  	if (uuid && cb) {
  		AuthGithub.onAuthenticatedCallbacks[uuid] = cb
  	}
  	var self = this;
  	function popup(url) {
  	    var width = 825,
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

  	    // prevent a flashing popup from github by using an iframe
  	    // lively.openComponentInWindow("lively-iframe").then(comp => comp.setURL(url))
  	    self.iframe = document.createElement("iframe")
  	    self.iframe.id = "githubAuth"
  	    self.iframe.src = url
  	    self.iframe.style.display = "none"
  	    self.iframe.width = "1px"
    	  self.iframe.height = "1px"

  	    document.body.appendChild(self.iframe)

  	    setTimeout(() => {
  	      if (!self.iframe) return // everything is ok
  	        document.body.removeChild(self.iframe)
            self.iframe = false;

  	      // github did not authenticate us automatically
          popup = window.open(url, "oauth", features.join(","));
    	    if (!popup) {
      	    	notifyMe("Github Authenfication required", "click here to authenticate", function() {
      	    		console.log("try to open window")
      				  window.open(url, "oauth", features.join(","));
      				})
      	    } else {
      	    	// popup.uuid = lively.net.CloudStorage.addPendingRequest(req);
      	    	popup.focus();
      	    }
  	      }, 5000)
      }

      var appInfo = {
  	        "clientId": "21b67bb82b7af444a7ef",
  	        "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/github.html"
  	 };

  	$.get("https://lively-kernel.org/lively4-auth/open_github_accesstoken?state="+uuid, null, function(data){
  	    console.log("challenge got a token, too: " + data)
  	    var authInfo = parseAuthInfoFromUrl(data)
  	    AuthGithub.onAuthenticated(uuid, authInfo)
  	})
      var url =
          "https://github.com/login/oauth/authorize/" +
          "?client_id=" + appInfo.clientId +
          "&response_type=token" +
         	"&scope=repo,user" +
          "&state=" + uuid +
          "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);

      popup(url);
  }

  static load() {
    this.onAuthenticatedCallbacks = {}

    // receive messages
    navigator.serviceWorker.addEventListener("message", function(event) {
        if (event.data.name == 'githubAuthTokenRequired') {
        	console.log("goth auth token required: " + JSON.stringify(event.data))
        	var callbackId = event.data.callbackId
        	AuthGithub.challengeForAuth(Date.now(), function(token) {
        		messaging.postMessage({
    	        	type: 'callback',
    	    		callbackId: callbackId,
    	    		args: [token]
    			})
        	})
        }
    })
  }
}

AuthGithub.load()


