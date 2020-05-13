var DebugPanel = mini.Class.subclass({
	active: false,
	container: null,
	options: [],
	panels: [],
	label: '',
	name: '',
	
	
	initialize: function( name, label ) {
		this.name = name;
		this.label = label;
		this.container = $('<div />');
		this.container.addClass('ig_debug_panel ' + this.name);
		this.container.show();
	},
	
	
	toggle: function( active ) {
		this.active = active;
		if(active)
			this.container.show();
		else
			this.container.hide();
	},
	
	
	addPanel: function( panel ) {
		this.panels.push( panel );
		this.container.append( panel.container );
	},
	
	
	addOption: function( option ) {
		this.options.push( option );
		this.container.append( option.container );
	},
	
	
	ready: function(){},
	beforeRun: function(){},
	afterRun: function(){}
});

export default DebugPanel;
