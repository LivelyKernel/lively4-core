'use strict';

import * as messaging from './messaging.js';
import {log} from './load.js';

import focalStorage from '../external/focalStorage.js';


console.log("focalStorage: ", focalStorage)
console.log("load dropboxAuth")


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
      icon: 'https://cf.dropboxstatic.com/static/images/brand/glyph-vflK-Wlfk.png',
      body: text,
    });
    notification.onclick = cb
  }
}


export default class AuthDropbox {

  static onAuthenticated(windowUuid, authInfo) {

  	var state = authInfo.state
  	var token = authInfo.token

  	if (!state) { console.log("not state! authinfo: " + JSON.stringify(authInfo))}
  	console.log("authInfo: ", authInfo)
  	focalStorage.setItem("dropboxToken", token).then(function() {
  		var cb = AuthDropbox.onAuthenticatedCallbacks[state]
  		if (cb) {
  			console.log("running onAuthenticated callback: " + cb)
  			cb(token)
  		} else {
  			console.log("no callback found for" + state)
  		}
  	})
  }

  static logout(cb) {
  	focalStorage.setItem("dropboxToken", null).then(cb)
  }


  static challengeForAuth(uuid, cb) {
  	if (uuid && cb) {
  		AuthDropbox.onAuthenticatedCallbacks[uuid] = cb
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
  	    var popupWindow = window.open(url, "oauth", features.join(","));
  	    if (!popupWindow) {
  	    	notifyMe("Dropbox Authenfication required", "click here to authenticate", function() {
  	    		console.log("try to open window")
  				window.open(url, "oauth", features.join(","));
  	    	})
  	    } else {
  	    	// popup.uuid = lively.net.CloudStorage.addPendingRequest(req);
  	    	popupWindow.focus();
  	    }
  	}

      var appInfo = {
  	        "clientId": "1774dvkirby4490",
  	        "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/dropbox.html"
  	 };

  	$.get("https://lively-kernel.org/lively4-auth/open_dropbox_accesstoken?state="+uuid, null, function(data){
  	    console.log("challenge got a token, too: " + data)
  	    var authInfo = parseAuthInfoFromUrl(data)
  	    AuthDropbox.onAuthenticated(uuid, authInfo)
  	})

      var url =
              "https://www.dropbox.com/1/oauth2/authorize" +
              "?client_id=" + appInfo.clientId +
              "&response_type=token" +
              "&state=" + uuid +
              "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);

      console.log("query dropbox")

      popup(url);
  }

  static load() {
    this.onAuthenticatedCallbacks = {}
    // receive messages
    navigator.serviceWorker.addEventListener("message", function(event) {
        if (event.data.name == 'githubAuthTokenRequired') {
        	console.log("goth auth token required: " + JSON.stringify(event.data))
        	var callbackId = event.data.callbackId
        	AuthDropbox.challengeForAuth(Date.now(), function(token) {
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
AuthDropbox.load()


