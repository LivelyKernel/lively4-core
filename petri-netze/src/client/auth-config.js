import Auth from "./auth.js"

const LivelyAuthURL = "https://lively-kernel.org/lively4-auth"

export default class AuthConfig extends Auth {
  
  static get tokenName() {
    return this.name + "Token"
  }
    
  static async getToken() {
    this.config = await fetch(LivelyAuthURL + "/config/" + this.name).then(r => r.json())  
    return new Promise(resolve => {
      this.challengeForAuth(Date.now(), resolve)
    })
  }

  
  static async challengeForAuth(uuid, cb) {
    this.config = await fetch(LivelyAuthURL + "/config/" + this.name).then(r => r.json())  
    super.challengeForAuth(uuid, cb)
  }
  
  static tokenFromAuthInfo(authInfo) {
    return authInfo.token
  }

  static get notificationIconURL() {
    return this.config.iconURL
  }

  static get appInfo() {
    return {
      "clientId": this.config.clientId,
      "redirectUri": this.config.redirectUri
    };
  }

  static oauthTokenURL(uuid) {
    return this.config.openTokenURL + "?state="+uuid
  }
  
  static oauthURL(uuid) {
    return this.config.url +
      "?client_id=" + this.appInfo.clientId +
      "&response_type=token" +
      "&scope=" + this.config.scope +
      "&state=" + uuid +
      "&redirect_uri=" + encodeURIComponent(this.appInfo.redirectUri);
  } 
}

