define(["./tile"], function WorldBuilder(Tile) {
    return Object.subclass("Map", {
        initialize: function(tileSize, tiles) {
            this.tileSize = tileSize;
            this.tiles = _.map(tiles, function(stripe) {
                return _.map(stripe, function(tileIndex) {
                    return new Tile(tileIndex);
                });
            });
            this.size = new Vector2(this.tiles[0].length, this.tiles.length);
        },

        draw: function(renderer) {
            _.each(this.tiles, function(stripe, y) {
                _.each(stripe, function(tile, x) {
                    tile.draw(renderer, x, y, this.tileSize);
                }, this);
            }, this);
        },

        get: function(coords) {
            return this.tiles[coords.y][coords.x];
        },

        positionToCoordinates: function(pos) {
            return pos
                .divVector(this.tileSize)
                .floor();
        },

        coordinatesToPosition: function(coords) {
            return this.tiles[coords.y][coords.x];
        }
    });
});
