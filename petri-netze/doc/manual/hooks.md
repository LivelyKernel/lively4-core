# Hooks 

Lively components (HTML elements) can implement hooks to better integrate into the environment.

## `livelyInspect`

Allows to customize the [lively-inspector](search://name=lively-inspector.js).

```javascript
class Selection {
  livelyInspect(contentNode, inspector) {
    var selection = <div class="element"><i>selection</i></div>
    contentNode.appendChild(selection)
    this.nodes.forEach(ea => {
      selection.appendChild(inspector.display(ea, false, null, this));
    })
  }
}
```

## `livelyHalo`

To customize the [lively halo tool](browse://src/components/halo/lively-halo.js).

Example from `Connector`:

```javascript
livelyHalo() {
    return {
      configureHalo(halo) {
        halo.setHandleVisibility(true);
        
        let path = this.getPath();
        // halo.get("lively-halo-drag-item").style.visibility= "hidden"
        halo.ensureControlPoint(path, 0, true);
        halo.ensureControlPoint(path, 1, true);
      },
      dragBehaviorMove(halo, evt, pos) {}
    };
  }
```

## `localizePosition`

Make a global position relative, so it can be used in local content.

```javascript
localizePosition(pos) {
    var offsetBounds = this.get('#container-content').getBoundingClientRect();
    return pos.subPt(pt(offsetBounds.left, offsetBounds.top));
  }
```


## `livelyAllowsSelection`

Example from Container:

```javascript  
  
  // #hook
  livelyAllowsSelection(evt) {
    if (!this.contentIsEditable() || this.isEditing()) return false

    if (evt.composedPath()[0].id == "container-content") return true;

    return false
  }
```

## `livelyAcceptsDrop`


Example from Container:


```javascript  
  livelyAcceptsDrop() {
    return this.contentIsEditable() && !this.isEditing()
  }
```

## `livelyPrepareSave`

Allows objects to save/store/persists transient data in DOM attributes (or children).

Example from Container:

```javascript  
  livelyPrepareSave() {
    this.setAttribute("leftpane-flex", this.get("#container-leftpane").style.flex)
    this.setAttribute("rightpane-flex", this.get("#container-rightpane").style.flex)
  }
```


## `livelyPreMigrate`

Called before Migration, when the original object is still in its world and context. 

Example from Container:
  
```javascript  
  livelyPreMigrate() {
    // do something before I got replaced
    this.oldContentScroll = this.get("#container-content").scrollTop;
 	  var livelyEditor = this.get("#editor");
    if (livelyEditor) {
      this.oldScrollInfo = livelyEditor.getScrollInfo()
      this.oldCursor = livelyEditor.getCursor()
      this.oldFocused = document.activeElement == this
    }
  }
```
  
```javascript  

  // #hook
  async livelyExample() {
    return this.followPath(lively4url + "/README.md")
  }
```


## `livelyTarget`

Customize clipboard interaction... etc

Example from Container:
  
```javascript  
  livelyTarget() {
    var markdownElement = this.get("lively-markdown")
    if (markdownElement && markdownElement.get) { // maybe not initialized yet.. damn! 
      return markdownElement.get("#content")
    }
    return this
  }
```

## `livelyMigrate`


Example from Container:

```javascript  
  livelyMigrate(other) {
    // other = that

    this._history = other._history;
    this._forwardHistory = other._forwardHistory;
    
    this.isMigrating = true;
    this.preserveContentScroll = other.oldContentScroll;
    var editor = other.get("#editor");
    if (editor) {
      var otherCodeMirror = editor.currentEditor();
      if (otherCodeMirror && otherCodeMirror.selection) {
        var range = otherCodeMirror.selection.getRange();
        var scrollTop = otherCodeMirror.session.getScrollTop();
        this.asyncGet("#editor").then( editor => {
          var thisCodeMirror = editor.currentEditor();
          if (otherCodeMirror && thisCodeMirror) {
            thisCodeMirror.session.setScrollTop(scrollTop);
            thisCodeMirror.selection.setRange(range);
          }
          this.isMigrating = false;
        }).catch(() => {
          // jsut to be sure..
          this.isMigrating = false;
        });
      }
      this.asyncGet("#editor").then( editor => {
        editor.setScrollInfo(other.oldScrollInfo)
      	editor.setCursor(other.oldCursor)
      	if (other.oldFocused) {
      	  // lively.notify("set focus again!")
      	  // setTimeout(() => editor.focus(), 1000)
        }
      })
    } else {
      this.isMigrating = false;
    }
  }
```