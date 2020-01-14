# Filelist

Example:

```javascript
fetch("https://lively-kernel.org/lively4/lively4-core/doc/",{
  method: "OPTIONS",
  headers: {
    filelist: true
  }
}).then(r => r.text())
```

And we expect something like this:

```javascript
{  "type": "filelist",
  "contents": [
    {
      "modified": "2018-03-19 16:55:50",
      "type": "file",
      "size": "231",
      "name": "./chrome-extension.md"
    },
    {
      "modified": "2019-03-29 11:15:21",
      "type": "directory",
      "size": "4096",
      "name": "./presentation"
    },
    {
      "modified": "2019-02-12 14:59:18",
      "type": "file",
      "size": "90843",
      "name": "./presentation/lively-essay.png"
    },
    {
      "modified": "2019-02-12 14:59:18",
      "type": "file",
      "size": "2007",
      "name": "./presentation/figure.html"
    }
  ]
}
```