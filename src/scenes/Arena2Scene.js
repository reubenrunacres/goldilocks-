class Arena2Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Arena2Scene' });
    }
    
    preload() {
        // Preload banner sprite
        this.load.image('banner', 'assets/sprites/Banner.png');
    }
    
    create() {
        // Set background color similar to GameScene
        this.cameras.main.setBackgroundColor('#FFFEF7');
        
        // Get dimensions
        const W = Number(this.game.config.width);
        const H = Number(this.game.config.height);
        
        // Add basic arena background
        this.createArenaBackground();
        
        this.add.text(12, 12, 'Arena 2', { fontFamily: 'Press Start 2P', fontSize: '8px', color: '#000' });
        console.log('[SCENE] Arena2Scene started');
        
        // Add Enter key to go back to TitleScene
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('TitleScene');
        });
    }
    
    createArenaBackground() {
        // Similar to GameScene but simpler
        const W = Number(this.game.config.width);
        const H = Number(this.game.config.height);
        
        // Far layer: Cream background
        this.add.rectangle(0, 0, W, H, 0xFFFEF7).setOrigin(0, 0).setDepth(-30).setScrollFactor(0);
        
        // Left and right columns
        const columnWidth = Math.floor(W * 0.075);
        this.add.rectangle(Math.floor(W * 0.06), 0, columnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-20).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.06), 0, columnWidth, Math.floor(H * 0.09), 0xF7C843).setOrigin(0, 0).setDepth(-19).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.86), 0, columnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-20).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.86), 0, columnWidth, Math.floor(H * 0.09), 0xF7C843).setOrigin(0, 0).setDepth(-19).setScrollFactor(0);
        
        // Add banners instead of center column rectangles
        this.createBanners();
        
        // Floor
        const baseboardHeight = Math.floor(H * 0.11);
        this.add.rectangle(0, H - baseboardHeight, W, baseboardHeight, 0xD9D9D9).setOrigin(0, 0).setDepth(-10).setScrollFactor(0);
    }
    
    createBanners() {
        const W = Number(this.game.config.width);
        const H = Number(this.game.config.height);
        
        // Banner configuration
        const bannerWidth = Math.floor(W * 0.1);
        const bannerHeight = Math.floor(H * 0.5);
        const bannerTop = Math.floor(H * 0.11);
        
        // Banner positions
        const bannerPositions = [
            { x: Math.floor(W * 0.22), y: bannerTop },
            { x: Math.floor(W * 0.47), y: bannerTop },
            { x: Math.floor(W * 0.73), y: bannerTop }
        ];
        
        bannerPositions.forEach((pos, index) => {
            // Create banner sprite
            const banner = this.add.image(pos.x, pos.y, 'banner');
            
            // Set origin to top-center
            banner.setOrigin(0.5, 0);
            
            // Scale the banner
            const scale = 0.8; // Thinner
            banner.setScale(scale, 1.2); // Thinner width, slightly longer height
            
            // Position banner in center of its bay with margin
            banner.x = pos.x + bannerWidth / 2 - 25; // Shifted left like in GameScene
            banner.y = pos.y + 6; // Small top margin
            
            // Set properties
            banner.setDepth(-5);
            banner.setScrollFactor(0);
            
            console.log(`Arena2 Banner ${index + 1} created at position:`, banner.x, banner.y);
        });
    }
}

window.Arena2Scene = Arena2Scene; // if we're using global classes (no imports)
