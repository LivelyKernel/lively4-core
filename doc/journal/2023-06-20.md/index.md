## 2023-06-20 Thoughts about Keyboard Shortcuts
*Author: @JensLincke*

## Explicit

How to make this customizable and platform-specific?

<edit://src/client/keys.js>

```javascript
 // #KeyboardShortcut Ctrl-Shift-F search throughout the whole repository
        ["Search", ctrl && shiftKey && char == "F", evt => {
          lively.openSearchWidget(this.getTextSelection(), null, evt.composedPath()[0]);
        }],
```

Propose: `keyInfo.matchEvent(evt, "Ctrl-Shift-F")` -> true or false

## Keymap

In [codemirror](edit://src/components/widgets/lively-code-mirror.js), we have keymaps:

```javascript
        "Shift-Alt-S": cm => this.astCapabilities.slurp(false),
```

Propose: `keyInfo.mapKeys("Shift-Alt-S")` -> `"Shift-Alt-B"`

### Exclusion Patterns

But we have also **exclusion patterns** in the [wild](edit://src/components/widgets/lively-code-mirror-modes.js):

```javascript
evt.key === ' ' && !evt.altKey && evt.shiftKey
```

Propose: `keyInfo.matchEvent("!Alt-Shift-Space")` -> true or false



### Multi-Stroke

Code-mirror supports multi strokes shortcuts, but we do not use them at the moment. For supporting Emacs like interaction, 
this is necessary. 

There is a "poor mens" version of multi stroke used in <edit://src/components/widgets/lively-code-mirror-modes.js#handleKeyEvent>


### Every-Key-Can-Be-Modifier

<edit://src/client/graffle.js>


## Luka's Problem

- Multikey would be nice
- Ctrl-Shift-F is hard to press on MacOS... how to change this for Lukas and for everybody on #MacOS







