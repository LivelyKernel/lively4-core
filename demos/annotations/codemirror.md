# Related Work: CodeMirror markText


BEGIN COPIED FROM: <https://codemirror.net/doc/manual.html>

### doc.markText(from: {line, ch}, to: {line, ch}, ?options: object) → TextMarker
- Can be used to mark a range of text with a specific CSS class name. from and to should be {line, ch} objects. The options parameter is optional. When given, it should be an object that may contain the following configuration options:
- className: string
  - Assigns a CSS class to the marked stretch of text.
- **inclusiveLeft**: boolean
  - Determines whether text inserted on the left of the marker will end up inside or outside of it.
- **inclusiveRight**: boolean
  - Like inclusiveLeft, but for the right side.
- selectLeft: boolean
  - For atomic ranges, determines whether the cursor is allowed to be placed directly to the left of the range. Has no effect on non-atomic ranges.
- selectRight: boolean
  - Like selectLeft, but for the right side.
- atomic: boolean
  - Atomic ranges act as a single unit when cursor movement is concerned—i.e. it is impossible to place the cursor inside of them. You can control whether the cursor is allowed to be placed directly before or after them using selectLeft or selectRight. If selectLeft (or right) is not provided, then inclusiveLeft (or right) will control this behavior.
- collapsed: boolean
  - Collapsed ranges do not show up in the display. Setting a range to be collapsed will automatically make it atomic.
- clearOnEnter: boolean
  - When enabled, will cause the mark to clear itself whenever the cursor enters its range. This is mostly useful for text-replacement widgets that need to 'snap open' when the user tries to edit them. The "clear" event fired on the range handle can be used to be notified when this happens.
- clearWhenEmpty: boolean
  - Determines whether the mark is automatically cleared when it becomes empty. Default is true.
- replacedWith: Element
  - Use a given node to display this range. Implies both collapsed and atomic. The given DOM node must be an inline element (as opposed to a block element).
- handleMouseEvents: boolean
  - When replacedWith is given, this determines whether the editor will capture mouse and drag events occurring in this widget. Default is false—the events will be left alone for the default browser handler, or specific handlers on the widget, to capture.
- readOnly: boolean
  - A read-only span can, as long as it is not cleared, not be modified except by calling setValue to reset the whole document. Note: adding a read-only span currently clears the undo history of the editor, because existing undo events being partially nullified by read-only spans would corrupt the history (in the current implementation).
- addToHistory: boolean
  - When set to true (default is false), adding this marker will create an event in the undo history that can be individually undone (clearing the marker).
- startStyle: string
  - Can be used to specify an extra CSS class to be applied to the leftmost span that is part of the marker.
- endStyle: string
  - Equivalent to startStyle, but for the rightmost span.
- css: string
  - A string of CSS to be applied to the covered text. For example "color: #fe3".
- attributes: object
  - When given, add the attributes in the given object to the elements created for the marked text. Adding class or style attributes this way is not supported.
- shared: boolean
  - When the target document is linked to other documents, you can set shared to true to make the marker appear in all documents. By default, a marker appears only in its target document.

END COPIED FROM
