import Menu from './menu.js';
import DebugPanel from './panel.js';

var round = function(number, precision) {
	precision = Math.pow(10, precision || 0);
	return Math.round(number * precision) / precision;
};

var ig = ig || {};
ig.system = ig.system || {};
ig.system.fps = ig.system.fps || 60;
/**
 *  ---------------------------- GRAPH PANEL ----------------------------
 */
var DebugGraphPanel = DebugPanel.subclass({
	clocks: {},
	marks: [],
	textY: 0,
	height: 128,
	ms: 64,
	timeBeforeRun: 0,
	
	
	initialize: function( name, label ) {
		DebugPanel.prototype.initialize.apply(this, arguments);
		
		this.mark16ms = round((this.height - (this.height/this.ms) * 16));
		this.mark33ms = round((this.height - (this.height/this.ms) * 33));
		this.msHeight = this.height/this.ms;
		
		this.graph = $('<canvas />');
		this.graph.attr("width", window.innerWidth);
		this.graph.attr("height", this.height);
		this.container.append( this.graph );
		this.ctx = this.graph[0].getContext('2d');
		
		this.ctx.fillStyle = '#444';
		this.ctx.fillRect( 0, this.mark16ms, this.graph.attr("width"), 1 );
		this.ctx.fillRect( 0, this.mark33ms, this.graph.attr("width"), 1 );
		
		this.addClock( 'draw', 'Draw', '#13baff');//caca25' );
		this.addClock( 'update', 'Update', '#bb0fff');//25ca72' );
		this.addClock( 'lag', 'System Lag', '#f26900');//ca258f' );
		
		window.graph = this;
	},
	
	
	addClock: function( name, description, color ) {		
		var mark = $('<span />');
		mark.addClass('ig_debug_legend_color');
		mark.css("backgroundColor", color);
		
		var number = $('<span />');
		number.addClass('ig_debug_legend_number');
		number.append( document.createTextNode('0') );
		
		var legend = $('<span />');
		legend.addClass('ig_debug_legend');
		legend.append( mark );
		legend.append( document.createTextNode(description +' (') );
		legend.append( number );
		legend.append( document.createTextNode('ms)') );
		
		this.container.append( legend );
		
		this.clocks[name] = {
			description: description,
			color: color,
			current: 0,
			start: window.performance.now(),
			avg: 0,
			html: number
		};
	},
	
	
	beginClock: function( name, offset ) {
		this.clocks[name].start = window.performance.now() + (offset || 0);
	},
	
	
	endClock: function( name ) {
		var c = this.clocks[name];
		c.current = Math.round(window.performance.now() - c.start);
		c.avg = c.avg * 0.8 + c.current * 0.2;
	},
	
	
	mark: function( msg, color ) {
		if( this.active ) {
			this.marks.push( {msg:msg, color:(color||'#fff')} );
		}
	},
	
	
	beforeRun: function() {
		this.endClock('lag');
		this.timeBeforeRun = window.performance.now();
	},
	
	
	afterRun: function() {
		var frameTime = window.performance.now() - this.timeBeforeRun;
		var nextFrameDue = (1000/ig.system.fps) - frameTime;
		this.beginClock('lag', Math.max(nextFrameDue, 0));
		
		var x = this.graph.attr("width") -1;
		var y = this.height;
		
		this.ctx.drawImage( this.graph.get(0), -1, 0 );
		
		this.ctx.fillStyle = '#000';
		this.ctx.fillRect( x, 0, 1, this.height );
		
		this.ctx.fillStyle = '#444';
		this.ctx.fillRect( x, this.mark16ms, 1, 1 );
		
		this.ctx.fillStyle = '#444';
		this.ctx.fillRect( x, this.mark33ms, 1, 1 );
		
		for( var ci in this.clocks ) {
			if(!this.clocks.hasOwnProperty(ci)) continue;

			var c = this.clocks[ci];
			c.html.text(c.avg.toFixed(2));
			
			if( c.color && c.current > 0 ) {
				this.ctx.fillStyle = c.color;
				var h = c.current * this.msHeight;
				y -= h;
				this.ctx.fillRect(	x, y, 1, h );
				c.current = 0;
			}
		}
		
		this.ctx.textAlign = 'right';
		this.ctx.textBaseline = 'top';
		this.ctx.globalAlpha = 0.5;
		
		for( var i = 0; i < this.marks.length; i++ ) {
			var m = this.marks[i];
			this.ctx.fillStyle = m.color;
			this.ctx.fillRect(	x, 0, 1, this.height );
			if( m.msg ) {
				this.ctx.fillText( m.msg, x-1, this.textY );
				this.textY = (this.textY+8)%32;
			}
		}
		this.ctx.globalAlpha = 1;
		this.marks = [];
	}
});
/*
$().ready(function() {
});
*/
export default DebugGraphPanel;
