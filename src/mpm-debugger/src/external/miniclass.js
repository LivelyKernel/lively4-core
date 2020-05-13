(function(window) {
	window.mini = window.mini || {};
	window.mini.Class = /*window.mini.Class ||*/ (function() {
		var initializing = false;
		
		var Class = function() {};

		var inject = function(properties) {
			// copy given properties
			for(var name in properties || {}) {
				this.prototype[name] = properties[name];
			};
		};
		
		Class.subclass = function(properties) {
			
			initializing = true;
			var prototype = new this();
			initializing = false;

			// copy given properties
			for(var name in properties || {}) {
				prototype[name] = properties[name];
			};
			
			var ChildClass = function() {
				if( !initializing ) {
					if( this.initialize ) {
						this.initialize.apply(this, arguments);
					}
				}
			};

			ChildClass.prototype = prototype;
			ChildClass.constructor = ChildClass;
			ChildClass.subclass = Class.subclass;
			ChildClass.inject = inject;
			
			return ChildClass;
		};

		return Class;
	})();
})(window);
