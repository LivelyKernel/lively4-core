System.transpiler = 'babel';

console.log(2 ** 3);

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
    });

    var base = "https://api-content.dropbox.com/1/",
        method = "files/auto/", // get
        path = "Lively/foo.txt",
        dropboxAccessToken = "Or5ZKMnok7sAAAAAAANCpDZwejT76YsmrfvOVqQU5al1psc0RmA96NgMId1Dr9PE";

    $.ajax({
        url: base + method + path +"?access_token=" + dropboxAccessToken,
        type: "get",
        success: function(d) {
            console.log("DROPBOX");
            console.log(d);
        }
    });
}).catch(function (e) {
    console.error('$', e);
});
