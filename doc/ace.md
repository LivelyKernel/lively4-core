# Playing around with Ace editor


```
var Range = ace.require('ace/range').Range;

var editor = that.get("#editor").currentEditor()
var doc =editor.getSession().getDocument(); 

var src = editor.getValue()

// clear annotations
editor.getSession().setAnnotations([])

// clear markers
var markers = editor.getSession().getMarkers()
for(var i in markers) {
	console.log("i" + i)
	if (markers[i].clazz == "marked") {
		editor.getSession().removeMarker(i)
	}
}

var parseError
try {
	var ast = lively.ast.parse(src)
} catch(e) {
	parseError = e
	
	editor.session.addMarker(Range.fromPoints(
		doc.indexToPosition(e.pos),
		doc.indexToPosition(e.raisedAt)), "marked", "text", false); 
		
	editor.getSession().setAnnotations([{
	  row: e.loc.line - 1,
	  column: e.loc.column,
	  text: e.message,
	  type: "error" // also warning and information
	}]);
}
```


```
var methods = []
lively.ast.acorn.walk.simple(ast, {MethodDefinition: (node) => {
	methods.push(node)
	editor.session.addMarker(Range.fromPoints(
		doc.indexToPosition(node.start),
		doc.indexToPosition(node.end)), "marked", "text", false); 
}})

methods.map( ea => ea.key.name ) 
```