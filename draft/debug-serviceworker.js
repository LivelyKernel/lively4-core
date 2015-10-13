    // receive messages
    navigator.serviceWorker.onmessage = function(event) {
        if (event.data.message.name == 'log') {
            log(event.data.message.data)
        } 
    }