## 2020-11-30 #Server #Testing #Issue
*Author: @JensLincke*


## How to Automate this Test?

1. Setup:
```javascript
lively.files.saveFile("http://localhost:9006/Dropbox/Thesis/Literature/_misc/foo.md", "test content")
```

2. Test:
```javascript
fetch("http://localhost:9006/Dropbox/Thesis/Literature/_misc/foo.md", {
        method: "MOVE",
        headers: {
          destination: "http://localhost:9006/Dropbox/Thesis/Literature/_misc/" + encodeURI("foo―é.md")
        }
      }).then(r => r.text())
```

3. check that there is not error... and the file is there?