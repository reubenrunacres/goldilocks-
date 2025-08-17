class SecondScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SecondScene' });
    }

    create() {
        // Basic scene with text to confirm scene switching works
        this.add.text(160, 90, 'Second Scene Working!', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(160, 120, 'Press ENTER to go back', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add Enter key to switch back to TitleScene
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('TitleScene');
        });
    }
}
