import strokes from 'reducers/strokes';
import * as actionTypes from 'constants/actionTypes';
import { last, without } from 'lodash';

let extendedSketch = (sketch, action) => {
	return {
		strokes: strokes(sketch.strokes || [], action),
		position: sketch.position || action.point
	}
}

let reduceSketches = (state, action, finished) => {
	let sketchToReduce = last(state) || {};
	let head = without(state, sketchToReduce);
	let tail = extendedSketch(sketchToReduce, action);
	if (finished) {
		tail.finished = true;
	}
	return head.concat([tail])
}

const sketches = (state = [], action) => {
	switch(action.type) {
		case actionTypes.CREATE_STROKE:
			state.push({
				strokes: strokes([], action),
				position: action.point
			})
			return state;
		case actionTypes.APPEND_POINT:
			return reduceSketches(state, action);
		case actionTypes.FINISH_STROKE:
			return reduceSketches(state, action, true);
		default:
			return state;
	}
}

export default sketches;