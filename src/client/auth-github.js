import Auth from "./auth.js"

export default class AuthGithub extends Auth {
  
  static get notificationIconURL() {
    return 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png'
  }
  
  static get tokenName() {
    return "githubToken"
  }
  
  static tokenFromAuthInfo(authInfo) {
    return authInfo.access_token
  }
 
  static get appInfo() {
    return {
      "clientId": "21b67bb82b7af444a7ef",
      "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/github.html"
    };
  }
  
  static oauthTokenURL(uuid) {
    return "https://lively-kernel.org/lively4-auth/open_github_accesstoken?state="+uuid
  }
  
  static oauthURL(uuid) {
    return "https://github.com/login/oauth/authorize/" +
      "?client_id=" + this.appInfo.clientId +
      "&response_type=token" +
      "&scope=repo,user" +
      "&state=" + uuid +
      "&redirect_uri=" + encodeURIComponent(this.appInfo.redirectUri);
  }
}
AuthGithub.load()


