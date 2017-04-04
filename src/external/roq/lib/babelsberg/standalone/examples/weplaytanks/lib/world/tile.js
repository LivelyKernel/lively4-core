define(["./../rendering/animationsheet"], function module(AnimationSheet) {
    return Object.subclass("Tile", {
        initialize: function(index) {
            this.index = index;
            this.spriteSheet = new AnimationSheet("tileset.png", 32, 32);
        },
        canWalkThrough: function() {
            return this.index == 0;
        },
        canFlyThrough: function() {
            return this.index != 1;
        },
        draw: function(renderer, x, y, size) {
            var min = new Vector2(x, y).mulVector(size);
            this.spriteSheet.draw(
                renderer,
                new AABB(min, min.add(size)),
                this.index
            );
        }
    });
});
