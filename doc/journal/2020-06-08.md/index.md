## 2020-06-08
*Author: @JensLincke*


### Drag with Pointer Events #Example

```javascript
lively.removeEventListener("foo", that)
  

lively.addEventListener("foo", that, "pointerdown", evt => {
  var offset = lively.getPosition(evt)
  var originalPosition = lively.getPosition(that)
  
  
  lively.notify("down")
  lively.addEventListener("dragfoo", document.body.parentElement, "pointermove", evt => {
    lively.setPosition(that, originalPosition.addPt(lively.getPosition(evt).subPt(offset)))
    
    
    lively.showEvent(evt)
  })
                          
                          
  lively.addEventListener("dragfoo", document.body.parentElement, "pointerup", evt => {
  
    lively.notify("up")
    lively.removeEventListener("dragfoo", document.body.parentElement)
  
  })
})
```


### #PDF #Annotations

- The problems of multiline annotations in pdf.js has a name and issue [Support quad points for annotations #6811](https://github.com/mozilla/pdf.js/issues/6811)
- and it it is document in the following pdf [pdf reference](https://www.adobe.com/content/dam/acom/en/devnet/acrobat/pdfs/pdf_reference_1-7.pdf#page=634&zoom=auto,-246,530)