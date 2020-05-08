import Vector2 from "./../external/vector2.js";
import AABB from "./../external/aabb.js";

import Material from "./material.js";
import Particle from "./particle.js";
import Node from "./node.js";
import Grid from "./grid.js";
import Obstacle from "./obstacle.js";
import Integrator from "./integrator.js";

	var System = function() {
		this.wall = new AABB(
			new Vector2(-50, 2),
			new Vector2(50, 100)
		);
		this.gravity = new Vector2(0,-0.05);// 0.004, 0.02
		this.materials = [];
		this.particles = [];
		this.springs = [];
		this.grid = new Grid();
		this.integrator = new Integrator(this.grid);
		
		this.useSurfaceTensionImplementation = true;
		this.drawGrid = false;
		
		this.doObstacles = false;
		this.obstacles = [];

		this.doSprings = false;
		this.drawSprings = false;
	};

	System.prototype.getNumberOfParticles = function() {
		return this.particles.length;
	};

	System.prototype.getNumberOfMaterials = function() {
		return this.materials.length;
	};

	System.prototype.createNewMaterial = function() {
		var newMaterial = new Material(this.materials.length);
		this.materials.push(newMaterial);
		
		return newMaterial;
	};

	System.prototype.addParticle = function(particle) {
    	this.particles.push(particle);
	};

	/*
	 * UPDATE
	 */
	System.prototype.update = function() {
		this.grid.update(this);

		if(this.useSurfaceTensionImplementation) {
			this.surfaceTensionImplementation();
		} else {
			this.simpleSimulation();
		}
	};

	
	/*
	 * surface tension implementation
	 */
	System.prototype.surfaceTensionImplementation = function() {
		this.mapPropertiesToGrid();
		this.sumUpPerMaterialGradients();
		
		// Calculate pressure and add forces to grid
		_.each(this.particles, function(p, pIndex) {
			var material = p.material;
			var dudx = 0, dudy = 0,
				dvdx = 0, dvdy = 0,
				sx = 0, sy = 0;
			
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				// Surface tension
				sx += phi * node.cgx[material.materialIndex];
				sy += phi * node.cgy[material.materialIndex];

				// Velocity gradient
				dudx += node.velocity.x * gxpy;
				dudy += node.velocity.x * pxgy;
				dvdx += node.velocity.y * gxpy;
				dvdy += node.velocity.y * pxgy;
			});
			
			// determine cell index for mesh
			var linearCellX = Math.floor(p.position.x - this.grid.boundaries.Min.x); // get cell x
			var linearCellY = Math.floor(p.position.y - this.grid.boundaries.Min.y); // get cell y
			
			// linear 2x2 kernel
			// y  +-+-+
			//  1 |2|4|
			//    +-+-+
			//  0 |1|3|
			//    +-+-+
			//   /
			//  /  0 1 x
			var n1 = this.grid.getOrCreateAt(linearCellX  , linearCellY  );
			var n2 = this.grid.getOrCreateAt(linearCellX  , linearCellY+1);
			var n3 = this.grid.getOrCreateAt(linearCellX+1, linearCellY  );
			var n4 = this.grid.getOrCreateAt(linearCellX+1, linearCellY+1);
			
			var density = this.uscip(
				n1.particleDensity, n1.gx, n1.gy,
				n2.particleDensity, n2.gx, n2.gy,
				n3.particleDensity, n3.gx, n3.gy,
				n4.particleDensity, n4.gx, n4.gy,
				p.position.x - this.grid.boundaries.Min.x - linearCellX, p.position.y - this.grid.boundaries.Min.y - linearCellY); // r and s

			var restDensity = material.restDensity;
			var pressure = material.stiffness*(density-restDensity)/restDensity;
			if (pressure > 2.0)
				pressure = 2.0;

			// Update stress tensor
			var w1 = dudy - dvdx;
			var wT0 = .5 * w1 * (p.T01 + p.T01);
			var wT1 = .5 * w1 * (p.T00 - p.T11);
			var D00 = dudx;
			var D01 = .5 * (dudy + dvdx);
			var D11 = dvdy;
			var trace = .5 * (D00 + D11);
			p.T00 += .5 * (-wT0 + (D00 - trace) - material.meltRate * p.T00);
			p.T01 += .5 * (wT1 + D01 - material.meltRate * p.T01);
			p.T11 += .5 * (wT0 + (D11 - trace) - material.meltRate * p.T11);
			
			// Stress tensor fracture
			var norm = p.T00 * p.T00 + 2 * p.T01 * p.T01 + p.T11 * p.T11;
			
			if (norm > material.maxDeformation)
			{
				p.T00 = p.T01 = p.T11 = 0;
			}
			
			var T00 = material.particleMass * (material.elasticity * p.T00 + material.viscosity * D00 + pressure + trace * material.bulkViscosity);
			var T01 = material.particleMass * (material.elasticity * p.T01 + material.viscosity * D01);
			var T11 = material.particleMass * (material.elasticity * p.T11 + material.viscosity * D11 + pressure + trace * material.bulkViscosity);
			
			// Surface tension
			var lenSq = sx * sx + sy * sy;
			if (lenSq > 0)
			{
				var len = Math.sqrt(lenSq);
				var a = material.particleMass * material.surfaceTension / len;
				T00 -= a * (.5 * lenSq - sx * sx);
				T01 -= a * (-sx * sy);
				T11 -= a * (.5 * lenSq - sy * sy);
			}
			
			// Wall force
			var f = Vector2.Zero.copy();
			if (p.position.x < this.wall.Min.x) {
				f.x += this.wall.Min.x - p.position.x;
	            p.velocity.x *= 0.1;
			}
			if (p.position.x > this.wall.Max.x) {
				f.x += this.wall.Max.x - p.position.x;
	            p.velocity.x *= 0.1;
			}
			if (p.position.y < this.wall.Min.y) {
				f.y += this.wall.Min.y - p.position.y;
	            p.velocity.y *= 0.1;
			}
			if (p.position.y > this.wall.Max.y) {
				f.y += this.wall.Max.y - p.position.y;
	            p.velocity.y *= 0.1;
			}
			
			// test obstacle collision
			if (this.doObstacles){
				
				// circular obstacles
				_.each(this.obstacles, function(obstacle) {
					var obstacleRadius  = obstacle.radius;
					var obstacleRadiusSquared = obstacleRadius * obstacleRadius;
					var particleDistanceToMiddlePoint = obstacle.position.sub(p.position);
					var distanceSquared = particleDistanceToMiddlePoint.lengthSquared();
					if (distanceSquared < obstacleRadiusSquared){
						var distance = Math.sqrt(distanceSquared);
						var dR = obstacleRadius-distance;
						f.subSelf(particleDistanceToMiddlePoint.mulFloat(dR/distance));
					}
				}, this);
			}
			
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				node.acceleration.x += -(gxpy * T00 + pxgy * T01) + f.x * phi;
				node.acceleration.y += -(gxpy * T01 + pxgy * T11) + f.y * phi;
			});
		}, this);

		// Update acceleration of nodes
		this.grid.iterate(function(node) {
			if (node.mass > 0.0) {
				node.acceleration.divFloatSelf(node.mass);
			}
		}, this);

		_.each(this.particles, function(p, pIndex) {
			var material = p.material;

			// Update particle velocities
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				particle.velocity.weightedAddSelf(node.acceleration, phi);
			});
			
			p.velocity.addSelf(this.gravity);
			p.velocity.mulFloatSelf(1 - material.damping);

			// Add particle velocities back to the grid
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				node.velocity2.weightedAddSelf(particle.velocity, material.particleMass * phi);
			});
		}, this);

		// Update node velocities
		this.grid.iterate(function(node) {
			if (node.mass > 0.0) {
				node.velocity2.divFloatSelf(node.mass);
			}
		}, this);
		
		this.advanceParticles();
		this.springDisplacement();
		this.boundaryCorrection();
	};

	System.prototype.mapPropertiesToGrid = function() {
		_.each(this.particles, function(p, pIndex) {
			var material = p.material;

			// Update grid cell index and kernel weights
			this.integrator.updateStateAndGradientOf(p);
			this.integrator.prepareParticle(p);

			// Add particle mass, velocity and density gradient to grid
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				node.mass += phi * material.particleMass;
				node.particleDensity += phi;
				node.velocity.weightedAddSelf(particle.velocity, material.particleMass * phi);
				node.cgx[material.materialIndex] += gxpy;
				node.cgy[material.materialIndex] += pxgy;
			});
		}, this);
	};
	
	System.prototype.sumUpPerMaterialGradients = function() {
		var numMaterials = this.getNumberOfMaterials();
		this.grid.iterate(function(node) {
			if (node.mass > 0.0) {
				node.acceleration.clear();
				node.gx = 0;
				node.gy = 0;
				node.velocity.divFloatSelf(node.mass);
				// sum up gradients of all materials
				for(var i = 0; i < numMaterials; i++) {
					node.gx += node.cgx[i];
					node.gy += node.cgy[i];
				}
				for(var i = 0; i < numMaterials; i++) {
					node.cgx[i] -= node.gx - node.cgx[i];
					node.cgy[i] -= node.gy - node.cgy[i];
				}
			}
		}, this);
	};
	
	System.prototype.uscip = function(
		p00, x00, y00,
		p01, x01, y01,
		p10, x10, y10,
		p11, x11, y11,
		u, v
	) {
		var dx = x00 - x01;
		var dy = y00 - y10;
		var a = p01 - p00;
		var b = p11 - p10 - a;
		var c = p10 - p00;
		var d = y11 - y01;
		return ((((d - 2 * b - dy) * u - 2 * a + y00 + y01) * v +
				 ((3 * b + 2 * dy - d) * u + 3 * a - 2 * y00 - y01)) * v +
				((((2 * c - x00 - x10) * u + (3 * b + 2 * dx + x10 - x11)) * u - b - dy - dx) * u + y00)) * v +
		(((x11 - 2 * (p11 - p01 + c) + x10 + x00 + x01) * u +
		  (3 * c - 2 * x00 - x10)) * u +
		 x00) * u + p00;
	};

	System.prototype.advanceParticles = function() {
		_.each(this.particles, function(p, pIndex) {
			var material = p.material;
			
			var gVelocity = Vector2.Zero.copy();
			var dudx = 0, dudy = 0, dvdx = 0, dvdy = 0;
			
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				gVelocity.weightedAddSelf(node.velocity2, phi);
				
				// Velocity gradient
				dudx += node.velocity2.x * gxpy;
				dudy += node.velocity2.x * pxgy;
				dvdx += node.velocity2.y * gxpy;
				dvdy += node.velocity2.y * pxgy;
			});
			
			// Update stress tensor
			var w1 = dudy - dvdx;
			var wT0 = .5 * w1 * (p.T01 + p.T01);
			var wT1 = .5 * w1 * (p.T00 - p.T11);
			var D00 = dudx;
			var D01 = .5 * (dudy + dvdx);
			var D11 = dvdy;
			var trace = .5 * (D00 + D11);
			p.T00 += .5 * (-wT0 + (D00 - trace) - material.meltRate * p.T00);
			p.T01 += .5 * (wT1 + D01 - material.meltRate * p.T01);
			p.T11 += .5 * (wT0 + (D11 - trace) - material.meltRate * p.T11);
			
			// Stress tensor fracture
			var norm = p.T00 * p.T00 + 2 * p.T01 * p.T01 + p.T11 * p.T11;
			
			if (norm > material.maxDeformation)
			{
				p.T00 = p.T01 = p.T11 = 0;
			}
			
			// advance particle
			p.prevPosition.set(p.position);
			p.position.addSelf(gVelocity);
			p.gridVelocity.set(gVelocity);
			p.velocity.weightedAddSelf(gVelocity.sub(p.velocity), material.smoothing);
		}, this);
	};

	System.prototype.springDisplacement = function() {
		if(this.doSprings) {
			_.each(this.springs, function(s, sIndex) {
				s.update();
				s.solve();
			}, this);
		}
	};
	
	// hard boundary correction
	System.prototype.boundaryCorrection = function() {
		_.each(this.particles, function(p, pIndex) {
			if (p.position.x < this.wall.Min.x - 4)
				p.position.x = this.wall.Min.x - 4 + .01 * Math.random();
			else if (p.position.x > this.wall.Max.x + 4)
				p.position.x = this.wall.Max.x + 4 - .01 * Math.random();
			if (p.position.y < this.wall.Min.y - 4)
				p.position.y = this.wall.Min.y - 4 + .01 * Math.random();
			else if (p.position.y > this.wall.Max.y + 4)
				p.position.y = this.wall.Max.y + 4 - .01 * Math.random();
		}, this);
	};

	export default System;
