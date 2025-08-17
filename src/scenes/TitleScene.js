class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // Set background to black
        this.cameras.main.setBackgroundColor('#000000');
        
        // Get logical game dimensions
        const centerX = this.sys.game.config.width / 2;  // 320 / 2 = 160
        const centerY = this.sys.game.config.height / 2; // 180 / 2 = 90
        
        // Game title - large and centered
        this.add.text(centerX, centerY - 20, 'The Goldilocks Game', {
            fontSize: '32px',
            fill: '#FFD700', // Gold color for the title
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Subtitle or tagline
        this.add.text(centerX, centerY + 10, 'A Tale of Bears and Champions', {
            fontSize: '12px',
            fill: '#ffffff',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Start instruction
        this.add.text(centerX, centerY + 40, 'Press ENTER to start', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Add some flavor text
        this.add.text(centerX, centerY + 60, 'Enter the arena and face your destiny!', {
            fontSize: '10px',
            fill: '#888888'
        }).setOrigin(0.5);
        
        // Route keys from TitleScene to the arenas
        this.input.keyboard.once('keydown-ENTER', () => {
            console.log('Title → GameScene (Arena 1)');
            this.scene.start('GameScene');
        });

        // DEV shortcuts (helpful while wiring):
        this.input.keyboard.on('keydown-ONE', () => this.scene.start('GameScene'));   // 1
        this.input.keyboard.on('keydown-TWO', () => this.scene.start('Arena2Scene')); // 2
        
        // Update on-screen instructions
        this.add.text(centerX, centerY + 75, '[DEV: 1=Arena1, 2=Arena2]', {
            fontSize: '8px',
            fill: '#444444'
        }).setOrigin(0.5);
    }
}
