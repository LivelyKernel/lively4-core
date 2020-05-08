// extend dat.GUI with a convenient method to remove folders
dat.gui.GUI.prototype.removeFolder = function(name) {
	if(typeof this.__folders[name] === "undefined") {
		console.log('Tried to remove folder ' + name + ', which not exists.');
		return;
	}
	this.__folders[name].close();
	this.__ul.removeChild(this.__folders[name].__ul.parentNode.parentNode);
	dat.dom.dom.removeClass(this.__folders[name].__ul.parentNode.parentNode, 'folder');
	this.__folders[name] = undefined;
	this.onResize();
};

dat.gui.GUI.prototype.attachFolder = function(folder, name) {
	if(typeof this.__folders[name] !== "undefined") {
		console.log('Tried to attach folder ' + name + ', which already exists.');
		return;
	}
	this.__folders[name] = folder;
	dat.dom.dom.addClass(this.__folders[name].__ul.parentNode.parentNode, 'folder');
	this.__ul.appendChild(this.__folders[name].__ul.parentNode.parentNode);
	this.__folders[name].open();
	this.onResize();
};

