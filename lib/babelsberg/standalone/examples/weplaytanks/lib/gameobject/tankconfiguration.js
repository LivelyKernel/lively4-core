define(["./controls", "./tank", "./bullet"], function TankConfig(Controls, Tank, Bullet) {
    var TankConfig = Object.subclass("TankConfig", {});
    Object.extend(TankConfig, {
        Player: {
            speed: Tank.SPEED_NORMAL,
            bullets: 3,
            bulletRicochets: 1,
            intelligence: Controls.Player,
            bulletSpeed: Bullet.SPEED_NORMAL
        },
        Yellow: {
            speed: Tank.SPEED_IMMOBILE,
            bullets: 1,
            bulletRicochets: 1,
            intelligence: Controls.CPU.Yellow,
            bulletSpeed: Bullet.SPEED_NORMAL
        },
        Red: {
            speed: Tank.SPEED_SLOW,
            bullets: 2,
            bulletRicochets: 1,
            intelligence: Controls.CPU.Red,
            bulletSpeed: Bullet.SPEED_NORMAL
        },
        Blue: {
            speed: Tank.SPEED_SLOW,
            bullets: 1,
            bulletRicochets: 0,
            intelligence: Controls.CPU.Blue,
            bulletSpeed: Bullet.SPEED_FAST
        }
    });

    return TankConfig;
});
