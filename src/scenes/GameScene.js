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
        // Reset keyboard state to avoid stale input
        this.input.keyboard.resetKeys();
        
        // Reset game state
        this.isGameOver = false;
        
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
        this.isGameOver = false; // Add game over flag
        
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
        this.bearSpeed = 140; // Brown bear move speed
        this.bearFacing = 'left';
        this.bearIsAttacking = false;
        this.bearAttackCooldown = false;
        this.bearJumpCooldown = false;
        this.bearAttackHitbox = null;
        
        // Bear AI parameters
        this.aggroRadius = 420; // Distance at which bear becomes aggressive
        this.attackRange = 88; // Distance at which bear can attack
        this.attackCooldown = 900; // Brown bear attack cooldown in ms
        this.reactionTime = 150; // Anti-cheese: short delay before attacking
        
        // New close-quarters AI parameters
        this.AGGRO_RADIUS = 420;
        this.ATTACK_RANGE = 88;
        this.PUNISH_RADIUS = 64;      // inside this, force a quick punish
        this.STANDOFF_DIST = 72;      // distance the bear prefers to keep when not attacking
        this.COOLDOWN_MS = 900;       // brown bear cooldown
        this.REACTION_MS = 150;
        
        // Retreat loop fix parameters
        this.STANDOFF_HYST = 16;          // exit margin; chase resumes once dist > STANDOFF_DIST + HYST
        this.RETREAT_COOLDOWN_MS = 900;   // min time between retreats so we don't chain it
        this.RETREAT_DURATION_MS = 220;   // retreat window; timebox
        this.ADVANCE_DOT_THRESH = 0.35;   // only retreat if player is moving toward bear
        this.WALL_PROXIMITY = 32;         // do not retreat if a wall is behind the bear
        
        // State tracking for new AI
        this.bearState = 'IDLE';      // IDLE, AGGRO, PROXIMITY, ATTACK, REPOSITION
        this.lastDamagedAt = 0;       // timestamp of last damage
        this.repositionEndTime = 0;   // when reposition state ends
        this.proximityAttackCooldown = false;
        
        // Retreat loop fix state tracking
        this.lastRetreatAt = 0;       // timestamp of last retreat
        this.retreatStartTime = 0;    // when current retreat started
        this.playerLastPos = { x: 0, y: 0 }; // player position 1 frame ago
        this.playerVelocity = { x: 0, y: 0 }; // computed player velocity
        this.proximityLockoutEnd = 0; // timestamp when proximity lockout ends
        
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
        // Early return if player is dead or game is over
        if (this.isDead || this.isGameOver) return;
        
        // Track player position for velocity calculation
        this.playerLastPos.x = this.player.x;
        this.playerLastPos.y = this.player.y;
        
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
        
        // Bear AI
        this.updateBearAI();
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
        
        // Add collision detection with a flag to prevent false hits
        this.attackHitbox.attackActive = true;
        this.attackHitbox.attackId = Date.now(); // Unique identifier for this attack
        
        // Use a one-time collision that gets removed after use
        this.physics.add.overlap(this.attackHitbox, this.bear, () => {
            if (this.attackHitbox && this.attackHitbox.attackActive && this.isAttacking && this.attackHitbox.attackId) {
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
        // Don't do anything if player is dead or game is over
        if (this.bearIsDead || this.isDead || this.isGameOver) return;
        
        // Calculate distance to player (always check distance, not velocity)
        const distanceToPlayer = Math.abs(this.player.x - this.bear.x);
        const currentTime = Date.now();
        
        // Update bear facing direction
        if (this.player.x > this.bear.x) {
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
        const playerInHorizontalRange = distanceToPlayer < 80;
        
        if (bearOnGround && playerIsAbove && playerInHorizontalRange && !this.bearJumpCooldown && !this.bearIsAttacking) {
            // Bear jumps to reach player above
            this.bear.setVelocityY(-450);
            
            // Add jump cooldown
            this.bearJumpCooldown = true;
            this.time.delayedCall(2000, () => {
                this.bearJumpCooldown = false;
            });
        }
        
        // Check if player is advancing toward bear
        const playerAdvancing = this.isPlayerAdvancingTowardBear();
        const wallBehind = this.isWallBehindBear();
        const proximityLockoutActive = currentTime < this.proximityLockoutEnd;
        
        // State machine for bear AI with retreat loop fix
        if (distanceToPlayer <= this.PUNISH_RADIUS) {
            // Player is very close - force proximity attack or reposition
            if (!this.proximityAttackCooldown && !this.bearIsAttacking && !proximityLockoutActive) {
                // Log state transition
                if (this.bearState !== 'PROXIMITY') {
                    console.log('BEAR: ENTER_PROXIMITY');
                    this.bearState = 'PROXIMITY';
                }
                
                // Trigger immediate proximity attack
                this.proximityAttack();
            } else if (distanceToPlayer < this.STANDOFF_DIST && this.bearState !== 'REPOSITION' && !proximityLockoutActive) {
                // Check if retreat conditions are met
                const canRetreat = !this.bearAttackCooldown && // cooldown NOT elapsed
                                   playerAdvancing && // player is advancing toward bear
                                   !wallBehind && // NOT near wall behind bear
                                   (this.lastRetreatAt === 0 || (currentTime - this.lastRetreatAt) > this.RETREAT_COOLDOWN_MS); // retreat cooldown elapsed
                
                if (canRetreat) {
                    // Enter reposition state
                    console.log('BEAR: ENTER_REPOSITION (advancing, no wall, cooldown elapsed)');
                    this.bearState = 'REPOSITION';
                    this.retreatStartTime = currentTime;
                    this.lastRetreatAt = currentTime;
                    
                    // Move away from player at 1.2x speed, clamped to arena bounds
                    const repositionSpeed = this.bearSpeed * 1.2;
                    let newX = this.bear.x;
                    
                    if (this.bearFacing === 'right') {
                        newX = Math.max(0, this.bear.x - repositionSpeed * 0.016); // 0.016 = 1/60 for 60fps
                    } else {
                        newX = Math.min(this.sys.game.config.width, this.bear.x + repositionSpeed * 0.016);
                    }
                    
                    this.bear.setVelocityX(this.bearFacing === 'right' ? -repositionSpeed : repositionSpeed);
                }
            }
        } else if (distanceToPlayer <= this.ATTACK_RANGE) {
            // Player is in attack range
            if (!this.bearAttackCooldown && !this.bearIsAttacking) {
                // Check for counterattack if recently damaged
                const wasRecentlyDamaged = (currentTime - this.lastDamagedAt) < 250;
                if (wasRecentlyDamaged) {
                    // Anti-stunlock: queue counterattack for next frame after cooldown
                    this.time.delayedCall(1, () => {
                        if (!this.bearAttackCooldown && !this.bearIsAttacking) {
                            this.bearAttack();
                        }
                    });
                } else {
                    // Normal attack with reaction time (attack preempts retreat)
                    if (this.bearState !== 'ATTACK') {
                        console.log('BEAR: ENTER_ATTACK');
                        this.bearState = 'ATTACK';
                    }
                    
                    this.bear.setVelocityX(0); // Stop moving to attack
                    this.time.delayedCall(this.REACTION_MS, () => {
                        if (!this.bearAttackCooldown && !this.bearIsAttacking) {
                            this.bearAttack();
                        }
                    });
                }
            }
        } else if (distanceToPlayer <= this.AGGRO_RADIUS) {
            // Player is in aggro range but not attack range - chase
            if (this.bearState !== 'AGGRO') {
                console.log('BEAR: ENTER_AGGRO');
                this.bearState = 'AGGRO';
            }
            
            // Move towards player
            if (this.bearFacing === 'right') {
                this.bear.setVelocityX(this.bearSpeed);
            } else {
                this.bear.setVelocityX(-this.bearSpeed);
            }
        } else {
            // Player is outside aggro range - return to idle
            if (this.bearState !== 'IDLE') {
                console.log('BEAR: ENTER_IDLE');
                this.bearState = 'IDLE';
            }
            this.bear.setVelocityX(0);
        }
        
        // Handle reposition state exit conditions
        if (this.bearState === 'REPOSITION') {
            const retreatDurationElapsed = (currentTime - this.retreatStartTime) >= this.RETREAT_DURATION_MS;
            const distanceExceeded = distanceToPlayer > (this.STANDOFF_DIST + this.STANDOFF_HYST);
            const cooldownElapsed = !this.bearAttackCooldown;
            const playerStoppedAdvancing = !playerAdvancing;
            const wallDetected = wallBehind;
            
            if (distanceExceeded || retreatDurationElapsed || cooldownElapsed || playerStoppedAdvancing || wallDetected) {
                let exitReason = 'unknown';
                if (distanceExceeded) exitReason = 'distance exceeded';
                else if (retreatDurationElapsed) exitReason = 'timeboxed';
                else if (cooldownElapsed) exitReason = 'cooldown elapsed';
                else if (playerStoppedAdvancing) exitReason = 'player stopped advancing';
                else if (wallDetected) exitReason = 'wall detected';
                
                console.log(`BEAR: EXIT_REPOSITION (${exitReason})`);
                this.bearState = 'IDLE';
                this.bear.setVelocityX(0);
            }
        }
    }
    
    bearAttack() {
        // Don't attack if player is dead
        if (this.isDead) return;
        
        this.bearIsAttacking = true;
        this.bear.setVelocityX(0);
        
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
                this.time.delayedCall(this.attackCooldown, () => {
                    this.bearAttackCooldown = false;
                });
            });
        });
        
        // Reset attacking state after wind-up phase (even if attack is cancelled)
        this.time.delayedCall(1200, () => {
            if (this.bearIsAttacking) {
                this.bearIsAttacking = false;
            }
        });
    }
    
    proximityAttack() {
        // Don't attack if player is dead
        if (this.isDead) return;
        
        this.bearIsAttacking = true;
        this.bear.setVelocityX(0);
        
        // Create immediate proximity attack hitbox (minimal windup)
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
        this.physics.add.overlap(this.bearAttackHitbox, this.player, this.handleProximityAttackHit, null, this);
        
        // Remove attack hitbox after 200ms (faster than regular attack)
        this.time.delayedCall(200, () => {
            if (this.bearAttackHitbox) {
                this.bearAttackHitbox.destroy();
                this.bearAttackHitbox = null;
            }
            this.bearIsAttacking = false;
            
            // Start proximity attack cooldown
            this.proximityAttackCooldown = true;
            this.time.delayedCall(this.COOLDOWN_MS, () => {
                this.proximityAttackCooldown = false;
            });
            
            // Add 300ms lockout to prevent immediate retreat
            this.proximityLockoutEnd = Date.now() + 300;
        });
    }
    
    handleProximityAttackHit() {
        // Don't damage if player is dead or already hit recently
        if (this.playerIsDead || this.playerHitCooldown) return;
        
        // Prevent multiple hits from same attack
        this.playerHitCooldown = true;
        
        // Proximity attack damage (same as regular attack)
        const damage = 6;
        
        // Apply damage to player
        this.playerCurrentHealth -= damage;
        
        console.log(`Player takes ${damage} damage from proximity attack! Health: ${this.playerCurrentHealth}/${this.playerMaxHealth}`);
        
        // Apply knockback to create space (120-180px/s for 150ms)
        const knockbackSpeed = 150;
        const knockbackDirection = this.bearFacing === 'right' ? 1 : -1;
        this.player.setVelocityX(knockbackSpeed * knockbackDirection);
        
        // Reset knockback after 150ms
        this.time.delayedCall(150, () => {
            if (!this.playerIsDead) {
                this.player.setVelocityX(0);
            }
        });
        
        // Check if player dies
        if (this.playerCurrentHealth <= 0) {
            this.playerCurrentHealth = 0;
            this.playerDies();
        } else {
            // Flash player red to show damage
            this.player.setTint(0xff4444);
            this.time.delayedCall(150, () => {
                if (!this.playerIsDead) {
                    this.player.clearTint();
                }
            });
        }
        
        // Reset hit cooldown after 500ms
        this.time.delayedCall(500, () => {
            this.playerHitCooldown = false;
        });
    }
    
    handlePlayerAttackHit() {
        // Only process hit if player is actually attacking AND attack hitbox is active AND has valid attack ID
        if (!this.isAttacking || !this.attackHitbox || !this.attackHitbox.attackActive || !this.attackHitbox.attackId) return;
        
        // Don't damage dead bear or if already hit recently
        if (this.bearIsDead || this.bearHitCooldown) return;
        
        // Prevent multiple hits from same attack
        this.bearHitCooldown = true;
        
        // Track when bear was damaged for anti-stunlock
        this.lastDamagedAt = Date.now();
        
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
                if (!this.bearIsDead) {
                    this.bear.clearTint();
                }
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
        this.isGameOver = true; // Add game over flag
        
        // Call die method
        this.die();
        
        // Stop any ongoing actions
        this.isAttacking = false;
        this.isBlocking = false;
        this.playerHitCooldown = false;
        this.playerAttackCooldown = false;
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
        
        // Stop bear AI updates
        this.bear.setVelocityX(0);
        
        // After brief death animation, transition to defeat scene
        this.time.delayedCall(600, () => {
            this.scene.start('DefeatScene', { from: 'GameScene' });
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
    
    showVictoryOverlay() {
        if (this.victoryUI) { this.victoryUI.destroy(true); }
        const cam = this.cameras.main;
        const cx = cam.width / 2;
        const cy = cam.height / 2;

        // UI container above gameplay; fixed to screen
        this.victoryUI = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);

        // soft dim background
        const dim = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.35).setInteractive();
        // main label
        const title = this.add.text(cx, cy - 8, 'VICTORY!', {
            fontFamily: 'monospace',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // sub label
        const press = this.add.text(cx, cy + 24, 'Press ENTER', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffd200'
        }).setOrigin(0.5);

        this.victoryUI.add([dim, title, press]);
        
        // Ensure input still works even if physics paused:
        this.input.keyboard.enabled = true;
        // Remove any prior ENTER listeners:
        this.input.keyboard.off('keydown-ENTER');
        // One-shot continue to Arena2Scene
        this.input.keyboard.once('keydown-ENTER', () => {
            this.input.keyboard.removeAllListeners();
            // Clean shutdown
            this.scene.stop('GameScene');
            this.scene.start('Arena2Scene');
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
        
        // Clear any attack tinting
        this.bear.clearTint();
        
        // Visual death effect
        this.bear.setTint(0x666666);
        this.bear.setVelocityX(0);
        
        // Show centered victory overlay
        this.showVictoryOverlay();
        
        // Pause physics after callback returns to prevent deadlocks
        this.time.delayedCall(0, () => {
            this.physics.world.pause();
        });
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

    shutdown() {
        // Remove all listeners
        this.input.keyboard.removeAllListeners();
    }

    isWallBehindBear() {
        // Check if there's a wall behind the bear within WALL_PROXIMITY
        const checkDistance = this.WALL_PROXIMITY;
        const checkX = this.bear.x + (this.bearFacing === 'right' ? -checkDistance : checkDistance);
        
        // Check if the position is outside arena bounds or collides with world bounds
        if (checkX <= 0 || checkX >= this.sys.game.config.width) {
            return true; // Wall detected (arena boundary)
        }
        
        // For now, assume no internal walls - can be enhanced later
        return false;
    }
    
    isPlayerAdvancingTowardBear() {
        // Compute player velocity and check if advancing toward bear
        if (this.playerLastPos.x === 0 && this.playerLastPos.y === 0) {
            // First frame, can't determine velocity yet
            return false;
        }
        
        // Calculate player velocity
        this.playerVelocity.x = this.player.x - this.playerLastPos.x;
        this.playerVelocity.y = this.player.y - this.playerLastPos.y;
        
        // If player is not moving, they're not advancing
        if (Math.abs(this.playerVelocity.x) < 1 && Math.abs(this.playerVelocity.y) < 1) {
            return false;
        }
        
        // Calculate direction from player to bear
        const dirToBear = {
            x: this.bear.x - this.player.x,
            y: this.bear.y - this.player.y
        };
        
        // Normalize direction to bear
        const distToBear = Math.sqrt(dirToBear.x * dirToBear.x + dirToBear.y * dirToBear.y);
        if (distToBear === 0) return false;
        
        const normalizedDirToBear = {
            x: dirToBear.x / distToBear,
            y: dirToBear.y / distToBear
        };
        
        // Normalize player velocity
        const playerSpeed = Math.sqrt(this.playerVelocity.x * this.playerVelocity.x + this.playerVelocity.y * this.playerVelocity.y);
        if (playerSpeed === 0) return false;
        
        const normalizedPlayerVel = {
            x: this.playerVelocity.x / playerSpeed,
            y: this.playerVelocity.y / playerSpeed
        };
        
        // Calculate dot product
        const dotProduct = normalizedPlayerVel.x * normalizedDirToBear.x + normalizedPlayerVel.y * normalizedDirToBear.y;
        
        return dotProduct >= this.ADVANCE_DOT_THRESH;
    }
}
