var DebugOption = mini.Class.subclass({
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
	
	
	initialize: function( name, object, property ) {
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
	},
	
	
	setLabel: function() {
		this.mark.css("backgroundColor", this.active ? this.colors.enabled : this.colors.disabled);
	},
	
	
	click: function( ev ) {
		this.active = !this.active;
		this.object[this.property] = this.active;
		this.setLabel();
		
		ev.stopPropagation();
		ev.preventDefault();
		return false;
	}
});

export default DebugOption;
