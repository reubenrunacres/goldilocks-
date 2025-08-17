class GameScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameScene',
            physics: {
                arcade: {
                    gravity: { y: 300 }, // Add gravity - 300 pixels/second²
                    debug: false
                }
            }
        });
    }

    preload() {
        this.load.image('banner', 'assets/sprites/Banner.png');
        this.load.image('champion', 'assets/sprites/Champion.png');
        this.load.image('bear', 'assets/sprites/Brown Bear.png'); // note the space
    }

    create() {
        // Create arena background layers first
        this.createArenaBackground();
        
        // Create arena floor and carpet
        this.createArenaFloor();
        
        // Enable physics system - use game config dimensions (logical size, not scaled)
        this.physics.world.setBounds(0, 0, this.sys.game.config.width, this.sys.game.config.height);
        
        // Pixel rounding for crisp alignment
        this.physics.world.setBoundsCollision(true, true, true, true);
        if (this.game.config.roundPixels !== undefined) {
            this.game.config.roundPixels = true;
        }
        this.cameras.main.setRoundPixels(true); // Prevent subpixel gaps
        
        // T1h-3: Final pixel rounding guard
        this.time.delayedCall(50, () => {
            const ok = Math.abs(this.player.body.bottom - this.groundCollider.body.top) <= 1 &&
                      Math.abs(this.bear.body.bottom - this.groundCollider.body.top) <= 1;
            console.log('ACCEPT T1h-3 ground check', ok, {
                pB: this.player.body.bottom, 
                bB: this.bear.body.bottom, 
                gT: this.groundCollider.body.top
            });
        });
        
        // Add player as physics sprite (spawn above ground, let gravity handle landing)
        this.player = this.physics.add.sprite(this.sys.game.config.width * 0.5, this.sys.game.config.height * 0.5, 'champion');
        this.player.setDisplaySize(this.sys.game.config.width * 0.05, this.sys.game.config.height * 0.18); // 5% width, 18% height (keeping same ratio, smaller overall)
        this.player.setOrigin(0.5, 1); // Bottom-aligned origin (visual only)
        
        // Enable collision with world bounds (prevents falling through ground)
        this.player.setCollideWorldBounds(true);
        
        // Ensure proper physics flags for movement
        this.player.body.setAllowGravity(true);
        this.player.body.moves = true;
        this.player.setImmovable(false);
        
        // Set higher gravity for faster falling
        this.player.body.setGravityY(200); // Additional gravity on top of world gravity (300 + 200 = 500 total)
        
        // Set champion body size and offset (bottom-aligned)
        const championBodyW = 18;
        const championBodyH = 30;
        const championOffsetX = 7;
        this.player.body.setSize(championBodyW, championBodyH, false);
        this.player.body.setOffset(championOffsetX, this.player.height - championBodyH);
        
        // Instructions removed for clean arena

        // Create cursor keys for input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Add A, D, SPACE, E, and Q keys
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        
        // Attack state and hitbox
        this.isAttacking = false;
        this.attackHitbox = null;
        
        // Block state
        this.isBlocking = false;
        this.blockIndicator = null;
        this.blockSuccess = false; // Will be calculated when blocking is tested
        
        // Facing direction
        this.facing = 'right';
        
        // Player health system
        this.playerMaxHealth = 60; // Player has less health than bear but can block
        this.playerCurrentHealth = this.playerMaxHealth;
        this.playerIsDead = false;
        this.playerHitCooldown = false; // Prevent multiple hits from same bear attack
        
        // Add bear enemy with physics
        this.bear = this.physics.add.sprite(this.sys.game.config.width * 0.78, this.sys.game.config.height * 0.5, 'bear');
        this.bear.setDisplaySize(this.sys.game.config.width * 0.108, this.sys.game.config.height * 0.216); // 10.8% width, 21.6% height (10% smaller bear)
        this.bear.setOrigin(0.5, 1); // Bottom-aligned origin (visual only)
        this.bear.setCollideWorldBounds(true);
        this.bear.body.setGravityY(200); // Same additional gravity as player
        
        // Set bear body size and offset (bottom-aligned, similar to champion)
        const bearBodyW = 35;
        const bearBodyH = 40;
        const bearOffsetX = 12;
        this.bear.body.setSize(bearBodyW, bearBodyH, false);
        this.bear.body.setOffset(bearOffsetX, this.bear.height - bearBodyH);
        
        // Bear AI properties
        this.bearSpeed = 80; // Slower than player (180)
        this.bearFacing = 'left'; // Bear starts facing left toward player
        this.bearIsAttacking = false;
        this.bearAttackCooldown = false;
        this.bearAttackHitbox = null;
        this.bearJumpCooldown = false;
        
        // Bear health system
        this.bearMaxHealth = 100; // Takes ~12 light attacks or 7 heavy attacks to kill
        this.bearCurrentHealth = this.bearMaxHealth;
        this.bearIsDead = false;
        this.bearHitCooldown = false; // Prevent multiple hits per attack
        
        // Add collision between player/bear and thin ground line (created in createArenaFloor)
        this.physics.add.collider(this.player, this.groundCollider);
        this.physics.add.collider(this.bear, this.groundCollider);
        
        console.log('ACCEPT T1h-1 ground lowered 15px below floor to eliminate floating');
        
        console.log('ACCEPT T1h-2 body aligned to display size');
        
        // Debug visual guide removed (was causing visible red line)
        
        // T1f: Lock ground alignment and controls
        const DEBUG = false; // Set to false for production
        
        // Runtime state verification
        console.assert(this.player.body.moves === true, 'Player movement disabled');
        console.assert(this.bear.body.moves === true, 'Bear movement disabled'); 
        console.assert(this.physics.world.isPaused === false, 'Physics world paused');
        console.assert(this.groundCollider.body.isStatic === true, 'Ground not static');
        
        // Visual debug removed
        
        // Delayed alignment check
        this.time.delayedCall(50, () => {
            const ok = Math.abs(this.player.body.bottom - this.groundCollider.body.top) <= 1 &&
                      Math.abs(this.bear.body.bottom - this.groundCollider.body.top) <= 1;
            console.log('ACCEPT T1f ground locked', ok);
            
            if (DEBUG) {
                console.log('[T1f-debug]', {
                    playerBottom: this.player.body.bottom,
                    bearBottom: this.bear.body.bottom, 
                    groundTop: this.groundCollider.body.top,
                    playerDiff: Math.abs(this.player.body.bottom - this.groundCollider.body.top),
                    bearDiff: Math.abs(this.bear.body.bottom - this.groundCollider.body.top)
                });
            }
        });
        
        // No automatic collision damage - bear must actively attack
        // this.physics.add.overlap(this.player, this.bear, this.handleBearPlayerCollision, null, this);

        // Add Enter key to go back to TitleScene
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('TitleScene');
        });
        
        // Logs to check texture loading status
        console.log('[tex] banner:', this.textures.exists('banner'));
        console.log('[tex] champion:', this.textures.exists('champion'));
        console.log('[tex] bear:', this.textures.exists('bear'));
        
        // T1a Acceptance check
        console.log('ACCEPT T1a movement restored - Champion physics enabled, colliders active');
    }

    update() {
        // T1f: Ground alignment now locked, old debug logs removed
        
        // Don't process input if player is dead
        if (this.playerIsDead) {
            this.player.setVelocityX(0);
            return;
        }
        
        // Update facing direction
        if (this.keyA.isDown && !this.keyD.isDown) {
            this.facing = 'left';
        } else if (this.keyD.isDown && !this.keyA.isDown) {
            this.facing = 'right';
        }
        // If both or neither are held, keep the last value
        
        // Flip player sprite to face the direction of movement
        if (this.facing === 'left') {
            this.player.setFlipX(true);
        } else if (this.facing === 'right') {
            this.player.setFlipX(false);
        }
        
        // A key movement (left) - using physics velocity
        if (this.keyA.isDown) {
            this.player.setVelocityX(-180); // Move left at 180 pixels/second (faster for larger size)
        }
        // D key movement (right) - using physics velocity
        else if (this.keyD.isDown) {
            this.player.setVelocityX(180); // Move right at 180 pixels/second (faster for larger size)
        }
        // Stop horizontal movement when no keys pressed
        else {
            this.player.setVelocityX(0);
        }
        
        // Space key jump - robust ground check using physics body
        const onGround = this.player.body.onFloor() || this.player.body.blocked.down || this.player.body.touching.down;
        
        if (this.keySpace.isDown && onGround) {
            this.player.setVelocityY(-550); // Jump upward at 550 pixels/second (higher for larger size)
            console.log('Jump triggered!'); // Debug log
        }
        
        // E key attack (context-sensitive: heavy when stationary, light when moving)
        // Cannot attack while blocking or if dead
        if (Phaser.Input.Keyboard.JustDown(this.keyE) && !this.isAttacking && !this.isBlocking && !this.playerIsDead) {
            this.performContextAttack();
        }
        
        // Q key block (can't block if dead)
        if (this.keyQ.isDown && !this.isBlocking && !this.playerIsDead) {
            this.startBlocking();
        } else if (!this.keyQ.isDown && this.isBlocking) {
            this.stopBlocking();
        }
        
        // Bear AI movement
        this.updateBearAI();
    }

    performContextAttack() {
        // Check if player is stationary (not moving and on ground)
        const onGround = this.player.body.onFloor() || this.player.body.blocked.down || this.player.body.touching.down;
        const isStationary = Math.abs(this.player.body.velocity.x) < 5 && onGround;
        
        if (isStationary) {
            this.performHeavyAttack();
        } else {
            this.performLightAttack();
        }
    }
    
    performLightAttack() {
        // Set attack state
        this.isAttacking = true;
        
        // Create light attack hitbox (small, red) - scaled to player size
        const hitboxOffset = this.facing === 'right' ? this.player.displayWidth * 0.8 : -this.player.displayWidth * 0.8;
        this.attackHitbox = this.physics.add.sprite(
            this.player.x + hitboxOffset,
            this.player.y,
            null
        );
        this.attackHitbox.setDisplaySize(this.player.displayWidth * 0.6, this.player.displayHeight * 0.5);
        this.attackHitbox.setTint(0xff0000); // red color
        this.attackHitbox.body.setImmovable(true); // Don't move when hitting things
        
        // Add collision detection between attack and bear
        this.physics.add.overlap(this.attackHitbox, this.bear, () => this.handlePlayerAttackHit('light'), null, this);
        
        console.log('Light attack!');
        
        // Remove hitbox after 200ms (fast)
        this.time.delayedCall(200, () => {
            if (this.attackHitbox) {
                this.attackHitbox.destroy();
                this.attackHitbox = null;
            }
            this.isAttacking = false;
        });
    }
    
    performHeavyAttack() {
        // Set attack state
        this.isAttacking = true;
        
        // Create heavy attack hitbox (larger, orange) - scaled to player size
        const hitboxOffset = this.facing === 'right' ? this.player.displayWidth * 1.0 : -this.player.displayWidth * 1.0;
        this.attackHitbox = this.physics.add.sprite(
            this.player.x + hitboxOffset,
            this.player.y,
            null
        );
        this.attackHitbox.setDisplaySize(this.player.displayWidth * 0.9, this.player.displayHeight * 0.7);
        this.attackHitbox.setTint(0xff8800); // orange color
        this.attackHitbox.body.setImmovable(true); // Don't move when hitting things
        
        // Add collision detection between attack and bear
        this.physics.add.overlap(this.attackHitbox, this.bear, () => this.handlePlayerAttackHit('heavy'), null, this);
        
        console.log('Heavy attack!');
        
        // Remove hitbox after 400ms (slower)
        this.time.delayedCall(400, () => {
            if (this.attackHitbox) {
                this.attackHitbox.destroy();
                this.attackHitbox = null;
            }
            this.isAttacking = false;
        });
    }
    
    startBlocking() {
        this.isBlocking = true;
        
        // Roll for block success (45% chance)
        this.blockSuccess = Math.random() < 0.45;
        
        // Create block indicator - color indicates success/failure, scaled to player size
        const blockOffset = this.facing === 'right' ? this.player.displayWidth * 0.6 : -this.player.displayWidth * 0.6;
        const blockColor = this.blockSuccess ? 0x00ff00 : 0xff4444; // Green if success, red if failure
        
        this.blockIndicator = this.add.rectangle(
            this.player.x + blockOffset,
            this.player.y,
            this.player.displayWidth * 0.4, // 40% of player width
            this.player.displayHeight * 0.8, // 80% of player height
            blockColor
        );
        
        console.log(this.blockSuccess ? 'Blocking successfully!' : 'Block failed!');
    }
    
    stopBlocking() {
        this.isBlocking = false;
        
        if (this.blockIndicator) {
            this.blockIndicator.destroy();
            this.blockIndicator = null;
        }
        
        console.log('Stopped blocking');
    }
    
    updateBearAI() {
        // Don't do anything if bear is dead
        if (this.bearIsDead) {
            this.bear.setVelocityX(0);
            return;
        }
        
        // Calculate distance to player
        const distanceToPlayer = this.player.x - this.bear.x;
        const distanceToPlayerY = this.player.y - this.bear.y;
        const attackRange = 40; // Range where bear can attack
        const chaseRange = 60; // Range where bear will chase
        
        // Update bear facing direction
        if (distanceToPlayer > 0) {
            this.bearFacing = 'right';
        } else {
            this.bearFacing = 'left';
        }
        
        // Flip bear sprite to face the direction it's facing
        if (this.bearFacing === 'left') {
            this.bear.setFlipX(true);
        } else if (this.bearFacing === 'right') {
            this.bear.setFlipX(false);
        }
        
        // Check if bear should jump (player is above and within range)
        const bearOnGround = this.bear.body.onFloor() || this.bear.body.blocked.down || this.bear.body.touching.down;
        const playerIsAbove = distanceToPlayerY < -30; // Player is 30+ pixels above bear
        const playerInHorizontalRange = Math.abs(distanceToPlayer) < 80;
        
        if (bearOnGround && playerIsAbove && playerInHorizontalRange && !this.bearJumpCooldown && !this.bearIsAttacking) {
            // Bear jumps to reach player
            this.bear.setVelocityY(-450); // Jump upward (slightly less than player)
            console.log('Bear jumps!');
            
            // Add jump cooldown
            this.bearJumpCooldown = true;
            this.time.delayedCall(2000, () => {
                this.bearJumpCooldown = false;
            });
        }
        
        // Bear AI behavior
        if (Math.abs(distanceToPlayer) <= attackRange && !this.bearIsAttacking && !this.bearAttackCooldown) {
            // Close enough to attack and not already attacking
            this.bearAttack();
        } else if (Math.abs(distanceToPlayer) > chaseRange && !this.bearIsAttacking) {
            // Too far, chase the player
            if (distanceToPlayer > 0) {
                this.bear.setVelocityX(this.bearSpeed);
            } else {
                this.bear.setVelocityX(-this.bearSpeed);
            }
        } else if (!this.bearIsAttacking) {
            // In range but not attacking, stop moving
            this.bear.setVelocityX(0);
        }
    }
    
    bearAttack() {
        // Check if bear is stationary (like player's context attacks)
        const bearWasMoving = Math.abs(this.bear.body.velocity.x) > 5;
        const isHeavyAttack = !bearWasMoving; // Heavy if stationary, light if moving
        
        // Bear performs an attack with wind-up
        this.bearIsAttacking = true;
        this.bear.setVelocityX(0); // Stop moving during attack
        
        console.log(`Bear prepares ${isHeavyAttack ? 'heavy' : 'light'} attack...`);
        
        // Wind-up phase - bear flashes to telegraph attack (different colors for attack type)
        this.bear.setTint(isHeavyAttack ? 0xffaaaa : 0xffcccc); // Darker red for heavy, lighter for light
        
        // After wind-up delay, create actual attack hitbox
        this.time.delayedCall(800, () => {
            if (!this.bearIsAttacking) return; // Check if attack was cancelled
            
            console.log(`Bear ${isHeavyAttack ? 'heavy' : 'light'} attacks!`);
            this.bear.setTint(0x8B4513); // Back to normal color
            
            // Create bear attack hitbox - size depends on attack type
            const attackOffset = this.bearFacing === 'right' ? this.bear.displayWidth * 0.6 : -this.bear.displayWidth * 0.6;
            this.bearAttackHitbox = this.physics.add.sprite(
                this.bear.x + attackOffset,
                this.bear.y,
                null
            );
            
            // Heavy attacks have larger hitboxes
            if (isHeavyAttack) {
                this.bearAttackHitbox.setDisplaySize(this.bear.displayWidth * 0.7, this.bear.displayHeight * 0.8);
                this.bearAttackHitbox.setTint(0xff3333); // Dark red for heavy
            } else {
                this.bearAttackHitbox.setDisplaySize(this.bear.displayWidth * 0.5, this.bear.displayHeight * 0.6);
                this.bearAttackHitbox.setTint(0xff6666); // Light red for light
            }
            
            this.bearAttackHitbox.body.setImmovable(true);
            
            // Store attack type for damage calculation
            this.bearAttackType = isHeavyAttack ? 'heavy' : 'light';
            
            // Add collision detection between bear attack and player
            this.physics.add.overlap(this.bearAttackHitbox, this.player, this.handleBearAttackHit, null, this);
            
            // Remove attack hitbox after 400ms
            this.time.delayedCall(400, () => {
                if (this.bearAttackHitbox) {
                    this.bearAttackHitbox.destroy();
                    this.bearAttackHitbox = null;
                }
                this.bearIsAttacking = false;
                
                // Start attack cooldown (longer cooldown)
                this.bearAttackCooldown = true;
                this.time.delayedCall(2500, () => {
                    this.bearAttackCooldown = false;
                });
            });
        });
    }
    
    handleBearAttackHit() {
        // Don't damage if player is dead or already hit recently
        if (this.playerIsDead || this.playerHitCooldown) return;
        
        // Prevent multiple hits from same attack
        this.playerHitCooldown = true;
        
        // Determine damage based on bear attack type (bear is stronger than player)
        const isHeavyAttack = this.bearAttackType === 'heavy';
        const baseDamage = isHeavyAttack ? 12 : 6; // Heavy: 12, Light: 6 (balanced for 60 HP)
        
        // Check if player is blocking successfully
        if (this.isBlocking && this.blockSuccess) {
            // Successful block - reduce damage by half
            const blockedDamage = Math.floor(baseDamage / 2);
            console.log(`Bear ${isHeavyAttack ? 'heavy' : 'light'} attack blocked!`);
            this.playerTakesDamage(blockedDamage, true);
        } else {
            // No block or failed block - full damage
            console.log(`Bear ${isHeavyAttack ? 'heavy' : 'light'} attack hits player!`);
            this.playerTakesDamage(baseDamage, false);
        }
        
        // Add knockback - stronger for heavy attacks
        const knockbackForce = isHeavyAttack ? 250 : 200;
        if (this.player.x < this.bear.x) {
            // Player is to the left, push left
            this.player.setVelocityX(-knockbackForce);
        } else {
            // Player is to the right, push right
            this.player.setVelocityX(knockbackForce);
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
            this.playerDies();
        } else {
            // Flash player red to show damage
            this.player.setTint(0xff4444); // Lighter red tint (more visible)
            
            // Remove red tint after 300ms (longer to be more visible)
            this.time.delayedCall(300, () => {
                if (!this.playerIsDead) {
                    this.player.setTint(0x414141); // Back to normal grey
                }
            });
        }
    }
    
    playerDies() {
        console.log('Player defeated!');
        this.playerIsDead = true;
        
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
        this.player.setTint(0x666666); // Grey out the player
        this.player.setVelocityX(0); // Stop movement
        
        // Show defeat message
        this.add.text(160, 60, 'Defeat!', {
            fontSize: '20px',
            fill: '#ff0000'
        }).setOrigin(0.5);
        
        this.add.text(160, 80, 'Player defeated!', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(160, 100, 'Press R to restart', {
            fontSize: '10px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Add restart functionality
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart();
        });
    }
    
    handlePlayerAttackHit(attackType) {
        // Don't damage dead bear or if already hit recently
        if (this.bearIsDead || this.bearHitCooldown) return;
        
        // Prevent multiple hits from same attack
        this.bearHitCooldown = true;
        
        // Damage based on attack type
        const damage = attackType === 'heavy' ? 15 : 8;
        
        // Apply damage to bear
        this.bearCurrentHealth -= damage;
        
        console.log(`Bear takes ${damage} damage from ${attackType} attack! Health: ${this.bearCurrentHealth}/${this.bearMaxHealth}`);
        
        // Check if bear dies
        if (this.bearCurrentHealth <= 0) {
            this.bearCurrentHealth = 0;
            this.bearDies();
        } else {
            // Flash bear red to show damage
            this.bear.setTint(0xff4444); // Lighter red tint
            
            // Remove red tint after 300ms
            this.time.delayedCall(300, () => {
                if (!this.bearIsDead) {
                    this.bear.setTint(0x8B4513); // Back to normal brown
                }
            });
        }
        
        // Reset hit cooldown after 500ms (longer than attack duration)
        this.time.delayedCall(500, () => {
            this.bearHitCooldown = false;
        });
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
        
        // Visual death effect
        this.bear.setTint(0x666666); // Grey out the bear
        this.bear.setVelocityX(0); // Stop movement
        
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
        // Defensive line to avoid accidental use
        this.bannerRects = [];
        
        // A1: Layered arena background (static elements only)
        // Use logical game dimensions
        const W = Number(this.game.config.width);
        const H = Number(this.game.config.height);
        
        // Far layer: Cream background (full logical screen)
        this.arenaFar = this.add.rectangle(0, 0, W, H, 0xFFFEF7);
        this.arenaFar.setOrigin(0, 0);
        this.arenaFar.setDepth(-30);
        this.arenaFar.setScrollFactor(0);
        
        // Mid layer: White columns and window frames
        // Left column (proportional to screen width)
        const columnWidth = Math.floor(W * 0.075); // ~24px at 320px width
        this.add.rectangle(Math.floor(W * 0.06), 0, columnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-20).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.06), 0, columnWidth, Math.floor(H * 0.09), 0xF7C843).setOrigin(0, 0).setDepth(-19).setScrollFactor(0); // Gold capital
        
        // Right column  
        this.add.rectangle(Math.floor(W * 0.86), 0, columnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-20).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.86), 0, columnWidth, Math.floor(H * 0.09), 0xF7C843).setOrigin(0, 0).setDepth(-19).setScrollFactor(0); // Gold capital
        
        // Center columns (background)
        const centerColumnWidth = Math.floor(W * 0.0625); // ~20px at 320px width
        this.add.rectangle(Math.floor(W * 0.375), 0, centerColumnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-21).setScrollFactor(0);
        this.add.rectangle(Math.floor(W * 0.5625), 0, centerColumnWidth, H, 0xF2F2F2).setOrigin(0, 0).setDepth(-21).setScrollFactor(0);
        
        // Near layer: Baseboard shadow line (spans full width at bottom)
        const baseboardHeight = Math.floor(H * 0.11); // ~20px at 180px height
        this.add.rectangle(0, H - baseboardHeight, W, baseboardHeight, 0xD9D9D9).setOrigin(0, 0).setDepth(-10).setScrollFactor(0);
        
        console.log(`Arena background layers created for ${W}x${H} logical size`);
    }
    
    createArenaFloor() {
        // A2: Build floor + carpet collision
        // Use logical game dimensions
        const W = Number(this.game.config.width);
        const H = Number(this.game.config.height);
        
        // Create physics floor at y=164 (16px from bottom for 320x180)
        const floorY = H - 16; // 164 for standard 180px height
        const floorHeight = 16;
        
        // Create thin invisible ground line for physics (2px thick, positioned below visible floor to eliminate floating)
        this.groundCollider = this.add.zone(W / 2, floorY + 15, W, 2);
        this.physics.add.existing(this.groundCollider, true); // true => static body
        this.groundCollider.body.updateFromGameObject(); // Ensure physics body matches position
        
        // Visual marble floor (spans full width)
        this.add.rectangle(0, floorY, W, floorHeight, 0xF2F2F2).setOrigin(0, 0).setDepth(-5);
        
        // Red carpet strip (centered, with proportional sizing)
        const carpetWidth = Math.floor(W * 0.4); // 40% of screen width
        const carpetHeight = Math.floor(floorHeight * 0.75); // 75% of floor height
        const carpetX = Math.floor((W - carpetWidth) / 2); // Centered
        const carpetY = floorY + Math.floor((floorHeight - carpetHeight) / 2); // Centered vertically
        
        // Main red carpet
        this.add.rectangle(carpetX, carpetY, carpetWidth, carpetHeight, 0xB6252B).setOrigin(0, 0).setDepth(-4);
        
        // Gold trim on carpet edges
        const trimWidth = Math.floor(carpetHeight * 0.25); // Proportional trim width
        
        // Left gold trim
        this.add.rectangle(carpetX, carpetY, trimWidth, carpetHeight, 0xF7C843).setOrigin(0, 0).setDepth(-3);
        
        // Right gold trim  
        this.add.rectangle(carpetX + carpetWidth - trimWidth, carpetY, trimWidth, carpetHeight, 0xF7C843).setOrigin(0, 0).setDepth(-3);
        
        console.log(`Arena floor created at y=${floorY} with carpet ${carpetWidth}x${carpetHeight}`);
    }
}
