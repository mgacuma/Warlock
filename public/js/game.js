

class TitleScene extends Phaser.Scene {
  constructor(){
      super('TitleScene')
      console.log('title made')
  }

  create(){
      this.add.image(400, 300, 'sky');
      this.add.text(20,20, 'loading gamsu...')
      this.input.on('pointerup', function (pointer) {

        this.scene.start('GameScene');

    }, this);
  }
}

class GameScene extends Phaser.Scene {
  constructor(){
      super('GameScene')
      console.log('game made')
  }


  preload() {
      this.load.image('ship', 'assets/spaceShips_001.png');
      this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    }
  
  create() {
    this.add.text(20,20,'gaming...')
      var self = this;
      this.socket = io();
      this.otherPlayers = this.physics.add.group();
  
      this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
          if (players[id].playerId === self.socket.id) {
            addPlayer(self, players[id]);
          } else {
            addOtherPlayers(self, players[id]);
          }
        });
      });
  
      this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo);
      });
  
      this.socket.on('playerdisconnect', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (playerId === otherPlayer.playerId) {
            otherPlayer.destroy();
          }
        });
      });
  
      this.socket.on('playerMoved', function (playerInfo) {
          self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
              otherPlayer.setRotation(playerInfo.rotation);
              otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            }
          });
        });
  
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  
  update() {
      if (this.ship) {
          // emit player movement
          var x = this.ship.x;
          var y = this.ship.y;
          var r = this.ship.rotation;
          if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
            this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
          }
          // save old position data
          this.ship.oldPosition = {
            x: this.ship.x,
            y: this.ship.y,
            rotation: this.ship.rotation
          };
          if (this.cursors.left.isDown) {
            this.ship.setAngularVelocity(-150);
          } else if (this.cursors.right.isDown) {
            this.ship.setAngularVelocity(150);
          } else {
            this.ship.setAngularVelocity(0);
          }
        
          if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);
          } else {
            this.ship.setAcceleration(0);
          }
          // this.physics.world.wrap(this.ship, 5);
        }
    }
  
  addPlayer(self, playerInfo) {
      self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
      if (playerInfo.team === 'blue') {
        self.ship.setTint(0x0000ff);
      } else {
        self.ship.setTint(0xff0000);
      }
      self.ship.setDrag(100);
      self.ship.setAngularDrag(100);
      self.ship.setMaxVelocity(200);
      console.log('ship created')
    }
  
  addOtherPlayers(self, playerInfo) {
      const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
      if (playerInfo.team === 'blue') {
        otherPlayer.setTint(0x0000ff);
      } else {
        otherPlayer.setTint(0xff0000);
      }
      otherPlayer.playerId = playerInfo.playerId;
      self.otherPlayers.add(otherPlayer);
    }
}

var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1080,
  height: 780,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: [TitleScene, GameScene]
};


var game = new Phaser.Game(config);