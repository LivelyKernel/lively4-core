define(["./../gameobject/tank", "./../world/world"], function plugin(Tank, World) {
    var OneBulletPerFrameLayer = cop.create("OneBulletPerFrameLayer")
        .refineClass(Tank, {
            fireBullet: function(world, dt) {
                if(OneBulletPerFrameLayer.bulletShot) {
                    return;
                }
                OneBulletPerFrameLayer.bulletShot = true;
                return cop.proceed(world, dt);
            }
        })
        .refineClass(World, {
            update: function(dt) {
                OneBulletPerFrameLayer.bulletShot = false;

                return cop.proceed(dt);
            }
        })
        .beGlobal();

    return OneBulletPerFrameLayer;
});
