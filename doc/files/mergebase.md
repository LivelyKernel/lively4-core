# Merge Base

## Example (using _git without sync tool)

```javascript
import Github from "src/client/github.js"

var github = Github.current()


var repo = "lively4-dummyA"

var headers = new Headers({
    "gitusername":          github.username,
    "gitpassword":          github.token, 
    "gitemail":             github.email,
    "gitrepository":        repo,
    gitversiona: "HEAD",
    gitversionb: "fd956",
  })

fetch("https://lively-kernel.org/lively4S2/_git/mergebase", {
  headers: headers
}).then(r => r.text()) // -> RESOLVED: 7d66773a9d35de3c95b0478b2fccf70c97c0061a

```