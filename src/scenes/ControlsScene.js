class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ControlsScene' });
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#FFFEF7');
        
        // Get dimensions
        const W = this.scale.width;
        const H = this.scale.height;
        
        // Title
        this.add.text(W / 2, H * 0.2, 'HOW TO PLAY', {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#2c3e50',
            align: 'center'
        }).setOrigin(0.5);
        
        // Controls section
        const controlsY = H * 0.4;
        const controls = [
            { key: 'A', action: 'Move Left' },
            { key: 'D', action: 'Move Right' },
            { key: 'SPACE', action: 'Jump' },
            { key: 'E', action: 'Attack' },
            { key: 'Q', action: 'Block' }
        ];
        
        controls.forEach((control, index) => {
            const y = controlsY + (index * 40);
            
            // Key binding
            this.add.text(W * 0.35, y, control.key, {
                fontFamily: 'monospace',
                fontSize: '24px',
                color: '#e74c3c',
                align: 'right'
            }).setOrigin(1, 0.5);
            
            // Action description
            this.add.text(W * 0.4, y, `- ${control.action}`, {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#2c3e50',
                align: 'left'
            }).setOrigin(0, 0.5);
        });
        
        // Instructions
        this.add.text(W / 2, H * 0.7, 'Defeat the bear to progress to the next arena!', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#7f8c8d',
            align: 'center'
        }).setOrigin(0.5);
        
        // Press ENTER prompt
        this.add.text(W / 2, H * 0.85, 'Press ENTER to Start', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#27ae60',
            align: 'center'
        }).setOrigin(0.5);
        
        // Add ENTER key functionality
        this.input.keyboard.on('keydown-ENTER', () => {
            console.log('Starting game from controls screen');
            this.scene.start('GameScene');
        });
        
        // Also allow clicking anywhere to start
        this.input.on('pointerdown', () => {
            console.log('Starting game from mouse click');
            this.scene.start('GameScene');
        });
        
        console.log('[SCENE] ControlsScene started');
    }
}

// Make it globally available
window.ControlsScene = ControlsScene;
