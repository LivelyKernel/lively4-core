contentLoaded(window, function() {
	var colors = ["blue", "black", "brown", "white"];
	var man = {
		shoes: "brown",
		shirt: "brown",
		pants: "brown",
		hat: "brown"	
	};
    var solver = bbb.defaultSolver = new csp.Solver();
	
    always: { man.shoes.is in ["brown", "black"] }
    always: { man.shirt.is in ["blue", "white", "brown"] }
    always: { man.pants.is in ["blue", "black", "brown", "white"] }
    always: { man.hat.is in ["brown"] }
    
    always: { man.shoes === man.hat }
    always: { man.shoes !== man.pants }
    always: { man.shoes !== man.shirt }
    always: { man.shirt !== man.pants }
    console.log(man.shoes, man.pants, man.shirt, man.hat);
    man.shirt = "white";
    console.log(man.shoes, man.pants, man.shirt, man.hat);
});
