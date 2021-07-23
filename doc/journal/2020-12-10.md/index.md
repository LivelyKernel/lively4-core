## 2020-12-10 Playing with #ActiveExpressions and Events
*Author: @JensLincke*


Example from working on <edit://src/components/tools/lively-index-search.js>

```javascript
 var onScopeOrSearchInputEnter = (evt) => { 
      if(evt.code == "Enter") { 
        this.onSearchButton(); 
      }
    }
    this.get("#searchInput").addEventListener("keyup", onScopeOrSearchInputEnter);
    this.get("#scopeInput").addEventListener("keyup", onScopeOrSearchInputEnter);
```

```javascript
 this.events = {}
    this.get("#searchInput").addEventListener("keyup", evt => {
      this.events.searchInputKeyUp = evt; 
      this.events.searchInputKeyUp = null
    });
    this.get("#scopeInput").addEventListener("keyup", evt => {
      this.events.scopeInputKeyUp = evt;
      this.events.scopeInputKeyUp = null      
    });
    aexpr(() => this.events.scopeInputKeyUp || this.events.searchInputKeyUp).onChange(evt => {
      if(evt && evt.code == "Enter") { 
        this.events.scopeInputEnter = evt 
        this.events.scopeInputEnter = null
      }
    });
    aexpr(() => this.events.scopeInputKeyUp || this.events.searchInputKeyUp).onChange(evt => {
      if(evt && evt.code == "Enter") { 
        this.events.inputEnter = evt 
        this.events.inputEnter = null
      }
    });
    aexpr(() => this.events.inputEnter).onChange(evt => {
      this.onSearchButton();
    });
```

But *honestly* after refactoring the code looked like

```javascript
    this.registerSignalEnter(this.shadowRoot)
    
    this.get("#searchInput").addEventListener("enter-pressed", () => this.onSearchButton());
    this.get("#scopeInput").addEventListener("enter-pressed", () => this.onSearchButton());
```

with and helper method

```javascript
 registerSignalEnter(rootElement = this) {
    debugger
    var domain = "singnal-enter"
    lively.removeEventListener(domain, rootElement) // just in case...
    lively.addEventListener(domain, rootElement, "keyup", evt => {
      if(evt.code == "Enter") { 
        evt.target.dispatchEvent(new CustomEvent("enter-pressed", { detail: evt })) 
      }  
    })
  }
```



