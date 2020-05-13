import Particle from "./particle.js";
import Spring from "./spring.js";
import Material from "./material.js";

	var Group = function(system, minX, minY, maxX, maxY, u, v, material) {
		this.material = material;
		
		var map = [];
		for (var i = minX; i < maxX; i++) {
			map[map.length] = [];
	        for (var j = minY; j < maxY; j++) {
	        	var p = new Particle(i, j, u, v, material);
	        	system.addParticle(p);
	        	if(material.isElastic) {
	        		map[map.length-1].push(p);
	        	}
	        }
		}
    	if(material.isElastic) {
    		for(var i = 0; i < map.length; i++) {
    			for(var j = 1; j < map[0].length; j++) {
        			system.springs.push(new Spring(map[i][j-1], map[i][j], map[i][j-1].position.distance(map[i][j].position)));
    			}
    		}
    		for(var j = 0; j < map[0].length; j++) {
    			for(var i = 1; i < map.length; i++) {
        			system.springs.push(new Spring(map[i-1][j], map[i][j], map[i-1][j].position.distance(map[i][j].position)));
    			}
    		}
    		for(var i = 1; i < map.length; i++) {
    			for(var j = 1; j < map[0].length; j++) {
        			system.springs.push(new Spring(map[i-1][j-1], map[i][j], map[i-1][j-1].position.distance(map[i][j].position)));
    			}
    		}
    		for(var i = 0; i < map.length - 1; i++) {
    			for(var j = 1; j < map[0].length; j++) {
        			system.springs.push(new Spring(map[i+1][j-1], map[i][j], map[i+1][j-1].position.distance(map[i][j].position)));
    			}
    		}
    	}
	};
	
	export default Group;
