import * as actionTypes from 'constants/actionTypes';

export function togglePloma(bool) {
	return { type: actionTypes.TOGGLE_PLOMA, bool }
}