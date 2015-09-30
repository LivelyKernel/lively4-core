

var nativeLog = console.log

console.log = function(s) {
    nativeLog.apply(console, arguments)    
    l4.broadCastMessage({name: 'log', data: s})
}