define(["./gameobject", "./bullet", "./../rendering/animation", "./../rendering/animationsheet"], function moduleTank(GameObject, Bullet, Animation, AnimationSheet) {
    // possible constraints:
    // - your direction should be normalized
    // - your speed is limited to maxSpeed (cannot adjust speed?)
    // - your velocity is direction.mulFloat(dt*speed)
    var Tank = GameObject.subclass("Tank", {
        initialize: function($super, world, pos, vel, dir, config) {
            $super(world, "tank", pos, new Vector2(2, 2), 1, vel, config.speed);

            this.turretDirection = dir;
            this.turretAnimation = new Animation(new AnimationSheet("turret.png", 18, 18), 0.4, [0,1,2,3]);

            this.bullets = config.bullets;
            this._bulletRicochets = config.bulletRicochets;
            this.bulletSpeed = config.bulletSpeed;

            this.powerUps = {};

            this.initConstraints();
        },
        initConstraints: function() {
            var that = this,
                map = this.world.map;

            // constraint:
            // - keep velocity direction and turret direction in sync
            /*
            var that = this;
            var turretConstraint = bbb.always({
                solver: new DBPlanner(),
                ctx: {
                    that: that
                },
                methods: function() {
                    that.turretDirection.formula([that.velocity, that.velocity.x, that.velocity.y], function(velocity, velocityX, velocityY) {
                        return velocity;
                    });
                }
            }, function() {
                return that.turretDirection.equals(that.velocity);
            });

            this.constraints.push(turretConstraint);
            */

            // constraint:
            // - do not be on a wall tile
            var doNotStayInWalls = bbb.assert({
                // collision solving is already provided by the babelsberg.assert
                // method and its ability the revert to a valid state
                onError: function(error) {
                    if(!error instanceof ContinuousAssertError) {
                        throw error;
                    }
                },
                ctx: {
                    that: that,
                    map: map
                }
            }, function() {
                // collision detection against the current tile
                return that.getTile(that.position).canWalkThrough();
            });

            // constraint idea:
            // avoid tanks to go out of bounds due to low framerate
            // TODO: ! static rectangle
            var mapMaxX = map.tileSize.x * map.tiles[0].length;
            var mapMaxY = map.tileSize.y * map.tiles.length;
            var outOfBounds = bbb.assert({
                onError: function(error) {
                    if(!(error instanceof ContinuousAssertError)) {
                        throw error;
                    }
                },
                ctx: {
                    that: that,
                    mapMaxX: mapMaxX,
                    mapMaxY: mapMaxY
                }
            }, function() {
                return that.position.x >= 0 && that.position.x < mapMaxX &&
                    that.position.y >= 0 && that.position.y < mapMaxY;
            });

            this.constraints.push(doNotStayInWalls, outOfBounds);

            // assumption: tanks are inserted first into the world
            this.world.getGameObjects().each(function(other) {
                // constraint:
                // - solve collisions
                that.onCollisionWith(other, function(that, tank) {
                    var desiredDistance = that.radius + tank.radius,
                        distVector = tank.position.sub(that.position),
                        realDistance = distVector.length(),
                        moveVector = distVector.mulFloat((desiredDistance - realDistance) / 1.9);
                    tank.position.addSelf(moveVector);
                    that.position.subSelf(moveVector);
                    //console.log(realDistance, "post", that.position.distance(tank.position, that.radius + tank.radius));
                });
            });
        },

        update: function($super, dt) {
            $super(dt);
            this.turretAnimation.update(dt);

            this.controls && this.controls.update(dt);
            $H(this.powerUps).each(function(pair){
                pair.value.update(dt);
            });
        },

        draw: function($super, renderer) {
            $super(renderer);
            this.turretAnimation.draw(
                renderer, this.getWorldAABB(), new Vector2(1,0).getDirectedAngle(this.turretDirection)
            );
        },

        //\todo{change fifth level to all colors}
        //predicate(function() {
        //  return input.pressed(”leftclick”);
        //}).trigger(player.fireBullet.bind(player));
        fireBullet: function() {
            if(this.bullets == 0) { return; }

            var direction = this.turretDirection.normalizedCopy();
            var position = this.position.add(direction.mulFloat(this.radius));

            if(!this.getTile(position).canFlyThrough()) { return; }

            this.bullets--;
            var bullet = new Bullet(this.world,
                position,
                direction,
                this,
                this.getBulletRicochets(),
                this.bulletSpeed
            );
            this.world.spawn(bullet);
            this.world.getGameObjects().each(function(other) {
                if(other === this || other === bullet) { return; }
                if(!(other.name == "tank" || other.name == "bullet")) { return; }

                bullet.onCollisionWith(other, Bullet.detonate);
            }, this);
        },
        getBulletRicochets: function() {
            return this._bulletRicochets;
        },
        destroy: function($super) {
            $super();
        }
    });

    Tank.SPEED_IMMOBILE = 0;
    Tank.SPEED_NORMAL = 16 / 6;
    Tank.SPEED_SLOW = 0.5 * Tank.SPEED_NORMAL;
    Tank.SPEED_FAST = 1.5 * Tank.SPEED_NORMAL;

    return Tank;
});
