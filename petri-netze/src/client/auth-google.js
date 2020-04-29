import AuthConfig from "./auth-config.js"

export default class AuthGoogle extends AuthConfig {
  static get name() {
    return "google"
  }
}
AuthGoogle.load()


