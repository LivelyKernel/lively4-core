define(function moduleGameObject() {
    var GameObject = Object.subclass("GameObject", {
        initialize: function(world, name, pos, extent, radius, vel, speed) {
            this.world = world;
            this.name = name;

            this.position = pos;
            this.prevPosition = pos.copy();

            this.velocity = vel;

            this.radius = radius;
            this.extent = extent;

            this.speed = speed * world.map.tileSize.x;

            this.constraints = [];
            this.alive = true;
        },

        update: function(dt) {
            this.move(dt);
            this.animation.update(dt);
        },

        move: function(dt) {
            var deltaPos = this.velocity.normalizedCopy().mulFloat(dt*this.speed);

            this.prevPosition.set(this.position);
            this.position.addSelf(deltaPos);
        },

        draw: function(renderer) {
            this.animation.draw(renderer, this.getWorldAABB(), new Vector2(1,0).getDirectedAngle(this.velocity));
        },

        getTile: function(pos) {
            return this.world.map.get(this.world.map.positionToCoordinates(pos));
        },

        getWorldAABB: function() {
            var halfSize = this.extent.divFloat(2);
            var aabb = new AABB(
                this.position.sub(halfSize),
                this.position.add(halfSize)
            );
            return aabb;
        },

        // define a callback that should be triggered when this object is colliding with a second game object
        onCollisionWith: function(other, callback) {
            var that = this;

            var onCollision = predicate(function() {
                // use simple spheres for collision detection
                // remember: this is only the detection of a collision
                // if a collision occurs, it is solved by the given callback
                return that.position.distance(other.position) <= that.radius + other.radius;
            }, {
                 ctx: {
                     that: that,
                     other: other
                 }
            }).trigger(function() {
                callback.call(this, that, other);
            });


            // track this constraint on both game objects
            this.constraints.push(onCollision);
            other.constraints.push(onCollision);
        },

        destroy: function() {
            //cop.withLayers([UnconstrainAndDisableAllLayer], (function() {
            //    bbb.unconstrainAll(this);
            //}).bind(this));
            this.constraints.each(function(constraint) {
                constraint.disable();
            });
            this.alive = false;
            this.world.remove(this);
        }
    });

    return GameObject;
});
