import Auth from "./auth.js"

export default class AuthGoogledrive extends Auth {
    static get name() {
    return "googledrive"
  }

  static get tokenName() {
    return "googledriveToken"
  }
  
  static tokenFromAuthInfo(authInfo) {
    return authInfo.token
  }

  static get notificationIconURL() {
    return 'http://www.google.com/drive/images/drive/logo-drive.png'
  }

  static get appInfo() {
    return {
      "clientId": "255612037819-mggijqbougej39s0j95oqvq3ej5hid79.apps.googleusercontent.com",
      "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/googledrive.html"
    };
  }

  static oauthTokenURL(uuid) {
    return "https://lively-kernel.org/lively4-auth/open_googledrive_accesstoken?state="+uuid
  }
  
  static oauthURL(uuid) {
    return "https://accounts.google.com/o/oauth2/v2/auth" +
      "?client_id=" + this.appInfo.clientId +
      "&response_type=token" +
      "&scope=https://www.googleapis.com/auth/drive" +
      "&state=" + uuid +
      "&redirect_uri=" + encodeURIComponent(this.appInfo.redirectUri);
  } 
}
AuthGoogledrive.load()


