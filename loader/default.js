'use strict';

class DefaultLoader {
    match(request) {
        return true;
    }

    transform(request) {
        return fetch(request);
    }
}
