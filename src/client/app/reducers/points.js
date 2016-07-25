import * as actionTypes from 'constants/actionTypes';

const points = (state = [], action) => {
	switch(action.type) {
		case actionTypes.APPEND_POINT:
			return state.concat([action.point])
		default:
			return state;
	}
}

export default points;