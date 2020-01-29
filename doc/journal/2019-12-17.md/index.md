## 2019-12-17 #CoolBug
*Author: @JensLincke*

The issue was that sometimes when merging, typed text is lost....

**Where is the bug?**


```javascript
 async solveConflic(otherVersion , newVersion) {
    var conflictId =  `conflic-${otherVersion}-${newVersion}` 
    if (this.solvingConflict == conflictId) {
      lively.error("Sovling conflict stopped", "due to recursion: " + this.solvingConflict)
      return 
    }
    if (this.solvingConflic) {
      lively.warn("Recursive Solving Conflict", "" + this.solvingConflict + " and now: " + conflictId)
      return 
    }
    
    var parentText = this.lastText; // 
    // load from conflict version
    var myText = this.currentEditor().getValue(); // data
    var otherText = await fetch(this.getURL(), {
        headers: {fileversion: otherVersion}
      }).then( r => r.text()); 

    var mergedText = this.threeWayMerge(parentText, myText, otherText);
    this.setText(mergedText, true);
    this.lastVersion = otherVersion;
    this.solvingConflict = conflictId
    try {
      // here it can come to infinite recursion....
      await this.saveFile(); 
    } finally {
      this.solvingConflict = false
    }
  }
```  
  
### Answer:

Look again at those lines...

```javascript
var myText = this.currentEditor().getValue(); // data
var otherText = await fetch(this.getURL(), {
  headers: {fileversion: otherVersion}
}).then( r => r.text()); 

var mergedText = this.threeWayMerge(parentText, myText, otherText);
this.setText(mergedText, true);
```

And the problem is, that after we have `myText` in the first line, it still can change when the user continues typing... because async fetching takes time. 

Switching the lines fixes the problem! :-)

```javascript
var otherText = await fetch(this.getURL(), {
  headers: {fileversion: otherVersion}
}).then( r => r.text()); 
var myText = this.currentEditor().getValue(); // data

var mergedText = this.threeWayMerge(parentText, myText, otherText);
this.setText(mergedText, true);
```


