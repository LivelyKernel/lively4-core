'use strict';

class Identity {
    match(response) {
        return true;
    }

    transform(response) {
        console.log('Identity Transformer');
        return response;
    }
}
