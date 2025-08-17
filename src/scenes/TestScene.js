class TestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TestScene' });
    }

    create() {
        // Basic scene with text to confirm it's working
        this.add.text(160, 90, 'Test Scene Working!', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(160, 120, 'Press SPACE for Second Scene', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(160, 140, 'Press G for Game Scene', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add Space key to switch to SecondScene
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('SecondScene');
        });
        
        // Add G key to switch to GameScene
        this.input.keyboard.on('keydown-G', () => {
            this.scene.start('GameScene');
        });
    }
}
