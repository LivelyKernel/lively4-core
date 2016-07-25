import points from 'reducers/points';
import * as actionTypes from 'constants/actionTypes';
import { without, last, concat, filter } from 'lodash';
import { appendPoint } from '../actions/drawing'

let appendPointTo = (state, action) => {
	if (state.length > 1) {
		let head = without(state, last(state));
		let tail = {
			points: points(last(state).points, appendPoint(action.point))
		}
		return head.concat([tail])
	} else if (state.length > 0) {
		return [{
			points: points(last(state).points, appendPoint(action.point))
		}]
	} else {
		return [{
			points: points([], appendPoint(action.point))
		}];
	}
}

const strokes = (state = [], action) => {
	switch(action.type) {
		case actionTypes.APPEND_POINT:
			return appendPointTo(state, action)
		case actionTypes.CREATE_STROKE:
			return appendPointTo(state, action)
		case actionTypes.FINISH_STROKE:
			state = appendPointTo(state, action);
			last(state).finished = true;
			return state
		default:
			return state;
	}
}

export default strokes;