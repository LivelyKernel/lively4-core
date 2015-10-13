

// Log also messages from the service worker

$('#commandline').keyup(function(e){
    if(e.keyCode == 13)
    {
        var src = $('#commandline').val()
        try { var result = eval(src) } catch(e) { result = "Error:" +e}
        log("eval " + src + " -> " + result)
    }
})