define(function moduleAnimation() {
    Object.subclass("Animation", {
        initialize: function(sheet, frameTime, order) {
            this.sheet = sheet;
            this.frameTime = frameTime;
            this.currentTime = 0;

            this.order = order;
            this.orderIndex = 0;
            this.tileNumber = this.order[this.orderIndex];
        },

        update: function(dt) {
            this.currentTime += dt;

            while(this.currentTime >= this.frameTime) {
                this.currentTime -= this.frameTime;
                this.orderIndex = (this.orderIndex + 1) % this.order.length;
                this.tileNumber = this.order[this.orderIndex];
            };
        },

        draw: function(renderer, targetAABB, angle) {
            this.sheet.draw(renderer, targetAABB, this.tileNumber, angle);
        }
    });

    return Animation;
});
