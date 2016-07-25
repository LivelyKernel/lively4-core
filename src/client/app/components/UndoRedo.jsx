import React, {Component, PropTypes} from 'react';
import { Slider } from 'reactrangeslider';

'use strict'

export default class UndoRedo extends Component {

	static propTypes = {
		jumpToPast: PropTypes.func,
		jumpToFuture: PropTypes.func,
		max: PropTypes.number,
		value: PropTypes.number,
		width: PropTypes.number
	};

	static defaultProps = {
		jumpToPast: () => {},
		jumpToFuture: () => {},
		max: 0,
		value: 0,
		width: 100
	};

	onSliderMove(newValue) {
		let oldValue = this.props.value;
		let direction
		if (newValue < oldValue) {
			return this.props.jumpToPast(newValue);
		} else if (newValue > oldValue) {
			return this.props.jumpToFuture(newValue - oldValue);
		}
	}

	render() {
		let canUndo = this.props.value > 0;
		let canRedo = this.props.value < this.props.max;
		return (<div
				style={{
					width: window.innerWidth - 40
				}}
			>
			<Slider ref="slider"
				onChange={this.onSliderMove.bind(this)}
				disabled={!canUndo && !canRedo}
				min={0}
				max={this.props.max}
				value={this.props.value}
			></Slider>
		</div>)
	}

}