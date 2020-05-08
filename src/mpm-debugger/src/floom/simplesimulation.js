import System from "./system.js";
import Material from "./material.js";
import Particle from "./particle.js";
import Node from "./node.js";
import Grid from "./grid.js";
import Obstacle from "./obstacle.js";
import Integrator from "./integrator.js";
import Vector2 from "./../external/vector2.js";

	/*
	 * Early simple implementation of the material point method
	 */
	System.prototype.simpleSimulation = function() {
		this.__calculateParticleKernels();
		this.__sumParticleDensityFromGridAndAddPressureansElasticForcesToGrid();
		this.__divideGridAccelerationByMass();
		this.__accelerateParticlesAndInterpolateVelocityBackToGrid();
		this.__divideGridVelocityByMass();
		this.__advanceParticles();
	};

	System.prototype.__calculateParticleKernels = function() {
		// calculate particle kernels, and add density and density gradients to the grid
		_.each(this.particles, function(p, pIndex) {
			this.integrator.updateStateAndGradientOf(p);
			this.integrator.prepareParticle(p);
			
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				node.mass += phi;
			});
		}, this);
	};
	
	System.prototype.__sumParticleDensityFromGridAndAddPressureansElasticForcesToGrid = function() {
		// Sum particle density from grid, and add pressure and elastic forces to grid
		_.each(this.particles, function(p, pIndex) {
	        var density = 0;
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				density += phi*node.mass;
			});

			var restDensity = p.material.restDensity;
			var pressure = (density-restDensity)/restDensity;
			if (pressure > 4.0)
				pressure = 4.0;

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
			
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				node.acceleration.x += -(gxpy * pressure) + f.x * phi;
				node.acceleration.y += -(pxgy * pressure) + f.y * phi;
			});
		}, this);
	};

	// divide grid acceleration by mass
	System.prototype.__divideGridAccelerationByMass = function() {
		this.grid.iterate(function(n) {
			if (n.mass > 0.0) {
				n.acceleration.divFloatSelf(n.mass);
				n.acceleration.addSelf(this.gravity);
			}
		}, this);
	};
	
	// accelerate particles and interpolate velocity back to grid
	System.prototype.__accelerateParticlesAndInterpolateVelocityBackToGrid = function() {
		_.each(this.particles, function(p, pIndex) {
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				particle.velocity.weightedAddSelf(node.acceleration, phi);
			});
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				node.velocity.weightedAddSelf(particle.velocity, phi);
			});
		}, this);
	};
	
	// divide grid velocity by mass
	System.prototype.__divideGridVelocityByMass = function() {
		this.grid.iterate(function(n) {
			if (n.mass > 0.0) {
				n.velocity.divFloatSelf(n.mass);
			}
		}, this);
	};
	
	System.prototype.__advanceParticles = function() {
		// advance particles
		_.each(this.particles, function(p, pIndex) {
	        p.gridVelocity.clear();
			this.integrator.integrate(p, function(particle, node, phi, gxpy, pxgy) {
				particle.gridVelocity.weightedAddSelf(node.velocity, phi);
			});
			p.position.addSelf(p.gridVelocity);
			p.velocity.weightedAddSelf(p.gridVelocity.sub(p.velocity), p.material.smoothing);
		}, this);
	};
