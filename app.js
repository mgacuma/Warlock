import express from 'express'
import { Server as hServer } from 'http'
import { Server as sServer } from 'socket.io'

var players = {};

class GameServer {
    constructor(){
        const __dirname = new URL('.', import.meta.url).pathname;
        this.expressApp = express();
        this.expressApp.use(express.static(__dirname + '/public'));
        // this.expressApp.use("/public/", express.static(__dirname + '/public'));
        this.expressApp.get('/', function (req, res) {
            res.sendFile(__dirname + '/index.html');
        });
        this.httpServer = new hServer(this.expressApp)
        this.httpServer.keepAliveTimeout = 120 * 1000
        this.httpServer.headersTimeout = 120 * 1000
        this.io = new sServer(this.httpServer);
    }

    init(){
        this.io.on('connection', function (socket) {
            console.log('a user connected');
            // create a new player and add it to our players object
            players[socket.id] = {
              rotation: 0,
              x: Math.floor(Math.random() * 700) + 50,
              y: Math.floor(Math.random() * 500) + 50,
              playerId: socket.id,
              team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
            };
            // send the players object to the new player
            socket.emit('currentPlayers', players);
            // update all other players of the new player
            socket.broadcast.emit('newPlayer', players[socket.id]);
            // when a player disconnects, remove them from our players object
            socket.on('disconnect', function () {
              console.log('user disconnected');
              // remove this player from our players object
              delete players[socket.id];
              // emit a message to all players to remove this player
              socket.broadcast.emit('playerdisconnect', socket.id);
            });
        
            // when a player moves, update the player data
            socket.on('playerMovement', function (movementData) {
                players[socket.id].x = movementData.x;
                players[socket.id].y = movementData.y;
                players[socket.id].rotation = movementData.rotation;
                // emit a message to all players about the player that moved
                socket.broadcast.emit('playerMoved', players[socket.id]);
            });
          });
    }

    run(){
        this.httpServer.listen(8081, function () {
            console.log(`Listening on `);
          });
    }
}

const server = new GameServer()
server.init()
server.run()