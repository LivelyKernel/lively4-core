import React, {Component, PropTypes} from 'react';
import Toggle from 'react-toggle';

'use strict'

export default class Ploma extends Component {

	static propTypes = {
		onToggle: PropTypes.func,
		usePloma: PropTypes.bool
	};

	static defaultProps = {
		onToggle: () => {},
		usePloma: true
	};

	onClick() {
		this.props.onToggle(!this.props.usePloma);
	}

	render() {
		return (
			<div>
				<input
					ref='toggle'
					type='checkbox'
					id="toggle-ploma"
					checked={this.props.usePloma}
					onClick={this.onClick.bind(this)}
					onChange={()=>{}}
				/>
				<span>Use Ploma</span>
			</div>
		)
	}

}