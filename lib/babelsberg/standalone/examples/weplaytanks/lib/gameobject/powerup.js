define(["./gameobject", "./../rendering/animation", "./../rendering/animationsheet"], function modulePowerUp(GameObject, Animation, AnimationSheet) {
    var Timer = Object.subclass("Timer", {
        initialize: function(time) {
            var that = this;

            this.time = time;
            this.untilTimeout = predicate(function() {
                return that.time > 0;
            }, {
                ctx: {
                    that: that
                }
            });
        },
        update: function(dt) {
            this.time -= dt;
        },
        reset: function(additionalDuration) {
            this.time = Math.max(this.time, 0) + additionalDuration;
        }
    });

    var PowerUp = Object.subclass("PowerUp", {
        initialize: function(duration) {
            this.duration = duration;
        },
        activate: function(tank) {
            this.getTarget(tank).each(function(target) {
                this.setupTimer(target);
            }, this);

        },
        getTarget: function(tank) {
            return [tank];
        },
        setupTimer: function(tank) {
            if(tank.powerUps[this.key]) {
                tank.powerUps[this.key].reset(this.duration);
            } else {
                var timer = new Timer(this.duration);
                timer.untilTimeout.activate(this.affect(tank));
                tank.powerUps[this.key] = timer;
            }
        }
    });

    PowerUp.Spring = PowerUp.subclass("PowerUp.Spring", {
        key: "spring",
        sheetIndex: [5],
        affect: function(tank) {
            return new Layer().refineObject(tank, {
                getBulletRicochets: function() {
                    return cop.proceed() + 1;
                }
            });
        }
    });
    PowerUp.Shield = PowerUp.subclass("PowerUp.Shield", {
        key: "shield",
        sheetIndex: [4],
        affect: function(tank) {
            return new Layer().refineObject(tank, {
                destroy: function() {}
            });
        }
    });
    PowerUp.Sticky = PowerUp.subclass("PowerUp.Sticky", {
        key: "sticky",
        sheetIndex: [27],
        getTarget: function(tank) {
            return tank.world.getGameObjects().filter(function(gameObject) {
                return gameObject.name == "tank" && gameObject !== tank;
            });
        },
        affect: function(tank) {
            return new Layer().refineObject(tank, {
                move: function() {}
            });
        }
    });

    var Collectible = GameObject.subclass("Collectible", {
        initialize: function($super, world, description) {
            var pos = Vector2.fromJson(description.position);
            $super(world, "powerup", pos, new Vector2(1.5, 1.5), 0.75, Vector2.Zero.copy(), 0);

            this.powerUp = new PowerUp[description.type](description.timeout);
            this.animation = new Animation(new AnimationSheet("powerups.png", 20, 20), 1.0, this.powerUp.sheetIndex);

            this.initConstraints();
        },
        initConstraints: function() {
            // assumption: powerups are inserted right after tanks into the world
            this.world.getGameObjects().each(function(other) {
                if(other.name != "tank") { return; }

                // constraint:
                // - get powerup by touching it
                this.onCollisionWith(other, function(that, tank) {
                    that.bestow(tank);
                    that.destroy();
                });
            }, this);
        },
        bestow: function(tank) {
            this.powerUp.activate(tank);
        }
    });

    return Collectible;
});
