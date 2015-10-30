// receive messages
navigator.serviceWorker.addEventListener("message", function(event) {
    if (event.data.message && event.data.message.name == 'log') {
        console.log(event.data.message.data)
        return true
    } 
})

