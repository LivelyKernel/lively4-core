define(["./gameobject", "./../rendering/animation", "./../rendering/animationsheet"], function moduleBullet(GameObject, Animation, AnimationSheet) {
    var Bullet = GameObject.subclass("Bullet", {
        initialize: function($super, world, pos, vel, tank, ricochets, speed) {
            $super(world, "bullet", pos, new Vector2(0.5, 0.5), 0.25, vel, speed);

            this.animation = new Animation(new AnimationSheet("bullet.png", 7, 7), 0.2, [0]);

            this.maxReflections = ricochets;
            this.reflectionCount = 0;

            this.initConstraints();
            this.tank = tank;
        },

        initConstraints: function() {
            var that = this,
                map = this.world.map;

            // constraint idea:
            // separate this into 2 constraints
            // one constraint that triggers the vertical reflection
            // the other just listens on the y-coordinate for the horizontal reflection

            function reflect(axis) {
                if(that.reflectionCount++ == that.maxReflections) {
                    this.disable();
                    that.destroy();
                } else {
                    if(that.reflectionCount == 1) {
                        that.onCollisionWith(that.tank, Bullet.detonate);
                    }
                    that.velocity[axis] *= -1;
                }
            };

            // bounce combines "vertical" and "horizontal" wall reflection
            var bounce = when(function() {
                !that.getTile(that.position).canFlyThrough();
            }).trigger(function() {
                var prevFlyable = that.getTile(that.prevPosition).canFlyThrough(),
                    reflOnX = that.getTile(new Vector2(
                        that.prevPosition.x,
                        that.position.y
                    )).canFlyThrough(),
                    reflOnY = that.getTile(new Vector2(
                        that.position.x,
                        that.prevPosition.y
                    )).canFlyThrough();

                if(prevFlyable && reflOnX) {
                    reflect.call(this, "x");
                } else if(prevFlyable && reflOnY) {
                    reflect.call(this, "y");
                }

                that.position.set(that.prevPosition);
            });

            // TODO: ! extract x and y
/*
            var vertical = when(function() {
                var pp = that.prevPosition.divVector(map.tileSize).floor();
                var x = that.position.divVector(map.tileSize).floor().x;
                map.tiles[pp.y][pp.x].canFlyThrough() && !(map.tiles[pp.y][x].canFlyThrough());
            }).trigger(function() {
                reflect.call(this, "x");
            });

            var horizontal = when(function() {
                var pp = that.prevPosition.divVector(map.tileSize).floor();
                var y = that.position.divVector(map.tileSize).floor().y;
                map.tiles[pp.y][pp.x].canFlyThrough() && !(map.tiles[y][pp.x].canFlyThrough());
            }).trigger(function() {
                reflect.call(this, "y");
            });
*/
/*
            old, unconverted version of wall bouncing
            function reflect(axis) {
                if(that.reflectionCount++ == that.maxReflections) {
                    this.disable();
                    that.destroy();
                } else {
                    if(that.reflectionCount == 1) {
                        that.onCollisionWith(that.tank, Bullet.detonate);
                    }
                    that.velocity[axis] *= -1;
                }
            };

            // TODO: ! extract x and y
            var vertical = bbb.trigger({
                callback: function() {
                    reflect.call(this, "x");
                },
                ctx: {
                    that: that,
                    map: map
                }
            }, function() {
                var pp = that.prevPosition.divVector(map.tileSize).floor();
                var x = that.position.divVector(map.tileSize).floor().x;
                return map.tiles[pp.y][pp.x].canFlyThrough() && !(map.tiles[pp.y][x].canFlyThrough());
            });

            var horizontal = bbb.trigger({
                callback: function() {
                    reflect.call(this, "y");
                },
                ctx: {
                    that: that,
                    map: map
                }
            }, function() {
                var pp = that.prevPosition.divVector(map.tileSize).floor();
                var y = that.position.divVector(map.tileSize).floor().y;
                return map.tiles[pp.y][pp.x].canFlyThrough() && !(map.tiles[y][pp.x].canFlyThrough());
            });
*/
            // constraint idea:
            // avoid bullets to go out of bounds due to low framerate
            // split x and y axis to enable the same reflection behaviour,
            // if the bullet goes out of bounds
            var mapMaxX = map.tileSize.x * map.tiles[0].length;
            var mapMaxY = map.tileSize.y * map.tiles.length;
            var oobVertical = bbb.assert({
                onError: function(error) {
                    if(error instanceof ContinuousAssertError) {
                        reflect.call(this, "x");
                    } else {
                        throw error;
                    }
                },
                ctx: {
                    that: that,
                    mapMaxX: mapMaxX
                }
            }, function() {
                return that.position.x >= 0 && that.position.x < mapMaxX;
            });
            var oobHorizontal = bbb.assert({
                onError: function(error) {
                    if(error instanceof ContinuousAssertError) {
                        reflect.call(this, "y");
                    } else {
                        throw error;
                    }
                },
                ctx: {
                    that: that,
                    mapMaxY: mapMaxY
                }
            }, function() {
                return that.position.y >= 0 && that.position.y < mapMaxY;
            });

            this.constraints.push(bounce, /*vertical, horizontal,*/ oobVertical, oobHorizontal);
        },
        destroy: function($super) {
            $super();
            this.tank.bullets++;
        }
    });

    Bullet.SPEED_NORMAL = 16 / 3.7;
    Bullet.SPEED_FAST = 1.5 * Bullet.SPEED_NORMAL;

    Bullet.detonate = function(bullet, other) {
        // 3 possibilities to avoid this to happen more than one time for a single bullet:
        // 1. in collision callback:
        //     if(bullet.alive && other.alive)
        //     but get not rid of the actual constraint -> slow with more and more bullets
        // 2. layer each game object
        //     layer.activeOn(bullet in world)
        //     but collision callback is linked to 2 game objects
        // 3. in collision callback
        //     bullet.unconstrainAND_DISABLE_ALL() to disable all linked constraints
        //     very general; we instead keep track of these manually and disable all constraints on destroy
        bullet.destroy();
        other.destroy();
    };

    return Bullet
});
