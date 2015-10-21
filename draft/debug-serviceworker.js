// receive messages
navigator.serviceWorker.addEventListener("message", function(event) {
    if (event.data.message.name == 'log') {
        log(event.data.message.data)
        return true
    } 
})