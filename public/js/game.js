var socket
const roundHalf = num => Math.round(num * 2) / 2

/**
 * The base resolution of this game is 360x640 @4.
 * Means you should draw all your assets in a resolution of 1440x2560 or 2560x1440
 * and pack and scale them down with a TexturePacker like https://www.codeandweb.com/texturepacker
 */

// is the user not happy with 'best',
// simply set the graphics to 'medium'
// (maybe store the settings in LocalStorage)
const graphicsSettings = { best: 1, medium: 0.75, low: 0.5 }
const DPR = window.devicePixelRatio * graphicsSettings.best
const { width, height } = window.screen

// Set width and height.
const WIDTH = Math.round(Math.max(width, height) * DPR)
const HEIGHT = Math.round(Math.min(width, height) * DPR)

// Need a fixed screen ratio for your game
// because it is to hard to make it responsive?
// Simply lock the screen ratio by adapting the code as follow.
// (On a desktop PC it should show all assets in @4)
// const isMobile = () => Math.min(screen.width, screen.height) <= 480
// const WIDTH = 640 * (isMobile() ? DPR : 4)
// const HEIGHT = 360 * (isMobile() ? DPR : 4)

// will be 1, 1.5, 2, 2.5, 3, 3.5 or 4
export const assetsDPR = roundHalf(Math.min(Math.max(HEIGHT / 360, 1), 4))

console.log('DPR = ', DPR)
console.log('assetsDPR = ', assetsDPR)
console.log('WIDTH = ', WIDTH)
console.log('HEIGHT = ', HEIGHT)

class SID extends Phaser.Scene {
  constructor(){
    super({key: 'SID', active: true})
  }

  create(){
    this.sid = this.add.text(24,24, 'sid: ' + socket.id, {color: '#000', fontSize: 32})
  }

  update(){
    this.sid.setText('sid: ' + socket.id)
  }
}

class JoinRoom extends Phaser.Scene {
  constructor(){
    super({key: 'JoinRoom'})
  }

  create(){
    const window = this.add.rectangle(300,300,300,300,'#f2f2f2')
  }

}

class TitleScene extends Phaser.Scene {
  constructor(){
      super('TitleScene')
  }

  preload(){}

  create(){
      this.add.text(500,520, 'Title Screen', {color: '#000', fontSize: 78})
      const create = this.add.text(500,598, 'Create Room', {color: '#000', fontSize: 78})
      create.setInteractive()
      create.on('pointerup', () => {
        console.log('emiting')
        socket.emit('createRoom')
      })
      
      const join = this.add.text(500,676, 'Join Room', {color: '#000', fontSize: 78})
      join.setInteractive()
      join.on('pointerup', () => {
        this.scene.start('JoinRoom')
      })
  }

  update(){

  }
}

class GameScene extends Phaser.Scene {
  constructor(){
      super('GameScene')
  }

  preload() {
      this.load.image('ship', 'assets/spaceShips_001.png');
      this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    }
  
  create() {
    console.log('create called')
    this.add.text(290,290,'gaming...', {fontSize: 86})
      var self = this;
      this.otherPlayers = this.physics.add.group();
  
      socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
          if (players[id].playerId === self.socket.id) {
            self.addPlayer(self, players[id]);
          } else {
            self.addOtherPlayers(self, players[id]);
          }
        });
      });
  
      socket.on('newPlayer', function (playerInfo) {
        self.addOtherPlayers(self, playerInfo);
      });
  
      socket.on('playerdisconnect', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (playerId === otherPlayer.playerId) {
            otherPlayer.destroy();
          }
        });
      });
  
      socket.on('playerMoved', function (playerInfo) {
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

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#ffffff',
  scale: {
    parent: 'phaser-game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: [TitleScene, GameScene, SID, JoinRoom]
};


window.addEventListener('load', () => {
  socket = io()
  socket.on('connect', () => { console.log(socket.id) })
  new Phaser.Game(config)
})