// pretty names to use for codes, e.g. `fake("leftArrow")` 
var prettyCodeNames = {
    enter: 13,
    home: 36,
    leftArrow: 37, 
    upArrow: 38, 
    rightArrow: 39, 
    downArrow: 40
};
 
function createCodeMirrorFakeEvent(type, code, modifiers, charCode)
{
    var e = { 
        _handled: false,
        type: type,
        charCode: charCode,
        keyCode: code,
        preventDefault: function(){ this._handled = true; },
        stopPropagation: function(){},
    };  
    if (modifiers) {
        for (var i = 0; i < modifiers.length; ++i)
            e[modifiers[i]] = true;
    }
    return e;
}
 
function fakeCMKeyEvent(editor, eventType, code, modifiers, charCode)
{
    var e = createCodeMirrorFakeEvent(eventType, code, modifiers, charCode);
    switch(eventType) {
    case "keydown": editor.triggerOnKeyDown(e); break;
    case "keypress": editor.triggerOnKeyPress(e); break;
    case "keyup": editor.triggerOnKeyUp(e); break;
    default: throw new Error("Unknown event type");
    }
    return e._handled;
}
 
function fakeCMInput(editor, char)
{
    if (typeof char === "string") {
       // editor.display.input.value += char;
       editor.replaceSelection(char)
    }
}
 
export default function fake(editor, originalCode, modifiers)
{
    modifiers = modifiers || [];
    var code;
    var charCode;
    if (originalCode === "(") {
        code = "9".charCodeAt(0);
        modifiers.push("shiftKey");
        charCode = "(".charCodeAt(0);
    }
    code = code || prettyCodeNames[originalCode] || originalCode;
    if (typeof code === "string")
        code = code.charCodeAt(0);
    if (fakeCMKeyEvent(editor, "keydown", code, modifiers, charCode)) {
      // return 
    }
        
    if (fakeCMKeyEvent(editor, "keypress", code, modifiers, charCode)) {
        // return;
    }
    fakeCMInput(editor, originalCode);
    fakeCMKeyEvent(editor, "keyup", code, modifiers, charCode);
}
