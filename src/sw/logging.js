

// guard againsst wrapping twice and ending in endless recursion
if (!console.log.isWrapped) {
	var nativeLog = console.log

	console.log = function() {
	    nativeLog.apply(console, arguments)
	    var s = Array.prototype.map.call(arguments, function(ea) { return "" + ea }).join("\n")
	    l4.broadCastMessage({name: 'log', data: '' + s})
	}

	console.log.isWrapped = true
}