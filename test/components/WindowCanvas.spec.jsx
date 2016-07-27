import WindowCanvas from 'components/WindowCanvas';
import TestUtils from 'react-addons-test-utils';
import React from 'react';

let renderCanvasWithStrokes = (strokes) => {
	return TestUtils.renderIntoDocument(<WindowCanvas
		usePloma={true}
		scene={{sketches: [{strokes: strokes }] }}
	></WindowCanvas>);
}

let simulateDrawingEventOnCanvasAt = (eventType, canvas, x, y) => {
	TestUtils.Simulate[eventType](canvas.refs.window, {
		pageX: x,
		pageY: y
	});
}

let startStrokeAt = (canvas, x, y) => {
	simulateDrawingEventOnCanvasAt('mouseDown', canvas, x, y);
}

let extendStrokeAt = (canvas, x, y) => {
	simulateDrawingEventOnCanvasAt('mouseMove', canvas, x, y);
}

let endStrokeAt = (canvas, x, y) => {
	simulateDrawingEventOnCanvasAt('mouseUp', canvas, x, y);
}

describe('WindowCanvas', () => {

	describe('drawing', () => {

		let windowCanvas;

		beforeEach(() => {
			windowCanvas = TestUtils.renderIntoDocument(<WindowCanvas></WindowCanvas>);
		})

		it('is inactive when initializing', () => {
			expect(windowCanvas.state.isDrawing).to.be.false;
		})

		it('starts on mouse down', () => {
			startStrokeAt(windowCanvas, 10, 10);
			expect(windowCanvas.state.isDrawing).to.be.true;
		})

		it('continues when moving pressed mouse', () => {
			startStrokeAt(windowCanvas, 10, 10);
			expect(windowCanvas.state.isDrawing).to.be.true;
			extendStrokeAt(windowCanvas, 10, 11);
			expect(windowCanvas.state.isDrawing).to.be.true;
		})

		it('stops when releasing mouse', () => {
			startStrokeAt(windowCanvas, 10, 10);
			expect(windowCanvas.state.isDrawing).to.be.true;
			extendStrokeAt(windowCanvas, 10, 11);
			expect(windowCanvas.state.isDrawing).to.be.true;
			endStrokeAt(windowCanvas, 10, 11);
			expect(windowCanvas.state.isDrawing).to.be.false;
		})

	})

	describe('resizes', () => {

		let restorableWidth;
		let restorableHeight;
		let windowCanvas;
		let oldRemoveEventListener;

		beforeEach(() => {
			restorableWidth = window.innerWidth;
			restorableHeight = window.innerHeight;
			windowCanvas = renderCanvasWithStrokes([]);
			oldRemoveEventListener = window.removeEventListener;
		})

		afterEach(() => {
			window.innerWidth = restorableWidth;
			window.innerHeight = restorableHeight;
			window.removeEventListener = oldRemoveEventListener;
		})

		it('to window size when created', () => {
			expect(windowCanvas.state.windowWidth).to.equal(window.innerWidth);
			expect(windowCanvas.state.windowHeight).to.equal(window.innerHeight);
		})

		it('with the window', () => {
			window.innerWidth = 100;
			window.innerHeight = 100;
			windowCanvas.handleResize();
			expect(windowCanvas.state.windowWidth).to.equal(100);
			expect(windowCanvas.state.windowHeight).to.equal(100);
		})

		it('not any more when removed', () => {
			let wasResizeHandlerRemoved = false;
			window.removeEventListener = (listener) => {
				wasResizeHandlerRemoved = listener === 'resize';
			}
			windowCanvas.componentWillUnmount();
			expect(wasResizeHandlerRemoved).to.be.true;
		})
	})

})