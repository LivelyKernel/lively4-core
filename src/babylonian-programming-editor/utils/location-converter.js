/**
 * Converts different location types
 */
export default class LocationConverter {

  static /*slider:*//*example:*/astToKey/*{}*//*{"id":"7029_704f_e0b8","name":{"mode":"input","value":"Normal"},"color":"hsl(220, 30%, 70%)","values":{"loc":{"mode":"input","value":"{start:{line:4,column:5},end:{line:6,column:7}}"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(loc) {
    /*probe:*/return/*{}*/ [
      loc.start.line, loc.start.column,
      loc.end.line, loc.end.column
    ];
  }

  static selectionToKey(loc) {
    if(loc.anchor.line < loc.head.line ||
      (loc.anchor.line === loc.head.line && loc.anchor.ch < loc.head.ch)) {
      return [
        loc.anchor.line+1, loc.anchor.ch,
        loc.head.line+1, loc.head.ch
      ];
    } else {
      return [
        loc.head.line+1, loc.head.ch,
        loc.anchor.line+1, loc.anchor.ch
      ];
    }

  }

  static markerToKey(loc) {
    return [
      loc.from.line+1, loc.from.ch,
      loc.to.line+1, loc.to.ch
    ];
  }

  static astToMarker(loc) {
    return {
      from: {
        line: loc.start.line-1,
        ch: loc.start.column
      },
      to: {
        line: loc.end.line-1,
        ch: loc.end.column
      }
    };
  }
  
  static keyToMarker(loc) {
    return {
      from: {
        line: loc[0]-1,
        ch: loc[1]
      },
      to: {
        line: loc[2]-1,
        ch: loc[3]
      }
    };
  }
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */