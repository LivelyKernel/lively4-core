import AuthConfig from "./auth-config.js"

export default class AuthMicrosoft extends AuthConfig {
  static get name() {
    return "microsoft"
  }
}
AuthMicrosoft.load()


