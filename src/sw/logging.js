

// guard againsst wrapping twice and ending in endless recursion
if (!console.log.isWrapped) {
	var nativeLog = console.log

	console.log = function(s) {
	    nativeLog.apply(console, arguments)    
	    l4.broadCastMessage({name: 'log', data: '' + s})
	}

	console.log.isWrapped = true
}