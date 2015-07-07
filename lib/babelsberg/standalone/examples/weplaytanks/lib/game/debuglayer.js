define([
    "./../gameobject/gameobject",
    "./../gameobject/controls",
    "./../world/tile"
], function plugin(GameObject, Controls, Tile) {
    var DebugLayer = cop.create("DebugLayer")
        .refineClass(GameObject, {
            draw: function(renderer) {
                cop.proceed(renderer);
                renderer.drawLine(this.position, this.position.add(this.velocity), "red", 1, 3);
            }
        })
        .refineClass(Controls.CPU, {
            getTargetTiles: function() {
                var tiles = cop.proceed();

                tiles.each(function(tile) {
                    tile.marked = tile.canFlyThrough() ? this.color : "red";
                }, this);

                return tiles;
            }
        })
        .refineClass(Tile, {
            draw: function(renderer, x, y, size) {
                cop.proceed(renderer, x, y, size);
                if(this.marked) {
                    var min = new Vector2(x, y).mulVector(size);
                    renderer.drawRectangle(
                        min.add(size.mulFloat(0.5)),
                        25,
                        this.marked
                    );
                }
                this.marked = false;
            }
        });

    return DebugLayer;
});
