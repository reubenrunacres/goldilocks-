class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ControlsScene' });
    }

    create() {
        // Reset keyboard state to avoid stale input
        this.input.keyboard.resetKeys();
        
        // Set background color
        this.cameras.main.setBackgroundColor('#FFFEF7');
        
        // Get dimensions
        const W = this.scale.width;
        const H = this.scale.height;
        
        // Big title "Controls"
        this.add.text(W / 2, H * 0.2, 'CONTROLS', {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#2c3e50',
            align: 'center'
        }).setOrigin(0.5);
        
        // Control lines
        const controls = [
            'Move: A / D',
            'Jump: SPACE', 
            'Attack: E',
            'Block: Q'
        ];
        
        const startY = H * 0.4;
        controls.forEach((control, index) => {
            this.add.text(W / 2, startY + (index * 30), control, {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#34495e',
                align: 'center'
            }).setOrigin(0.5);
        });
        
        // Footer: "Press ENTER to begin"
        this.add.text(W / 2, H * 0.8, 'Press ENTER to begin', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#27ae60',
            align: 'center'
        }).setOrigin(0.5);
        
        // ONE-SHOT key handler
        this.input.keyboard.once('keydown-ENTER', () => {
            // Clear any lingering input, then:
            this.input.keyboard.removeAllListeners();
            this.scene.start('GameScene');
        });
        
        console.log('[SCENE] ControlsScene started');
    }

    shutdown() {
        // Remove all listeners
        this.input.keyboard.removeAllListeners();
    }
}

// Make it globally available
window.ControlsScene = ControlsScene;
