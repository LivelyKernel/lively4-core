System.transpiler = 'babel';

// load app.js
System.import('test-app/app.js').then(function(module) {
    console.log('app.js loaded', module);
}).catch(function (e) {
    console.error(e);
});

System.import('https://code.jquery.com/jquery-2.1.4.js').then(function(module) {
    console.log('$', module);

    $.ajax({
        url: "https://eval/3+4",
        type: "get",
        success: function(d) { console.log(d)}
    })
}).catch(function (e) {
    console.error('$', e);
});
