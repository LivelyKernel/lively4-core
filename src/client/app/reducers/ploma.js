import * as actionTypes from 'constants/actionTypes';

let initialState = () => {
	return {
		usePloma: true,
		uniqueCanvasFactor: Math.random()
	}
}

const ploma = (state = initialState(), action) => {
	switch(action.type) {
		case actionTypes.TOGGLE_PLOMA:
			return {
				usePloma: action.bool,
				uniqueCanvasFactor: state.uniqueCanvasFactor
			}
		default:
			return state;
	}
}

export default ploma;