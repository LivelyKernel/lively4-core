import { combineCanvasses } from './helpers';

describe('Dummy Integrationtest', () => {
	it('combining two canvasses looks the same as writing their content on the same canvas', () => {
		let bothDrawnOnOneCanvas = document.createElement('canvas');
		bothDrawnOnOneCanvas.setAttribute('width', 100);
		bothDrawnOnOneCanvas.setAttribute('height', 100);
		bothDrawnOnOneCanvas.style.setProperty('top', 0);
		bothDrawnOnOneCanvas.style.setProperty('left', 0);
		let firstCanvas = bothDrawnOnOneCanvas.cloneNode();
		let secondCanvas = bothDrawnOnOneCanvas.cloneNode();
		//draw first stroke
		bothDrawnOnOneCanvas.getContext('2d').fillStyle = "rgba(1, 1, 1, 0)";
	    bothDrawnOnOneCanvas.getContext('2d').beginPath();
		bothDrawnOnOneCanvas.getContext('2d').moveTo(10, 10);
	    bothDrawnOnOneCanvas.getContext('2d').lineTo(13, 13);
		bothDrawnOnOneCanvas.getContext('2d').stroke();
		bothDrawnOnOneCanvas.getContext('2d').closePath();
		firstCanvas.getContext('2d').fillStyle = "rgba(1, 1, 1, 0)";
	    firstCanvas.getContext('2d').beginPath();
		firstCanvas.getContext('2d').moveTo(10, 10);
	    firstCanvas.getContext('2d').lineTo(13, 13);
		firstCanvas.getContext('2d').stroke();
		firstCanvas.getContext('2d').closePath();
		//draw second stroke
	    bothDrawnOnOneCanvas.getContext('2d').beginPath();
		bothDrawnOnOneCanvas.getContext('2d').moveTo(20, 20);
	    bothDrawnOnOneCanvas.getContext('2d').lineTo(23, 23);
		bothDrawnOnOneCanvas.getContext('2d').stroke();
		bothDrawnOnOneCanvas.getContext('2d').closePath();
		secondCanvas.getContext('2d').fillStyle = "rgba(1, 1, 1, 0)";
	    secondCanvas.getContext('2d').beginPath();
		secondCanvas.getContext('2d').moveTo(20, 20);
	    secondCanvas.getContext('2d').lineTo(23, 23);
		secondCanvas.getContext('2d').stroke();
		secondCanvas.getContext('2d').closePath();
		// get data
		let combinedCanvas = combineCanvasses([firstCanvas, secondCanvas], 100, 100);
		expect(combinedCanvas.toDataURL()).to.equal(bothDrawnOnOneCanvas.toDataURL());
	})
})