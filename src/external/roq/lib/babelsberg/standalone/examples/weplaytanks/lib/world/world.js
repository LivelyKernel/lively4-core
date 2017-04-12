define(["./tile", "./../levels/levels"], function WorldBuilder(Tile, Levels) {
    // TODO: extract levelpointer
    Object.subclass("LevelPointer", {
        initialize: function() {
            this.reset();
        },
        reset: function() {
            this.currentLevel = 0;
        },
        get: function() {
            return Levels[this.currentLevel];
        },
        next: function() {
            this.currentLevel++;
            return this.get();
        }
    });

    Object.subclass("World", {
        initialize: function() {
            this.gameObjects = [];
        },

        update: function(dt) {
            this.gameObjects.forEach(function(gameObject) {
                gameObject.update(dt);
            });
        },

        draw: function(renderer) {
            this.map.draw(renderer);

            this.gameObjects.forEach(function(gameObject) {
                gameObject.draw(renderer);
            });
        },

        spawn: function(gameObject) { this.gameObjects.push(gameObject); },
        getGameObjects: function() { return this.gameObjects; },
        remove: function(gameObject) { this.gameObjects.remove(gameObject); }
    });

    return World;
});
