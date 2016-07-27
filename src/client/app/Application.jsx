import React from 'react';
import Scene from 'containers/Scene';
import UndoRedo from 'containers/UndoRedo';
import Settings from 'containers/Settings';
import Window from 'containers/Window';

'use strict'

let getControlStyle = () => {
	return {
		position: 'absolute',
		top: 20,
		left: 20
	}
}
const Application = () => (
	<div>
		<Scene></Scene>
		<Window></Window>
		<div
			style={getControlStyle()}>
			<UndoRedo></UndoRedo>
			<Settings></Settings>
		</div>
	</div>
)

export default Application