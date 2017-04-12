require([
    // TODO: remove unused dependencies
    "./base/loop",
    "./rendering/loadimage",
    "./game/loadlevel",
    "./game/game",
    "./plugins/pluginloader"
], function main(
    Loop,
    loadImage,
    loadLevel,
    Game,
    PluginLoader
) {
    var canvasId = "game",
        game = new Game(canvasId);

    // prepare stats
    var stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    // main loop
    var loop = new Loop(function(dt) {
        stats.update();
        game.update(dt);
    });

    // asset loading
    queue()
        .defer(loadLevel, 'game/0_tutorial.json')
        .defer(loadLevel, 'game/1_movingtank.json')
        .defer(loadLevel, 'demo/2_twotanks.json')
        .defer(loadLevel, 'demo/3_singlehunter.json')
        .defer(loadLevel, 'demo/7_demo.json')
        .defer(loadLevel, 'game/5_borderline.json')
        .defer(loadLevel, 'game/6_hunter2.json')
        .defer(loadLevel, 'game/2_multipletanks.json')
        .defer(loadLevel, 'game/3_grid.json')
        .defer(loadLevel, 'game/4_hunter.json')

        .defer(loadImage, "tileset.png")
        .defer(loadImage, "tank.png")
        .defer(loadImage, "turret.png")
        .defer(loadImage, "bullet.png")
        .defer(loadImage, "target.png")
        .defer(loadImage, "powerups.png")

        .await(function(error) {
            if(error) {
                console.error("error while loading", error);
            } else {
                game.prepare();
                loop.start();
            }
        });
});
