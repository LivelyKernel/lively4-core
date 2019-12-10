## 2019-12-05 #Gmail works



```javascript
import AuthGmail from "src/client/auth-gmail.js"
var token;
(async () => {
  token = await AuthGmail.token()
  var userId = `jens.lincke@gmail.com`

  
  async function gmailAPI(userID, path="/") {
    return fetch(`https://www.googleapis.com/gmail/v1/users/${userId}` + path, {
      method: "GET",
      headers: {
         Authorization: "Bearer " + token,
      }
    }).then(r => r.json())
    
  }
    
  gmailAPI(userId, `/profile`)
  gmailAPI(userId, `/messages`)
  gmailAPI(userId, `/messages/16ed66cc851b6d5a`)
  
  
  gmailAPI(userId, `/threads`)
  
})()
```
