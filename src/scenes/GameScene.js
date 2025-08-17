class GameScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameScene',
            physics: {
                arcade: {
                    gravity: { y: 300 },
                    debug: false
                }
            }
        });
    }

    preload() {
        this.load.image('banner', 'assets/sprites/Banner.png');
        this.load.image('champion', 'assets/sprites/Champion.png');
        this.load.image('bear', 'assets/sprites/Brown Bear.png');
    }

    create() {
        // Create arena background
        this.createArenaBackground();
        
        // Create arena floor
        this.createArenaFloor();
        
        // Enable physics system
        this.physics.world.setBounds(0, 0, this.sys.game.config.width, this.sys.game.config.height);
        
        // Add player
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
        
        // Input keys
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        
        // Player state
        this.isAttacking = false;
        this.attackHitbox = null;
        this.isBlocking = false;
        this.blockIndicator = null;
        this.facing = 'right';
        
        // Player attack cooldown
        this.playerAttackCooldown = false;
        this.playerAttackCooldownTime = 800; // 800ms cooldown
        
        // Player health system
        this.playerMaxHealth = 50;
        this.playerCurrentHealth = this.playerMaxHealth;
        this.playerIsDead = false;
        this.playerHitCooldown = false;
        
        // Player death state
        this.isDead = false;
        
        // Add bear
        this.bear = this.physics.add.sprite(this.sys.game.config.width * 0.78, this.sys.game.config.height * 0.5, 'bear');
        this.bear.setDisplaySize(this.sys.game.config.width * 0.108, this.sys.game.config.height * 0.216);
        this.bear.setOrigin(0.5, 1);
        this.bear.setCollideWorldBounds(true);
        this.bear.body.setGravityY(400);
        
        // Set bear body size and offset
        const bearBodyW = 35;
        const bearBodyH = 40;
        const bearOffsetX = 12;
        this.bear.body.setSize(bearBodyW, bearBodyH, false);
        this.bear.body.setOffset(bearOffsetX, this.bear.height - bearBodyH);
        
        // Bear properties
        this.bearSpeed = 80;
        this.bearFacing = 'left';
        this.bearIsAttacking = false;
        this.bearAttackCooldown = false;
        this.bearJumpCooldown = false;
        this.bearAttackHitbox = null;
        
        // Bear health system
        this.bearMaxHealth = 100;
        this.bearCurrentHealth = this.bearMaxHealth;
        this.bearIsDead = false;
        this.bearHitCooldown = false;
        
        // Add ground collision
        this.physics.add.collider(this.player, this.groundCollider);
        this.physics.add.collider(this.bear, this.groundCollider);
        
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
        if (Phaser.Input.Keyboard.JustDown(this.keyE) && !this.isAttacking && !this.isBlocking && !this.playerAttackCooldown) {
            this.performAttack();
        }
        
        // Player block
        if (this.keyQ.isDown && !this.isBlocking) {
            this.startBlocking();
        } else if (!this.keyQ.isDown && this.isBlocking) {
            this.stopBlocking();
        }
        
        // Bear AI
        this.updateBearAI();
    }

    performAttack() {
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
        
        // Add collision detection with a flag to prevent false hits
        this.attackHitbox.attackActive = true;
        this.physics.add.overlap(this.attackHitbox, this.bear, () => {
            if (this.attackHitbox && this.attackHitbox.attackActive && this.isAttacking) {
                this.handlePlayerAttackHit();
                this.attackHitbox.attackActive = false; // Prevent multiple hits
            }
        }, null, this);
        
        // Remove hitbox after 200ms
        this.time.delayedCall(200, () => {
            if (this.attackHitbox) {
                this.attackHitbox.destroy();
                this.attackHitbox = null;
            }
            this.isAttacking = false;
        });
        
        // Start attack cooldown
        this.playerAttackCooldown = true;
        this.time.delayedCall(this.playerAttackCooldownTime, () => {
            this.playerAttackCooldown = false;
        });
    }
    
    startBlocking() {
        this.isBlocking = true;
        this.blockSuccess = Math.random() < 0.45;
        
        const blockOffset = this.facing === 'right' ? this.player.displayWidth * 0.6 : -this.player.displayWidth * 0.6;
        const blockColor = this.blockSuccess ? 0x00ff00 : 0xff4444;
        
        this.blockIndicator = this.add.rectangle(
            this.player.x + blockOffset,
            this.player.y,
            this.player.displayWidth * 0.4,
            this.player.displayHeight * 0.8,
            blockColor,
            0
        );
    }
    
    stopBlocking() {
        this.isBlocking = false;
        
        if (this.blockIndicator) {
            this.blockIndicator.destroy();
            this.blockIndicator = null;
        }
    }
    
    updateBearAI() {
        // Don't do anything if player is dead
        if (this.bearIsDead || this.isDead) return;
        
        // Calculate distance to player
        const distanceToPlayer = this.player.x - this.bear.x;
        
        // Update bear facing direction
        if (distanceToPlayer > 0) {
            this.bearFacing = 'right';
        } else {
            this.bearFacing = 'left';
        }
        
        // Flip bear sprite
        if (this.bearFacing === 'left') {
            this.bear.setFlipX(true);
        } else if (this.bearFacing === 'right') {
            this.bear.setFlipX(false);
        }
        
        // Check if bear should jump (player is above and within range)
        const bearOnGround = this.bear.body.onFloor() || this.bear.body.blocked.down || this.bear.body.touching.down;
        const distanceToPlayerY = this.player.y - this.bear.y;
        const playerIsAbove = distanceToPlayerY < -30; // Player is 30+ pixels above bear
        const playerInHorizontalRange = Math.abs(distanceToPlayer) < 80;
        
        if (bearOnGround && playerIsAbove && playerInHorizontalRange && !this.bearJumpCooldown && !this.bearIsAttacking) {
            // Bear jumps to reach player above
            this.bear.setVelocityY(-450);
            
            // Add jump cooldown
            this.bearJumpCooldown = true;
            this.time.delayedCall(2000, () => {
                this.bearJumpCooldown = false;
            });
        }
        
        // Bear movement - follow player
        if (Math.abs(distanceToPlayer) > 20) {
            if (distanceToPlayer > 0) {
                this.bear.setVelocityX(this.bearSpeed);
            } else {
                this.bear.setVelocityX(-this.bearSpeed);
            }
        } else {
            this.bear.setVelocityX(0);
        }
        
        // Attack when close and not on cooldown (regardless of movement)
        if (Math.abs(distanceToPlayer) <= 40 && !this.bearAttackCooldown) {
            this.bearAttack();
        }
    }
    
    bearAttack() {
        // Don't attack if player is dead
        if (this.isDead) return;
        
        this.bearIsAttacking = true;
        this.bear.setVelocityX(0);
        
        // Flash red to show attack
        this.bear.setTint(0xff4444);
        
        // Clear tint after attack
        this.time.delayedCall(300, () => {
            this.bear.clearTint();
        });
        
        // After wind-up delay, create actual attack hitbox
        this.time.delayedCall(800, () => {
            if (!this.bearIsAttacking) return;
            
            // Create bear attack hitbox
            const attackOffset = this.bearFacing === 'right' ? this.bear.displayWidth * 0.6 : -this.bear.displayWidth * 0.6;
            this.bearAttackHitbox = this.physics.add.sprite(
                this.bear.x + attackOffset,
                this.bear.y,
                null
            );
            
            this.bearAttackHitbox.setDisplaySize(this.bear.displayWidth * 0.5, this.bear.displayHeight * 0.6);
            this.bearAttackHitbox.setVisible(false);
            this.bearAttackHitbox.body.setImmovable(true);
            
            // Add collision detection between bear attack and player
            this.physics.add.overlap(this.bearAttackHitbox, this.player, this.handleBearAttackHit, null, this);
            
            // Remove attack hitbox after 400ms
            this.time.delayedCall(400, () => {
                if (this.bearAttackHitbox) {
                    this.bearAttackHitbox.destroy();
                    this.bearAttackHitbox = null;
                }
                this.bearIsAttacking = false;
                
                // Start attack cooldown
                this.bearAttackCooldown = true;
                this.time.delayedCall(2500, () => {
                    this.bearAttackCooldown = false;
                });
            });
        });
    }
    
    handlePlayerAttackHit() {
        // Only process hit if player is actually attacking AND attack hitbox is active
        if (!this.isAttacking || !this.attackHitbox || !this.attackHitbox.attackActive) return;
        
        // Don't damage dead bear or if already hit recently
        if (this.bearIsDead || this.bearHitCooldown) return;
        
        // Prevent multiple hits from same attack
        this.bearHitCooldown = true;
        
        // Damage based on attack type (assuming light attack for now)
        const damage = 8;
        
        // Apply damage to bear
        this.bearCurrentHealth -= damage;
        
        console.log(`Bear takes ${damage} damage! Health: ${this.bearCurrentHealth}/${this.bearMaxHealth}`);
        
        // Check if bear dies
        if (this.bearCurrentHealth <= 0) {
            this.bearCurrentHealth = 0;
            this.bearDies();
        } else {
            // Flash bear red to show damage
            this.bear.setTint(0xff4444);
            this.time.delayedCall(150, () => {
                this.bear.clearTint();
            });
        }
        
        // Reset hit cooldown after 500ms
        this.time.delayedCall(500, () => {
            this.bearHitCooldown = false;
        });
    }
    
    handleBearAttackHit() {
        // Don't damage if player is dead or already hit recently
        if (this.playerIsDead || this.playerHitCooldown) return;
        
        // Prevent multiple hits from same attack
        this.playerHitCooldown = true;
        
        // Bear damage (bear is stronger than player)
        const baseDamage = 6;
        
        // Check if player is blocking successfully
        if (this.isBlocking && this.blockSuccess) {
            // Successful block - reduce damage by half
            const blockedDamage = Math.floor(baseDamage / 2);
            console.log('Bear attack blocked!');
            this.playerTakesDamage(blockedDamage, true);
        } else {
            // No block or failed block - full damage
            console.log('Bear attack hits player!');
            this.playerTakesDamage(baseDamage, false);
        }
        
        // Reset hit cooldown after a short delay
        this.time.delayedCall(500, () => {
            this.playerHitCooldown = false;
        });
    }
    
    playerTakesDamage(damage, wasBlocked) {
        // Don't damage dead player
        if (this.playerIsDead) return;
        
        // Apply damage to player
        this.playerCurrentHealth -= damage;
        
        console.log(`Player takes ${damage} damage${wasBlocked ? ' (blocked)' : ''}! Health: ${this.playerCurrentHealth}/${this.playerMaxHealth}`);
        
        // Check if player dies
        if (this.playerCurrentHealth <= 0) {
            this.playerCurrentHealth = 0;
            this.die();
            return;
        } else {
            // Flash player red to show damage
            this.player.setTint(0xff4444);
            
            // Remove red tint after 300ms
            this.time.delayedCall(300, () => {
                if (!this.playerIsDead) {
                    this.player.clearTint();
                }
            });
        }
    }
    
    playerDies() {
        console.log('Player defeated!');
        this.playerIsDead = true;
        this.isDead = true;
        
        // Call die method
        this.die();
        
        // Stop any ongoing actions
        this.isAttacking = false;
        this.isBlocking = false;
        this.playerHitCooldown = false;
        if (this.attackHitbox) {
            this.attackHitbox.destroy();
            this.attackHitbox = null;
        }
        if (this.blockIndicator) {
            this.blockIndicator.destroy();
            this.blockIndicator = null;
        }
        
        // Visual death effect
        this.player.setTint(0x666666);
        this.player.setVelocityX(0);
        
        // Show defeat message
        this.add.text(160, 60, 'Defeat!', {
            fontSize: '20px',
            fill: '#ff0000'
        }).setOrigin(0.5);
        
        this.add.text(160, 80, 'Press R to restart', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Add restart functionality
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart();
        });
    }
    
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.player.setVelocityX(0); // keep gravity so they land
        if (this.attackHitbox) {
            this.attackHitbox.setActive(false);
            this.attackHitbox.setVisible(false);
        }
        this.player.clearTint();
        // optional death anim here
    }
    
    bearDies() {
        console.log('Bear defeated!');
        this.bearIsDead = true;
        
        // Stop any ongoing attacks
        this.bearIsAttacking = false;
        if (this.bearAttackHitbox) {
            this.bearAttackHitbox.destroy();
            this.bearAttackHitbox = null;
        }
        
        // Clear any attack tinting
        this.bear.clearTint();
        
        // Visual death effect
        this.bear.setTint(0x666666);
        this.bear.setVelocityX(0);
        
        // Show victory message
        this.add.text(160, 60, 'Victory!', {
            fontSize: '20px',
            fill: '#00ff00'
        }).setOrigin(0.5);
        
        this.add.text(160, 80, 'Bear defeated!', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }
    
    createArenaBackground() {
        const W = Number(this.game.config.width);
        const H = Number(this.game.config.height);
        
        // Cream background
        this.arenaFar = this.add.rectangle(0, 0, W, H, 0xFFFEF7);
        this.arenaFar.setOrigin(0, 0);
        this.arenaFar.setDepth(-30);
        this.arenaFar.setScrollFactor(0);
        
        // Columns
        const columnWidth = Math.floor(W * 0.075);
        this.add.rectangle(Math.floor(W * 0.06), 0, columnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-20).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.06), 0, columnWidth, Math.floor(H * 0.09), 0xF7C843).setOrigin(0, 0).setDepth(-19).setScrollFactor(0);
        
        this.add.rectangle(Math.floor(W * 0.86), 0, columnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-20).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.86), 0, columnWidth, Math.floor(H * 0.09), 0xF7C843).setOrigin(0, 0).setDepth(-19).setScrollFactor(0);
        
        const centerColumnWidth = Math.floor(W * 0.0625);
        this.add.rectangle(Math.floor(W * 0.375), 0, centerColumnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-21).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.5625), 0, centerColumnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-21).setScrollFactor(0);
        
        // Baseboard
        const baseboardHeight = Math.floor(H * 0.11);
        this.add.rectangle(0, H - baseboardHeight, W, baseboardHeight, 0xD9D9D9).setOrigin(0, 0).setDepth(-10).setScrollFactor(0);
    }
    
    createArenaFloor() {
        const W = Number(this.game.config.width);
        const H = Number(this.game.config.height);
        
        // Create physics floor
        const floorY = H - 16;
        const floorHeight = 16;
        
        this.groundCollider = this.add.zone(W / 2, floorY + 15, W, 2);
        this.physics.add.existing(this.groundCollider, true);
        this.groundCollider.body.updateFromGameObject();
        
        // Visual floor
        this.add.rectangle(0, floorY, W, floorHeight, 0xF2F2F2).setOrigin(0, 0).setDepth(-5);
        
        // Carpet
        const carpetWidth = Math.floor(W * 0.4);
        const carpetHeight = Math.floor(floorHeight * 0.75);
        const carpetX = Math.floor((W - carpetWidth) / 2);
        const carpetY = floorY + Math.floor((floorHeight - carpetHeight) / 2);
        
        this.add.rectangle(carpetX, carpetY, carpetWidth, carpetHeight, 0xB6252B).setOrigin(0, 0).setDepth(-4);
        
        // Gold trim
        const trimWidth = Math.floor(carpetHeight * 0.25);
        this.add.rectangle(carpetX, carpetY, trimWidth, carpetHeight, 0xF7C843).setOrigin(0, 0).setDepth(-3);
        this.add.rectangle(carpetX + carpetWidth - trimWidth, carpetY, trimWidth, carpetHeight, 0xF7C843).setOrigin(0, 0).setDepth(-3);
    }
}
