
//-----------------------------------------------------------------------
//--------------------- BEGIN OF MESSAGING ------------------------------
//-----------------------------------------------------------------------

l4.broadCastMessage = function(data) {
    self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
            client.postMessage({
                meta: {
                    type: 'broadcast'
                },
                data: data
            });
        });
    });
};

l4.broadCastMessage('HELLO CLIENT');
l4.broadCastMessage('U HEAR ME?');

function hasPort(e) {
    return e.ports;
}

function justReceive(event) {
    if(hasPort(event)) {
        return;
    }
    console.log('# # # # ## # # # # # # # # # # # # # # #');
    console.log('GOT A MESSAGE1');
    console.log('# # # # ## # # # # # # # # # # # # # # #');
    console.log(event.data, event.source);
    debugger;
}

function answerCall(event) {
    if(!hasPort(event)) {
        return;
    }
    //broadCastMessage('# # # # ## # # # # # # # # # # # # # # #');
    //broadCastMessage('GOT A MESSAGE3');
    //broadCastMessage(event.data);
    //broadCastMessage(event.ports[0]);
    console.log('# # # # ## # # # # # # # # # # # # # # #');
    console.log('GOT A MESSAGE2');
    console.log('# # # # ## # # # # # # # # # # # # # # #');
    //console.log(event.data, event.source);

    event.ports[0].postMessage({
        meta: {
            type: 'msg send back'
        },
        data: {
            msg: 'Sending Back a Message',
            sendedMessage: event.data
        }
    });
}

self.addEventListener('message', function(event) {
    justReceive(event);
    answerCall(event);
});

//-----------------------------------------------------------------------
//----------------------- END OF MESSAGING ------------------------------
//-----------------------------------------------------------------------
/*
console.log("SW startup");

this.onmessage = function(event) {
    console.log("Got message in SW", event.data.text);

    if (event.source) {
        console.log("event.source present");
        event.source.postMessage("Woop!");
    }
    else {
        console.log("No event.source");
        if (event.data.port) {
            event.data.port.postMessage("Woop!");
        }
    }

    if (self.clients) {
        console.log("Attempting postMessage via clients API");
        clients.matchAll().then(function(clients) {
            for (var client of clients) {
                client.postMessage("Whoop! (via client api)");
            }
        });
    }
    else {
        console.log("No clients API");
    }
};
*/