define(["./../game/game"], function plugin(Game) {
    var AdjustViewportManuallyLayer = cop.create("AdjustViewportManuallyLayer")
        .refineClass(Game, {
            initialize: function(canvasId) {
                cop.proceed(canvasId);

                this.downPoint = Vector2.Zero.copy();
                this.lastPoint = Vector2.Zero.copy();
            },
            update: function(dt) {
                if(this.input.pressed("leftclick")) {
                    this.downPoint.set(this.input.mouse);
                }
                if(this.input.pressed("rightclick")) {
                    this.lastPoint.set(this.input.mouse);
                }
                // viewport manipulation
                if(this.input.state("rightclick")) {
                    this.viewport.translateBy(this.canvas, this.lastPoint.sub(this.input.mouse));
                    this.lastPoint.set(this.input.mouse);
                }
                if(this.input.state("zoomIn")) {
                    this.viewport.zoomIn();
                }
                if(this.input.state("zoomOut")) {
                    this.viewport.zoomOut();
                }

                cop.proceed(dt);
            }
        })
        .beGlobal();

    return AdjustViewportManuallyLayer;
});
