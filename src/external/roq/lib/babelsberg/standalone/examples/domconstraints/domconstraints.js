contentLoaded(window, function() {
	cas = new ClSimplexSolver();
	var deltablue = new DBPlanner();

	var div = document.getElementById("div1");
	console.log(div, div.style.width , div.style.height);

	bbb.always({
	    solver: deltablue,
	    ctx: {
	        style: div.style,
	        _$_self: this.doitContext || this
	    }
	}, function() {
		style.width.formula([ style.height ], function(height) {
	        return height;
	    });
	    return style.height.formula([ style.width ], function(width) {
	        return width;
	    });;
	});
});

