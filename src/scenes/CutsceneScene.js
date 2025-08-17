class CutsceneScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CutsceneScene' });
    }

    create() {
        console.log('CutsceneScene create() called - scene loading successfully');
        
        // Get logical game dimensions
        const centerX = this.sys.game.config.width / 2;  // 160
        const centerY = this.sys.game.config.height / 2; // 90
        
        // MINIMAL TEST - just show text and go to GameScene
        this.cameras.main.setBackgroundColor('#000080'); // Blue background to show it worked
        
        this.add.text(centerX, centerY, 'CUTSCENE SCENE WORKS!', {
            fontSize: '16px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        this.add.text(centerX, centerY + 30, 'Press SPACE to continue to game', {
            fontSize: '12px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Set up SPACE key to go to GameScene
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', () => {
            console.log('SPACE pressed in cutscene - going to GameScene');
            this.scene.start('GameScene');
        });
    }
    
    createPalaceBackground(centerX, centerY) {
        // Palace background per PRD Section 2.4
        // Set background to daytime blue (windows)
        this.cameras.main.setBackgroundColor('#87CEEB');
        
        // Palace walls (white)
        this.add.rectangle(centerX, centerY, 320, 180, 0xFFFFFF);
        
        // Red carpet with gold trim
        this.add.rectangle(centerX, centerY + 60, 280, 40, 0xFF0000);
        this.add.rectangle(centerX, centerY + 45, 280, 10, 0xFFD700); // Top trim
        this.add.rectangle(centerX, centerY + 75, 280, 10, 0xFFD700); // Bottom trim
        
        // Palace columns (white with gold)
        this.add.rectangle(40, centerY, 15, 120, 0xFFFFFF);
        this.add.rectangle(280, centerY, 15, 120, 0xFFFFFF);
        this.add.rectangle(40, centerY - 50, 15, 20, 0xFFD700); // Gold capitals
        this.add.rectangle(280, centerY - 50, 15, 20, 0xFFD700);
        
        // Thrones
        // Human throne (left side) - gold with red cushion
        this.add.rectangle(80, centerY - 10, 25, 30, 0xFFD700);
        this.add.rectangle(80, centerY - 20, 20, 15, 0xFF0000);
        
        // Bear throne (right side) - gold with red cushion, larger
        this.add.rectangle(240, centerY - 10, 30, 35, 0xFFD700);
        this.add.rectangle(240, centerY - 22, 25, 18, 0xFF0000);
    }
    
    createCharacters(centerX, centerY) {
        console.log('Creating characters...');
        
        // King Human (left) - grey with gold crown and staff
        this.humanKing = this.add.rectangle(80, centerY + 15, 16, 24, 0x414141);
        this.humanCrown = this.add.rectangle(80, centerY + 5, 18, 8, 0xFFD700);
        this.humanStaff = this.add.rectangle(90, centerY + 15, 3, 20, 0xFFD700);
        
        console.log('humanKing created:', this.humanKing);
        
        // King Bear (right) - brown/black with red robe and gold crown
        this.bearKing = this.add.rectangle(240, centerY + 15, 20, 28, 0x8B4513);
        this.bearRobe = this.add.rectangle(240, centerY + 20, 24, 20, 0xFF0000);
        this.bearCrown = this.add.rectangle(240, centerY + 3, 22, 10, 0xFFD700);
        
        // Character labels
        this.add.text(80, centerY + 40, 'King Human', {
            fontSize: '8px',
            fill: '#000000',
            align: 'center'
        }).setOrigin(0.5);
        
        this.add.text(240, centerY + 40, 'King Bear', {
            fontSize: '8px',
            fill: '#000000',
            align: 'center'
        }).setOrigin(0.5);
    }
    
    createDialogueUI(centerX, centerY) {
        // Dialogue panel background (semi-transparent black)
        this.dialoguePanel = this.add.rectangle(centerX, centerY + 55, 300, 50, 0x000000, 0.8);
        
        // Speaker name display
        this.speakerNameText = this.add.text(centerX, centerY + 45, '', {
            fontSize: '14px',
            fill: '#FFD700', // Gold text
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Dialogue text display
        this.dialogueText = this.add.text(centerX, centerY + 65, '', {
            fontSize: '11px',
            fill: '#FFFFFF',
            align: 'center',
            wordWrap: { width: 280 } // Wrap text to fit screen
        }).setOrigin(0.5);
    }
    
    displayCurrentDialogue() {
        const currentDialogue = this.dialogues[this.currentDialogueIndex];
        
        // Update speaker name (always gold)
        this.speakerNameText.setText(currentDialogue.speaker);
        
        // Update dialogue text
        this.dialogueText.setText(currentDialogue.text);
        
        // Perform character animation based on dialogue
        this.playCharacterAnimation(currentDialogue.speaker, currentDialogue.animation);
    }
    
    playCharacterAnimation(speaker, animation) {
        console.log(`Playing animation: ${speaker} - ${animation}`);
        console.log('humanKing:', this.humanKing);
        console.log('bearKing:', this.bearKing);
        
        // Check if characters exist before trying to use them
        if (!this.humanKing || !this.bearKing) {
            console.error('Characters not created yet!');
            return;
        }
        
        // Reset both characters to normal state first
        this.humanKing.setTint(0xFFFFFF);
        this.bearKing.setTint(0xFFFFFF);
        
        // Simple highlighting without animations for now (to debug)
        if (speaker === "King Human") {
            this.humanKing.setTint(0xFFFF99); // Slight yellow highlight
            this.bearKing.setTint(0x888888);  // Dimmed
        } else {
            this.bearKing.setTint(0xFFDD99);  // Slight orange highlight
            this.humanKing.setTint(0x888888); // Dimmed
        }
        
        // TODO: Re-add animations once scene loading is fixed
    }
    
    progressDialogue() {
        this.currentDialogueIndex++;
        
        if (this.currentDialogueIndex < this.dialogues.length) {
            // More dialogue to show
            this.displayCurrentDialogue();
        } else {
            // Cutscene finished - go to first bear fight
            console.log('Cutscene complete - transitioning to GameScene');
            this.scene.start('GameScene'); // Will change to Bear1Scene in 5.3
        }
    }
}
