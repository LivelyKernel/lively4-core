import * as actionTypes from 'constants/actionTypes';

export function jumpToFuture(pointInFuture) {
	return { type: actionTypes.JUMP_TO_FUTURE, pointInFuture }
}

export function jumpToPast(pointInPast) {
	return { type: actionTypes.JUMP_TO_PAST, pointInPast }
}