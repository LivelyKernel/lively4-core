import React, {Component, PropTypes} from 'react';
import Canvas from 'components/Canvas';
import { OFFSET } from 'constants/canvas';
import { map, last } from 'lodash';

let transform = (x, y, width, height, offsetX, offsetY) => {
	return {
		x: x,
		y: y,
		width: width,
		height: height
	}
}

export default class Desk extends Component {

	static propTypes = {
		scene: PropTypes.object
	};

	static defaultProps = {
		scene: {
			sketches: []
		}
	}

	constructor(props) {
		super(props);
	}

	getContentTransform(strokes) {
		let left = Infinity;
		let top = Infinity;
		let right = -Infinity;
		let bottom = -Infinity;
		strokes.forEach((stroke) => {
			stroke.points.forEach((point) => {
				left = Math.min(left, point.x)
				top = Math.min(top, point.y)
				right = Math.max(right, point.x)
				bottom = Math.max(bottom, point.y)
			})
		})
		let x = left === Infinity ? 0 : left;
		let y = top === Infinity ? 0 : top;
		let width = right === -Infinity ? 0 : right - x;
		let height = bottom === -Infinity ? 0 : bottom - y;
		return transform(x - OFFSET, y - OFFSET, width + (2*OFFSET), height + (2*OFFSET));
	}

	getCanvasTransform(strokes, finished) {
		return finished ?
			this.getContentTransform(strokes) :
			transform(0, 0, window.innerWidth, window.innerHeight);
	}

	renderCanvas(strokes, id, finished) {
		let transform = this.getCanvasTransform(strokes, finished);
		return <Canvas {...this.props} ref={'canvas-'+id}
			bounds = {transform}
			key = {id}
			strokes = {strokes}
		></Canvas>
	}

	renderSketchedCanvasses() {
		let that = this;
		let sketches = this.props.scene.sketches || [];
		return map(sketches, (sketch, id) => {
			return that.renderCanvas(sketch.strokes || [], id, true);
		})
	}

	getSketch() {
		return last(this.props.scene.sketches)
	}

	renderPlaceholderCanvas() {
		let sketch = this.getSketch();
		return (!sketch || sketch.finished) &&
			this.renderCanvas([], this.props.scene.sketches.length, false);
	}

	render() {
		return (<div>
			{this.renderSketchedCanvasses().concat(this.renderPlaceholderCanvas())}
		</div>)
	}

}