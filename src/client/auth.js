import focalStorage from '../external/focalStorage.js';



export default class Auth {
  
  static get name() { /* subclass responsibility */}
  static get tokenName() {throw Error('override in subclass')}
  static tokenFromAuthInfo() {throw Error('override in subclass')}
  static get notificationIconURL() {throw Error('override in subclass')}
  static get appInfo() { throw Error('override in subclass')}
  static oauthTokenURL() { throw Error('override in subclass')}
  static oauthURL() { throw Error('override in subclass')}
  
  static logout(cb) {
    focalStorage.setItem(this.tokenName, null).then(cb)
  }

  static parseAuthInfoFromUrl(data) {
    try {
      var authInfo = JSON.parse(
        '{"' + data.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
        (key, value) => { return key === "" ? value : decodeURIComponent(value); });      
    } catch(e) {
      console.warn("[auth] parseAuthInfoFromUrl could not parse ", data)
    }
    return authInfo;
  }

  static notifyMe(title, text, cb) {
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
  
  static onAuthenticated(windowUuid, authInfo) {
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
  
  static popup(url) {
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
  
  static challengeForAuth(uuid, cb) {
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
  
  static token() {
    return new Promise(resolve => {
      this.challengeForAuth(Date.now(), resolve)
    })
  }
  
  static load() {
    this.onAuthenticatedCallbacks = {}
  }

}


