import AuthConfig from "./auth-config.js"

export default class AuthGmail extends AuthConfig {
  static get name() {
    return "gmail"
  }
}
AuthGmail.load()

