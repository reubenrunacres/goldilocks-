class DefeatScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'DefeatScene'
        });
    }

    init(data) {
        // Store which scene we came from for retry functionality
        this.fromScene = data.from || 'TitleScene';
        this.arenaName = this.getArenaName(this.fromScene);
    }

    create() {
        // Create background
        const { width, height } = this.sys.game.config;
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);
        
        // Create defeat title with fade-in effect
        this.defeatTitle = this.add.text(width / 2, height / 2 - 100, 'DEFEAT', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Create subtitle
        this.subtitle = this.add.text(width / 2, height / 2 - 20, `Press ENTER to Retry • ESC for Title`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Create arena info if available
        if (this.arenaName) {
            this.arenaInfo = this.add.text(width / 2, height / 2 + 40, this.arenaName, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5);
        }
        
        // Set initial alpha to 0 for fade-in effect
        this.defeatTitle.setAlpha(0);
        this.subtitle.setAlpha(0);
        if (this.arenaInfo) this.arenaInfo.setAlpha(0);
        
        // Fade-in effect (300ms)
        this.tweens.add({
            targets: [this.defeatTitle, this.subtitle, this.arenaInfo].filter(Boolean),
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        // Input handling
        this.input.keyboard.on('keydown-ENTER', () => {
            this.retryArena();
        });
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.goToTitle();
        });
        
        // Mouse click handling for text areas
        this.defeatTitle.setInteractive({ useHandCursor: true });
        this.subtitle.setInteractive({ useHandCursor: true });
        if (this.arenaInfo) this.arenaInfo.setInteractive({ useHandCursor: true });
        
        this.defeatTitle.on('pointerdown', () => {
            this.retryArena();
        });
        
        this.subtitle.on('pointerdown', () => {
            this.retryArena();
        });
        
        if (this.arenaInfo) {
            this.arenaInfo.on('pointerdown', () => {
                this.retryArena();
            });
        }
        
        console.log(`[SCENE] DefeatScene started from ${this.fromScene}`);
    }
    
    getArenaName(sceneKey) {
        switch (sceneKey) {
            case 'GameScene':
                return 'Arena 1';
            case 'Arena2Scene':
                return 'Arena 2';
            default:
                return null;
        }
    }
    
    retryArena() {
        console.log(`[DEFEAT] Retrying ${this.arenaName || 'arena'}`);
        
        // Clean up input listeners
        this.input.keyboard.removeAllListeners();
        
        // Start the arena scene we came from
        this.scene.start(this.fromScene);
    }
    
    goToTitle() {
        console.log('[DEFEAT] Returning to title');
        
        // Clean up input listeners
        this.input.keyboard.removeAllListeners();
        
        // Go to title scene
        this.scene.start('TitleScene');
    }
}
