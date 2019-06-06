## 2019-06-03

# Create a branch on with GitHub API

## 1. we need a token

```javascript
var token;
(async () => {
  lively.authGithub.challengeForAuth(Date.now(), t => {
    token = t
  })
})()
```

## 2. we need our current original branch

```javascript

fetch("https://api.github.com/repos/hpi-swa-lab/markdown-paper-template/git/refs/heads/drawio", {
  headers: {
   Authorization: "token " + token 
  }
}).then(r => r.text())
```

```javascript
{
  "ref": "refs/heads/drawio",
  "node_id": "MDM6UmVmMTY4NTMzNzYyOmRyYXdpbw==",
  "url": "https://api.github.com/repos/hpi-swa-lab/markdown-paper-template/git/refs/heads/drawio",
  "object": {
    "sha": "2a13b4251604638cd477c0e7c19f02c52e6c8d26",
    "type": "commit",
    "url": "https://api.github.com/repos/hpi-swa-lab/markdown-paper-template/git/commits/2a13b4251604638cd477c0e7c19f02c52e6c8d26"
  }
}
```


## 3. then we create a new branch

```javascript
fetch("https://api.github.com/repos/hpi-swa-lab/markdown-paper-template/git/refs", {
  method: "POST",
  headers: {
   Authorization: "token " + token 
  },
  body: JSON.stringify({
    "ref": "refs/heads/drawio2",
    "sha": "2a13b4251604638cd477c0e7c19f02c52e6c8d26"
  })
}).then(r => r.text())
```


# New Github Methods

```javascript
import GitHub from "src/client/github.js"

var gh = new GitHub("hpi-swa-lab", "markdown-paper-template")

gh.getBranch("drawio")

gh.ensureBranch("drawio6", "drawio")

gh.getFile("README.md")

gh.setFile("foo2.txt", "drawio", "yea")

gh.deleteFile("foo.txt", "drawio")

gh.getContent("README.md")
```