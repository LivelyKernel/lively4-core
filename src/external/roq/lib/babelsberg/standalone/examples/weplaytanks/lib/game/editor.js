define([
    "./../rendering/animation",
    "./../rendering/animationsheet"
], function Editor(
    Animation,
    AnimationSheet
) {

    return Object.subclass("Editor", {
        initialize: function(game) {
            this.game = game;
            this.tileIndex = Vector2.Zero.copy();
            this.animation = new Animation(new AnimationSheet("powerups.png", 20, 20), 0.25, [21, 22, 23, 22]);

            var input = game.input,
                map = game.world.map
                that = this;

            EditorLayer
                .activeOn({
                    ctx: {
                        input: input
                    }
                }, function() {
                    return input.switchedOn("pause");
                }).predicate(function() {
                     return input.pressed("leftclick");
                }, {
                    ctx: {
                        input: input
                    }
                }).trigger(this.modifyTileType.bind(this));

            EditorLayer.predicate(function() {
               return that.tileIndex.equals(map.positionToCoordinates(input.position));
            }, {
                ctx: {
                    input: input,
                    map: map,
                    that: that
                }
            }).always({
                solver: new DBPlanner()
            });
        },

        update: function(dt) {
            this.animation.update(dt);
        },

        draw: function(renderer) {
            var map = this.game.world.map,
                size = map.tileSize,
                min = this.tileIndex.mulVector(size),
                max = min.add(size);

            this.animation.draw(renderer, new AABB(min, max));
        },

        modifyTileType: function() {
            if(this.tileIndex.x <= 0 || this.tileIndex.x >= 17) return;
            if(this.tileIndex.y <= 0 || this.tileIndex.y >= 18) return;

            var map = this.game.world.map,
                tile = map.get(this.tileIndex);
            tile.index = (tile.index + 1) % 3;
        }
    });
});
