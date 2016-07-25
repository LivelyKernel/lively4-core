import scenes from 'reducers/scenes'
import ploma from 'reducers/ploma'
import { combineReducers } from 'redux';

const hyperlively = combineReducers({
	ploma,
	scenes
})

export default hyperlively;