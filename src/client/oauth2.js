import Auth from "./auth.js"
import focalStorage from '../external/focalStorage.js';

const LivelyAuthURL = "https://lively-kernel.org/lively4-auth"

export default class AuthGeneric extends Auth {
  
 constructor(name) {
    super()
    this.name = name
    this.onAuthenticatedCallbacks = {}
  }

  logout(cb) {
    focalStorage.setItem(this.tokenName, null).then(cb)
  }

  parseAuthInfoFromUrl(data) {
    var authInfo = JSON.parse(
      '{"' + data.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      (key, value) => { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
  }

  notifyMe(title, text, cb) {
    if (Notification.permission !== "granted")
      Notification.requestPermission();
    else {
      var notification = new Notification(title, {
        icon: this.notificationIconURL,
        body: text,
      });
      notification.onclick = cb
    }
  }
  
  onAuthenticated(windowUuid, authInfo) {
    var state = authInfo.state
    var token = this.tokenFromAuthInfo(authInfo)

    if (!state) { 
      throw new Error("AuthError, no state! Authinfo: " + JSON.stringify(authInfo))
    }
    focalStorage.setItem(this.tokenName, token).then(() => {
      var cb = this.onAuthenticatedCallbacks[state]
      if (cb) {
        cb(token)
      } else {
        throw new Error("AuthError: no callback found for" + state)
      }
    })
  }
  
  popup(url) {
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
      this.notifyMe(this.name + " Authenfication required", "click here to authenticate", () => {
      window.open(url, "oauth", features.join(","));
      })
    } else {
      popupWindow.focus();
    }
  }
  
  
  async challengeForAuth(uuid, cb) {
    this.config = await fetch(LivelyAuthURL + "/config/" + this.name).then(r => r.json())  
    
    if (uuid && cb) {
      this.onAuthenticatedCallbacks[uuid] = cb
    }
    fetch(this.oauthTokenURL(uuid))
      .then(r => r.text())
      .then(data => {
        // console.log("challenge got a token, too: " + data)      
        var authInfo = this.parseAuthInfoFromUrl(data)
        this.onAuthenticated(uuid, authInfo)
    })
    this.popup(this.oauthURL(uuid));
  }
  
  token() {
    return new Promise(resolve => {
      this.challengeForAuth(Date.now(), resolve)
    })
  }

  cachedToken() {
    return focalStorage.getItem(this.tokenName)
  }
  
  async ensureToken() {
    var token = await this.cachedToken()
    if (token) {
      return token
    } else {
      return this.token()
    }
  }
  

  get tokenName() {
    return this.name + "Token"
  }
  
  
 
  
  tokenFromAuthInfo(authInfo) {
    return authInfo.token
  }

  get notificationIconURL() {
    return this.config.iconURL
  }

  get appInfo() {
    return {
      "clientId": this.config.clientId,
      "redirectUri": this.config.redirectUri
    };
  }

  oauthTokenURL(uuid) {
    return this.config.openTokenURL + "?state="+uuid
  }
  
  oauthURL(uuid) {
    return this.config.url +
      "?client_id=" + this.appInfo.clientId +
      "&response_type=token" +
      "&scope=" + this.config.scope +
      "&state=" + uuid +
      "&redirect_uri=" + encodeURIComponent(this.appInfo.redirectUri);
  } 
}

