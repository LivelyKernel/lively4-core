import { createStore } from 'redux';
import hyperlively from 'reducers/index';

let initialState = {
	ploma: {
		uniqueCanvasFactor: Math.random()
	}
}

export default function configureStore(initialState) {
	const store = createStore(hyperlively, initialState, 
		window.devToolsExtension && window.devToolsExtension());
	return store;
}