const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 180,
    backgroundColor: '#000000',
    pixelArt: true,
    antialias: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    scene: {
        create: function() {
            // Input helper
            this.input.keyboard.on('keydown-A', () => this.displayInput('A'));
            this.input.keyboard.on('keydown-D', () => this.displayInput('D'));
            this.input.keyboard.on('keydown-SPACE', () => this.displayInput('SPACE'));
            this.input.keyboard.on('keydown-J', () => this.displayInput('J'));
            this.input.keyboard.on('keydown-K', () => this.displayInput('K'));
            this.input.keyboard.on('keydown-R', () => this.displayInput('R'));
            this.input.keyboard.on('keydown-ENTER', () => this.displayInput('ENTER'));
            
            this.input.on('pointerdown', (pointer) => {
                if (pointer.leftButtonDown()) {
                    this.displayInput('MOUSE LEFT');
                }
            });
        },
        
        displayInput: function(inputName) {
            // Clear previous text
            if (this.inputText) {
                this.inputText.destroy();
            }
            
            // Display new input text
            this.inputText = this.add.text(160, 90, inputName, {
                fontSize: '16px',
                fill: '#ffffff'
            }).setOrigin(0.5);
        }
    }
};

const game = new Phaser.Game(config);



