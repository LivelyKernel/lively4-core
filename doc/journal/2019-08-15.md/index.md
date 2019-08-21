## 2019-08-15 New Generic OAuth2

For Microsoft OAuth2 support, the ID and urls are no longer inside the lively4-core lib, but only in lively4-auth. The new [oauth2](edit://src/client/oauth2.js) loads this config at runtime. 


```javascript
import OAuth2 from "https://lively-kernel.org/lively4/lively4-jens/src/client/oauth2.js"

var auth = new OAuth2("microsoft")
// example API 
auth.token()
auth.cachedToken()
auth.logout()
auth.ensureToken()
```

To add a new oauth2 registered app, extend the config in [lively4-auth](https://lively-kernel.org/lively4/lively4-auth2/lively4-auth.js)


```javascript
var services = {
  microsoft: {
    name: "Microsoft",
    openTokenURL: "https://lively-kernel.org/lively4-auth/open_microsoft_accesstoken",
    tokenURL: "https://lively-kernel.org/lively4-auth/microsoft_accesstoken",
    url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scope: "openid",
    clientId: "a1488489-940a-4c2a-ad0e-e95f8b6fd765",
    iconURL: "http://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE2qVsJ?ver=3f74",
    redirectUri: "https://lively-kernel.org/lively4-auth/oauth2/microsoft.html"
  }
}
```

To not store those IDs and urls in a repository, we could load them dynamically after loading lively4-auth. #TODO #OAuth

## Experiments with OData

But I am not so sure if it will bring us forward...

```javascript
import OAuth2 from "src/client/oauth2.js"
import {o} from "src/external/odata.min.js"

var auth = new OAuth2("microsoft");
auth.logout();

(async () => {
  
  
  return o("https://graph.microsoft.com/v1.0/", {
    headers: {
      'Authorization': `Bearer ${await auth.ensureToken()}`
    }
  }).get('drive/root')
    .query();
})()
```


