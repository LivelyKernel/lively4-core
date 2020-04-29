import Auth from "./auth.js"

export default class AuthDropbox extends Auth {
  static get name() {
    return "Dropbox"
  }

  static get tokenName() {
    return "dropboxToken"
  }
  
  static tokenFromAuthInfo(authInfo) {
    return authInfo.token
  }

  static get notificationIconURL() {
    return 'https://cf.dropboxstatic.com/static/images/brand/glyph-vflK-Wlfk.png'
  }

  static get appInfo() {
    return {
          "clientId": "1774dvkirby4490",
          "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/dropbox.html"
    };
  }

  static oauthTokenURL(uuid) {
    return "https://lively-kernel.org/lively4-auth/open_dropbox_accesstoken?state="+uuid
  }
  
  static oauthURL(uuid) {
    return "https://www.dropbox.com/1/oauth2/authorize" +
      "?client_id=" + this.appInfo.clientId +
      "&response_type=token" +
      "&state=" + uuid +
      "&redirect_uri=" + encodeURIComponent(this.appInfo.redirectUri);
  } 
}
AuthDropbox.load()


