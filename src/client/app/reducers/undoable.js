import * as actionTypes from 'constants/actionTypes';
import { concat } from 'lodash';

const undoable = (reducer) => {

	const initialState = {
		past: [],
		present: reducer(undefined, {}),
		future: []
	}

	return (state = initialState, action) => {
		const { past, present, future } = state

		switch (action.type) {
			case actionTypes.JUMP_TO_PAST: {
				if (action.pointInPast >= past.length || past.length === 0) {
					return state;
				} else if (action.pointInPast < 0) {
					return {
						past: [],
						present: past[0],
						future: [...past.slice(1), present, ...future]
					}
				} else {
					var newPast = past.slice(0,action.pointInPast);
					var restPast = past.slice(action.pointInPast+1, past.length);
					var newCurrent = past[action.pointInPast];
					var newFuture = [...restPast, present, ...future];
					return {
					  past: newPast,
					  present: newCurrent,
					  future: newFuture 
					}
				}
			}
			case actionTypes.JUMP_TO_FUTURE:
				if (action.pointInFuture <= 0 || future.length === 0) {
					return state;
				} else if (action.pointInFuture >= future.length) {
					return {
						past: [...past, present, ...future.slice(0, future.length-1)],
						present: future[future.length-1],
						future: []
					}
				} else {
					var newFuture = future.slice(action.pointInFuture,future.length);
					var restFuture = future.slice(0, action.pointInFuture-1);
					var newCurrent = future[action.pointInFuture-1];
					var newPast = [...past, present, ...restFuture];
					return {
					  past: newPast,
					  present: newCurrent,
					  future: newFuture
					}
				}
			default:
				// Delegate handling the action to the passed reducer
				const newPresent = reducer(present, action)
				if (present === newPresent) {
				  return state
				}
				return {
				  past: [ ...past, present ],
				  present: newPresent,
				  future: []
				}
		}
	}
}

export default undoable