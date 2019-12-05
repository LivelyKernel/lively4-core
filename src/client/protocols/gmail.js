import RestScheme  from "./rest.js"
import PolymorphicIdentifier  from "src/client/poid.js"
import {parseQuery, getDeepProperty} from 'utils'
  
import OAuth2 from "src/client/oauth2.js"


export default class GmailScheme extends RestScheme {
  
  get scheme() {
    return "gmail"
  }
  
  get baseURL() {
    return "https://www.googleapis.com/gmail/v1/users/"
  }

  auth() {
     return new OAuth2("gmail")
  }

   async OPTIONS(options) {
  
    var result = {
      name: this.path,
      type: "directory",
      contents: []
    }
    
    
    
    return new Response(JSON.stringify(result, undefined, 2))
  }
  
}



PolymorphicIdentifier.register(GmailScheme)