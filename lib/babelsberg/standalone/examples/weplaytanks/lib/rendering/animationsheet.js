define(function moduleAnimationSheet() {
    var AnimationSheet = Object.subclass("AnimationSheet", {
        initialize: function(path, frameWidth, frameHeight) {
            this.image = Image[path];
            this.frameWidth = frameWidth;
            this.frameHeight = frameHeight;
        },

        draw: function(renderer, aabb, tileNumber, angle) {
            var tilesPerRow = Math.floor(this.image.width / this.frameWidth);
            var sourceX = this.frameWidth * (tileNumber % tilesPerRow);
            var sourceY = this.frameHeight * Math.floor(tileNumber / tilesPerRow);
            renderer.drawImageOnWorldAABB(
                this.image,
                aabb,
                sourceX,
                sourceY,
                this.frameWidth,
                this.frameHeight,
                angle || 0
            );
        }
    });

    return AnimationSheet;
});
