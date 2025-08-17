const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 180,
    backgroundColor: '#000000',
    pixelArt: true,
    antialias: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    scene: [TitleScene, GameScene, Arena2Scene] // TitleScene must be first
};

const game = new Phaser.Game(config);



