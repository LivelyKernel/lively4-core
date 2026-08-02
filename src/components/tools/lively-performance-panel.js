import Morph from 'src/components/widgets/lively-morph.js';
import { PausableLoop } from 'utils'
import $ from "https://cdn.jsdelivr.net/npm/jquery@3.7.1/+esm";

// This component was ported from the standalone `ivu/` sources (debug.js, menu.js,
// option.js, panel.js, performance.js). Those helper modules are inlined below as
// module-local classes so the whole panel ships as a single file. The debug UI is a
// lightly adapted version of the Impact.js debug panels (hence the `ig_debug_*` CSS).

// ---- option.js: a single toggleable boolean option in a panel ---------------
class DebugOption {

	constructor( name, object, property ) {
		Object.assign(this, {
			name: '',
			labelName: '',
			className: 'ig_debug_option',
			label: null,
			mark: null,
			container: null,
			active: false,

			colors: {
				enabled: '#fff',
				disabled: '#444'
			},
		})
		this.name = name;
		this.object = object;
		this.property = property;

		this.active = this.object[this.property];

		this.container = $('<div />');
		this.container.addClass('ig_debug_option');

		this.label = $('<span />');
		this.label.addClass('ig_debug_label');
		this.label.text(this.name);

		this.mark = $('<span />');
		this.mark.addClass('ig_debug_label_mark');

		this.container.append( this.mark );
		this.container.append( this.label );
		var that = this;
		this.container.click(function() {
			that.click.apply(that, arguments);
		});

		this.setLabel();
	}


	setLabel() {
		this.mark.css("backgroundColor", this.active ? this.colors.enabled : this.colors.disabled);
	}


	click( ev ) {
		this.active = !this.active;
		this.object[this.property] = this.active;
		this.setLabel();

		ev.stopPropagation();
		ev.preventDefault();
		return false;
	}
}

// ---- panel.js: base class for a debug panel ---------------------------------
class DebugPanel {

	constructor( name, label ) {
		Object.assign(this, {
			active: false,
			container: null,
			options: [],
			panels: [],
			label: '',
			name: ''
		});

		this.name = name;
		this.label = label;
		this.container = $('<div />');
		this.container.addClass('ig_debug_panel ' + this.name);
		this.container.show();
	}


	toggle( active ) {
		this.active = active;
		if(active)
			this.container.show();
		else
			this.container.hide();
	}


	addPanel( panel ) {
		this.panels.push( panel );
		this.container.append( panel.container );
	}


	addOption( option ) {
		this.options.push( option );
		this.container.append( option.container );
	}


	ready(){}
	beforeRun(){}
	afterRun(){}
}

// ---- performance.js: the live performance graph panel -----------------------
var round = function(number, precision) {
	precision = Math.pow(10, precision || 0);
	return Math.round(number * precision) / precision;
};

var ig = ig || {};
ig.system = ig.system || {};
ig.system.fps = ig.system.fps || 60;

class DebugGraphPanel extends DebugPanel {

	constructor( name, label ) {
		super(name, label);

		Object.assign(this, {
			clocks: {},
			marks: [],
			textY: 0,
			height: 128,
			ms: 64,
			timeBeforeRun: 0,
		});

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
	}


	addClock( name, description, color ) {
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
	}


	beginClock( name, offset ) {
		this.clocks[name].start = window.performance.now() + (offset || 0);
	}


	endClock( name ) {
		var c = this.clocks[name];
		c.current = Math.round(window.performance.now() - c.start);
		c.avg = c.avg * 0.8 + c.current * 0.2;
	}


	mark( msg, color ) {
		if( this.active ) {
			this.marks.push( {msg:msg, color:(color||'#fff')} );
		}
	}


	beforeRun() {
		this.endClock('lag');
		this.timeBeforeRun = window.performance.now();
	}


	afterRun() {
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

    // memory usage
    const mem = performance.memory;
    if (mem) {
      const {usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit} = mem;

      this.ctx.fillStyle = 'rgba(0, 0, 255, .5)';
      let h = usedJSHeapSize / jsHeapSizeLimit * this.height;
      let y = this.height - h;
      this.ctx.fillRect(	x, y, 1, h );

      this.ctx.fillStyle = 'rgba(0, 255, 0, .5)';
      let h2 = (totalJSHeapSize - usedJSHeapSize) / jsHeapSizeLimit * this.height;
      let y2 = y - h2;
      this.ctx.fillRect(	x, y2, 1, h2 );
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
}

// ---- menu.js: the debug menu that hosts panels + live number readouts -------
class Menu {

	constructor(holder, perfWidget) {
		Object.assign(this, {
			options: {},
			panels: {},
			numbers:{},
			container: null,
			panelMenu: null,
			activePanel: null,

			debugTime: 0,
			debugTickAvg: 0.016,
			debugRealTime: window.performance.now(),
		});

    this.perfWidget = perfWidget

		// Create the Debug Container
		this.container = $('<div />');
		this.container.addClass("ig_debug");
		$(holder).prepend( this.container );

		// Create and add the Menu Container
		this.panelMenu = $('<div />');
		this.panelMenu.innerHTML = '<div class="ig_debug_head">Impact.Debug:</div>';
		this.panelMenu.addClass("ig_debug_panel_menu");

		this.container.append( this.panelMenu );

		// Create and add the Stats Container
		this.numberContainer = $('<div />');
		this.numberContainer.addClass('ig_debug_stats');
		this.panelMenu.append( this.numberContainer );
	}


	addNumber( name, width ) {
		var number = $('<span />');
		this.numberContainer.append( number );
		this.numberContainer.append( document.createTextNode(name) );

		this.numbers[name] = number;
	}


	showNumber( name, number, width ) {
		if( !this.numbers[name] ) {
			this.addNumber( name, width );
		}
		this.numbers[name].text(number);
	}


	addPanel( panelDef ) {
		// Create the panel and options
		var panel = new (panelDef.type)( panelDef.name, panelDef.label );
		if( panelDef.options ) {
			for( var i = 0; i < panelDef.options.length; i++ ) {
				var opt = panelDef.options[i];
				panel.addOption( new DebugOption(opt.name, opt.object, opt.property) );
			}
		}

		this.panels[ panel.name ] = panel;
		panel.container.hide();//.css("display", 'none');
		this.container.append( panel.container );

		var that = this;
		// Create the menu item
		var menuItem = $('<div />');
		menuItem.addClass('ig_debug_menu_item');
		menuItem.text(panel.label);
		menuItem.click(function(ev) {
			that.togglePanel(panel);
		});
		panel.menuItem = menuItem;

		// Insert menu item in alphabetical order into the menu
		var inserted = false;
		for( var i = 1; i < this.panelMenu.children().length; i++ ) {
			var cn = this.panelMenu.children()[i];
			if( cn.textContent > panel.label ) {
				menuItem.insertBefore( cn );
				inserted = true;
				break;
			}
		}
		if( !inserted ) {
			// Not inserted? Append at the end!
			this.panelMenu.append( menuItem );
		}

    if (panelDef.showImmediately) {
      this.togglePanel(panel);
    }
	}


	showPanel( name ) {
		this.togglePanel( this.panels[name] );
	}


	togglePanel( panel ) {
		if( panel != this.activePanel && this.activePanel ) {
			this.activePanel.toggle( false );
			this.activePanel.menuItem.addClass('ig_debug_menu_item');
			this.activePanel.menuItem.removeClass('active');
			this.activePanel = null;
		}

		var active = !(panel.container.is(":visible"));
		panel.toggle( active );
		panel.menuItem.addClass('ig_debug_menu_item');
		if(active) {
			panel.container.show();
			panel.menuItem.addClass('active');
		} else {
			panel.container.hide();
			panel.menuItem.removeClass('active');
		}

		if( active ) {
			this.activePanel = panel;
		}
	}


	ready() {
		for( var p in this.panels ) {
			if(!this.panels.hasOwnProperty(p)) continue;

			this.panels[p].ready();
		}
	}


	beforeRun() {
		var timeBeforeRun = window.performance.now();
		this.debugTickAvg = this.debugTickAvg * 0.8 + (timeBeforeRun - this.debugRealTime) * 0.2;
		this.debugRealTime = timeBeforeRun;

		if( this.activePanel ) {
			this.activePanel.beforeRun();
		}
	}


	afterRun(renderer, fluidSystem) {
		var frameTime = window.performance.now() - this.debugRealTime;

		this.debugTime = this.debugTime * 0.8 + frameTime * 0.2;

		if( this.activePanel ) {
			this.activePanel.afterRun();
		}

		this.showNumber( 'ms',  this.debugTime.toFixed(2) );
		this.showNumber( 'fps',  Math.round(1000/this.debugTickAvg) );
		if( renderer ) {
			this.showNumber( 'draws', renderer.drawCount );
		}
		if( fluidSystem ) {
			// calculate number of particles in all layers
			var numberOfParticles = fluidSystem.getNumberOfParticles();
			this.showNumber( 'particles', numberOfParticles );
		}
	}
}

// ---- debug.js: the aggregator the panel talks to ----------------------------
const Debug = {
	Menu: Menu,
	Performance: DebugGraphPanel
};

// A single shared loop drives every open panel. Replaces any previous loop so a
// live-reload of this module does not leave an orphaned one running.
if (globalThis.livelyPerformanceLoop) {
  globalThis.livelyPerformanceLoop.pause()
}
globalThis.livelyPerformanceLoop = new PausableLoop(() => globalThis.livelyPerformanceUpdate())
livelyPerformanceLoop.ensureRunning()

globalThis.livelyPerformanceUpdate = (...parem) => {
  const panels = [...document.querySelectorAll('lively-performance-panel')]
  panels.forEach(panel => {
    if (!panel.beforeRun) {
      return
    }

    panel.beforeRun()
    var i = 1000
    while (i--) {
      12354236 * 2790732 / 219704714
    }
    panel.afterRun()
  });
}

export default class LivelyPerformancePanel extends Morph {
  async initialize() {
    this.windowTitle = "Performance Panel";
    this.registerButtons()
    lively.html.registerKeys(this); // automatically installs handler for some methods

    this.debug = new Debug.Menu(this.get('#holder'), this);
    this.debug.addPanel({
      type: Debug.Performance,
      name: 'graph',
      label: 'Performance',
      showImmediately: true
    });
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }

  beforeRun() {
		var timeBeforeRun = window.performance.now();
		this.debug.debugTickAvg = this.debug.debugTickAvg * 0.8 + (timeBeforeRun - this.debug.debugRealTime) * 0.2;
		this.debug.debugRealTime = timeBeforeRun;

		if( this.debug.activePanel ) {
			this.debug.activePanel.beforeRun();
		}
	}

	afterRun(renderer, fluidSystem) {
    const now = window.performance.now();
		var frameTime = now - this.debug.debugRealTime;

		this.debug.debugTime = this.debug.debugTime * 0.8 + frameTime * 0.2;

		if( this.debug.activePanel ) {
			this.debug.activePanel.afterRun();
		}

		this.debug.showNumber( 'ms',  this.debug.debugTime.toFixed(2) );
    if (!this.lastFrameTimestamp) {
      this.lastFrameTimestamp = now
    }
    this.debug.showNumber( 'ms',  (now - this.lastFrameTimestamp).toFixed(2) );
    this.lastFrameTimestamp = now
		this.debug.showNumber( 'fps',  Math.round(1000/this.debug.debugTickAvg) );
		if( renderer ) {
			this.debug.showNumber( 'draws', renderer.drawCount );
		}
		if( fluidSystem ) {
			// calculate number of particles in all layers
			var numberOfParticles = fluidSystem.getNumberOfParticles();
			this.debug.showNumber( 'particles', numberOfParticles );
		}

    if (globalThis.ivuMeta) {
      this.debug.showNumber( 'data copies',  ivuMeta.length );
    }

    // memory usage
    if (performance.memory) {
      const {usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit} = performance.memory;
      this.debug.showNumber( 'mb heap used',  (usedJSHeapSize / 1024 / 1024).toFixed(0) );
      this.debug.showNumber( 'mb heap total',  (totalJSHeapSize / 1024 / 1024).toFixed(0) );
      this.debug.showNumber( 'mb heap limit',  (jsHeapSizeLimit / 1024 / 1024).toFixed(0) );
    }
    this.debug.showNumber( 'gb device memory', navigator.deviceMemory?.toFixed?.(0) );
	}

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
  }

  livelyPreMigrate() {
  }

  livelyMigrate(other) {
  }

  async livelyExample() {
  }

}
