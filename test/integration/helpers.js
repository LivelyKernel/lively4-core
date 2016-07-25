let copyImageDataFromCanvasToCanvas = (fromCanvas, toCanvas) => {
	var img = new Image();
	img.src = fromCanvas.toDataURL('image/png')
	toCanvas.getContext('2d').drawImage(img, parseInt(fromCanvas.style.getPropertyValue('left')), parseInt(fromCanvas.style.getPropertyValue('top')));
}

export function combineCanvasses (canvasses, width, height) {
	let combinedCanvas = document.createElement('canvas');
	combinedCanvas.setAttribute('width', width);
	combinedCanvas.setAttribute('height', height);
	combinedCanvas.getContext('2d').fillStyle = "rgba(1, 1, 1, 0)";
	let copiedCombinedCanvas = combinedCanvas.cloneNode();
	_.forEach(canvasses, (canvasNode) => {
		copyImageDataFromCanvasToCanvas(canvasNode, combinedCanvas);
	})
	return combinedCanvas;
}