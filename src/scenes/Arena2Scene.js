class Arena2Scene extends Phaser.Scene {
    constructor() {
        super({
            key: 'Arena2Scene',
            physics: {
                arcade: {
                    gravity: { y: 300 },
                    debug: false
                }
            }
        });
    }
    
    preload() {
        // Preload banner sprite
        this.load.image('banner', 'assets/sprites/Banner.png');
        
        // Preload champion sprite (required for player)
        this.load.image('champion', 'assets/sprites/Champion.png');
        
        // Preload black bear asset with safe fallback
        this.load.image('bearBlack', 'assets/sprites/Black Bear.png');
        
        // Also preload brown bear as fallback
        this.load.image('bearBrown', 'assets/sprites/Brown Bear.png');
        
        // Log which bear keys are available
        console.log('Available bear keys: bearBlack, bearBrown');
    }
    
    create() {
        // Set background color similar to GameScene
        this.cameras.main.setBackgroundColor('#FFFEF7');
        
        // Get dimensions
        const W = Number(this.game.config.width);
        const H = Number(this.game.config.height);
        
        // Create physics floor (identical to Arena 1)
        const floorY = H - 16;
        this.groundCollider = this.add.zone(W / 2, floorY + 15, W, 2);
        this.physics.add.existing(this.groundCollider, true);
        this.groundCollider.body.updateFromGameObject();
        
        // Build background
        this.createArenaBackground();
        
        // Spawn champion (player) - IDENTICAL to Arena 1
        this.player = this.physics.add.sprite(this.sys.game.config.width * 0.5, this.sys.game.config.height * 0.5, 'champion');
        this.player.setDisplaySize(this.sys.game.config.width * 0.05, this.sys.game.config.height * 0.18);
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);
        this.player.body.setAllowGravity(true);
        this.player.body.moves = true;
        this.player.setImmovable(false);
        
        // Set higher gravity for faster falling
        this.player.body.setGravityY(400);
        
        // Set player body size and offset
        const championBodyW = 18;
        const championBodyH = 30;
        const championOffsetX = 7;
        this.player.body.setSize(championBodyW, championBodyH, false);
        this.player.body.setOffset(championOffsetX, this.player.height - championBodyH);
        
        // Input keys (identical to Arena 1)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        
        // Player state (identical to Arena 1)
        this.isAttacking = false;
        this.attackHitbox = null;
        this.isBlocking = false;
        this.blockIndicator = null;
        this.facing = 'right';
        
        // Player attack cooldown (identical to Arena 1)
        this.playerAttackCooldown = false;
        this.playerAttackCooldownTime = 800; // 800ms cooldown
        
        // Player health system (identical to Arena 1)
        this.playerMaxHealth = 50;
        this.playerCurrentHealth = this.playerMaxHealth;
        this.playerIsDead = false;
        this.playerHitCooldown = false;
        
        // Player death state (identical to Arena 1)
        this.isDead = false;
        
        // Add ground collision (identical to Arena 1)
        this.physics.add.collider(this.player, this.groundCollider);
        
        console.log('[SCENE] Arena2Scene started with champion spawn');
        
        // Add Enter key to go back to TitleScene
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('TitleScene');
        });
    }

    update() {
        // Early return if player is dead
        if (this.isDead) return;
        
        // Update facing direction
        if (this.keyA.isDown && !this.keyD.isDown) {
            this.facing = 'left';
        } else if (this.keyD.isDown && !this.keyA.isDown) {
            this.facing = 'right';
        }
        
        // Flip player sprite
        if (this.facing === 'left') {
            this.player.setFlipX(true);
        } else if (this.facing === 'right') {
            this.player.setFlipX(false);
        }
        
        // Player movement
        if (this.keyA.isDown) {
            this.player.setVelocityX(-180);
        } else if (this.keyD.isDown) {
            this.player.setVelocityX(180);
        } else {
            this.player.setVelocityX(0);
        }
        
        // Player jump
        const onGround = this.player.body.onFloor() || this.player.body.blocked.down || this.player.body.touching.down;
        if (this.keySpace.isDown && onGround) {
            this.player.setVelocityY(-550);
        }
        
        // Player attack
        if (Phaser.Input.Keyboard.JustDown(this.keyE) && !this.isAttacking && !this.isBlocking && !this.playerAttackCooldown && !this.isDead) {
            this.performAttack();
        }
        
        // Player block
        if (this.keyQ.isDown && !this.isBlocking) {
            this.startBlocking();
        } else if (!this.keyQ.isDown && this.isBlocking) {
            this.stopBlocking();
        }
    }

    performAttack() {
        // Safety check - don't attack if already attacking or dead
        if (this.isAttacking || this.isDead) return;
        
        this.isAttacking = true;
        
        // Create attack hitbox
        const hitboxOffset = this.facing === 'right' ? this.player.displayWidth * 0.8 : -this.player.displayWidth * 0.8;
        this.attackHitbox = this.physics.add.sprite(
            this.player.x + hitboxOffset,
            this.player.y,
            null
        );
        this.attackHitbox.setDisplaySize(this.player.displayWidth * 0.6, this.player.displayHeight * 0.5);
        this.attackHitbox.setVisible(false);
        this.attackHitbox.body.setImmovable(true);
        
        // Remove hitbox after 200ms
        this.time.delayedCall(200, () => {
            if (this.attackHitbox) {
                this.attackHitbox.destroy();
                this.attackHitbox = null;
            }
            this.isAttacking = false;
        });
    }

    startBlocking() {
        this.isBlocking = true;
        // Create block indicator (simple visual feedback)
        this.blockIndicator = this.add.rectangle(
            this.player.x, 
            this.player.y, 
            this.player.displayWidth * 1.2, 
            this.player.displayHeight * 1.2, 
            0x00ff00, 
            0.3
        ).setDepth(10);
    }

    stopBlocking() {
        this.isBlocking = false;
        if (this.blockIndicator) {
            this.blockIndicator.destroy();
            this.blockIndicator = null;
        }
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
        this.add.rectangle(Math.floor(W * 0.06), 0, columnWidth, Math.floor(H * 0.12), 0xF7C843).setOrigin(0, 0).setDepth(-19).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.86), 0, columnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-20).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.86), 0, columnWidth, Math.floor(H * 0.12), 0xF7C843).setOrigin(0, 0).setDepth(-19).setScrollFactor(0);
        
        // Two middle columns (no gaps)
        const middleColumnWidth = Math.floor(W * 0.0625);
        this.add.rectangle(Math.round(this.scale.width * 0.33), 0, middleColumnWidth, H, 0xF2F2F2).setOrigin(0.5, 0).setDepth(-21).setScrollFactor(0);
        this.add.rectangle(Math.round(this.scale.width * 0.66), 0, middleColumnWidth, H, 0xF2F2F2).setOrigin(0.5, 0).setDepth(-21).setScrollFactor(0);
        
        // Add banners instead of center column rectangles
        this.createBanners();
        
        // Floor
        const baseboardHeight = Math.floor(H * 0.11);
        this.add.rectangle(0, H - baseboardHeight, W, baseboardHeight, 0xD9D9D9).setOrigin(0, 0).setDepth(-10).setScrollFactor(0);
        
        // Visual floor (identical to Arena 1)
        const floorY = H - 16;
        const floorHeight = 16;
        this.add.rectangle(0, floorY, W, floorHeight, 0xF2F2F2).setOrigin(0, 0).setDepth(-5).setScrollFactor(0);
        
        // Carpet (identical to Arena 1)
        const carpetWidth = Math.floor(W * 0.4);
        const carpetHeight = Math.floor(floorHeight * 0.75);
        const carpetX = Math.floor((W - carpetWidth) / 2);
        const carpetY = floorY + Math.floor((floorHeight - carpetHeight) / 2);
        
        this.add.rectangle(carpetX, carpetY, carpetWidth, carpetHeight, 0xB6252B).setOrigin(0, 0).setDepth(-4).setScrollFactor(0);
        
        // Gold trim
        const trimWidth = Math.floor(carpetHeight * 0.25);
        this.add.rectangle(carpetX, carpetY, trimWidth, carpetHeight, 0xF7C843).setOrigin(0, 0).setDepth(-3).setScrollFactor(0);
        this.add.rectangle(carpetX + carpetWidth - trimWidth, carpetY, trimWidth, carpetHeight, 0xF7C843).setOrigin(0, 0).setDepth(-3).setScrollFactor(0);
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
