
//-----------------------------------------------------------------------
//--------------------- BEGIN OF MESSAGING ------------------------------
//-----------------------------------------------------------------------

l4.broadCastMessage = function(data) {
    self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
            client.postMessage({
                msg: 'log',
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

self.addEventListener('message', function(event) {
    if(hasPort(event)) {
        return;
    }
    console.log('# # # # ## # # # # # # # # # # # # # # #');
    console.log('GOT A MESSAGE1');
    console.log('# # # # ## # # # # # # # # # # # # # # #');
    console.log(event.data, event.source);
    debugger;
});

self.addEventListener('message', function(event) {
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
        type: 'msg send back',
        meta: 'Sending Back a Message',
        sendedMessage: event.data
    });
});

//-----------------------------------------------------------------------
//----------------------- END OF MESSAGING ------------------------------
//-----------------------------------------------------------------------
