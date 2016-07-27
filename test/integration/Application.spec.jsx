import React from 'react';
import { render, findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import Application from 'base/Application';
import { createStore } from 'redux';
import hyperlively from 'reducers/index';
import TestUtils from 'react-addons-test-utils';
import { hashCode, point } from '../helpers';
import { combineCanvasses } from './helpers';

'use strict'

let getCanvasNodes = () => {
	return document.getElementsByTagName('canvas');
}

let getWindowNode = () => {
	return document.getElementsByClassName('window')[0];
}

let getCombinedCanvas = () => {
	return combineCanvasses(getCanvasNodes(), 1000, 500)	
}

let simulateDrawingEventOnCanvasAt = (eventType, canvas, x, y) => {
	TestUtils.Simulate[eventType](canvas, {
		pageX: x,
		pageY: y
	});
}

let renderApplication = (initialState) => {
	let strokesCount = (initialState.scenes.present.length > 0) ?
				initialState.scenes.present[0].sketches.length : 0;
	let store = createStore(hyperlively, initialState);
	let renderedApp = render(
	  <Provider store={store}>
	    <Application/>	
	  </Provider>,
	  document.getElementById('app')
	)
	expect(document.getElementsByTagName('canvas')).to.have.length(strokesCount + 1);
	return renderedApp;
}

let manuallyDrawStrokes = (windowNode, strokes) => {
	_.forEach(strokes, (stroke) => {
		let first = _.first(stroke.points);
		let last = _.last(stroke.points);
		simulateDrawingEventOnCanvasAt('mouseDown', windowNode, first.x, first.y);
		_.forEach(_.tail(stroke.points), (point) => {
			simulateDrawingEventOnCanvasAt('mouseMove', windowNode, point.x, point.y);
		})
		simulateDrawingEventOnCanvasAt('mouseUp', windowNode, last.x, last.y);
	})
}

describe('Integration', () => {
	beforeEach(() => {
		let appNode = document.createElement('div');
		appNode.setAttribute('id', 'app');
		document.body.appendChild(appNode);
	})

	afterEach(() => {
		document.body.removeChild(document.getElementById('app'));
	})

	describe('rendering the application', () => {
		it('renders the empty application', () => {
			let emptyCanvas = require("json!./data/emptyCanvas.json");
			let renderedApp = renderApplication(emptyCanvas.json);
			expect(getWindowNode()).to.exist;
			expect(getCanvasNodes()).to.have.length(1);
		})

		it('renders the empty application with ploma', () => {
			let emptyCanvas = require("json!./data/emptyCanvas.json");
			let emptyCanvasJson = _.cloneDeep(emptyCanvas.json);
			emptyCanvasJson.ploma.usePloma = true;
			let renderedApp = renderApplication(emptyCanvasJson);
			expect(getWindowNode()).to.exist;
			expect(getCanvasNodes()).to.have.length(1);
		})
	})

	describe('drawing', () => {
		xit('two strokes creates correct image data when ploma is disabled', () => {
			let emptyCanvas = require("json!./data/emptyCanvas.json");
			let canvasWithTwoStrokes = require("json!./data/canvasWithTwoStrokes.json");
			let renderedApp = renderApplication(emptyCanvas.json);
			manuallyDrawStrokes(getWindowNode(), [{
				points: [ point(10,10), point(10,30) ]
			}, {
				points: [ point(20,10), point(20,30) ]
			}]);
			expect(hashCode(getCombinedCanvas().toDataURL())).to.equal(hashCode(canvasWithTwoStrokes.imageData));
		})

		xit('two strokes looks the same as adding two strokes point by point when ploma is enabled', () => {
			let canvasWithIrregularStrokesWithPloma = require("json!./data/canvasWithIrregularStrokesWithPloma.json");
			let emptyCanvas = _.cloneDeep(require("json!./data/emptyCanvas.json"));
			emptyCanvas.json.ploma.uniqueCanvasFactor = canvasWithIrregularStrokesWithPloma.json.ploma.uniqueCanvasFactor;
			emptyCanvas.json.ploma.usePloma = true;
			renderApplication(emptyCanvas.json);
			let strokes = _.map(canvasWithIrregularStrokesWithPloma.json.scenes.present[0].sketches, (sketch) => {
				return _.last(sketch.strokes) || [];
			});
			manuallyDrawStrokes(getWindowNode(), strokes);
			expect(hashCode(getCombinedCanvas().toDataURL())).to.equal(hashCode(canvasWithIrregularStrokesWithPloma.imageData))
		})
	})

	describe('pressing toggle ploma', () => {

		it('switches to Ploma when it was deactivated', () => {
			let canvasWithIrregularStrokesWithPloma = require("json!./data/canvasWithIrregularStrokesWithPloma.json");
			let renderedApp = renderApplication(canvasWithIrregularStrokesWithPloma.json);
			let nonPlomaImageData = getCombinedCanvas().toDataURL();
			let plomaButton = document.getElementById('toggle-ploma');
			TestUtils.Simulate.click(plomaButton);
			expect(hashCode(getCombinedCanvas().toDataURL())).to.not.equal(hashCode(nonPlomaImageData));
		})

	})

	describe('undoing', () => {

		it('keeps the canvas at content size', () => {
			let emptyCanvas = _.cloneDeep(require("json!./data/emptyCanvas.json"));
			let renderedApp = renderApplication(emptyCanvas.json);
			manuallyDrawStrokes(getWindowNode(), [{
				points: [ point(10,10), point(10,30), point(10,60) ]
			}, {
				points: [ point(20,10), point(20,30), point(20,60) ]
			}]);
			let domApp = findDOMNode(renderedApp);
			let sliderWithHandle = domApp.childNodes[2].childNodes[0].childNodes[0];
			let slider = sliderWithHandle.childNodes[0];
			// expect(getCanvasNodes()[1].width).to.equal(10);
			TestUtils.Simulate.click(slider, {
				pageX: ( 5 * slider.offsetWidth) / 6
			})
			expect(getCanvasNodes()[1].width).to.equal(10);
		})

	})



})
