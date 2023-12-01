import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const players = {}

class GameServer {
    constructor(){
        this.app = express();
        this.httpServer = createServer(this.app)
        this.httpServer.keepAliveTimeout = 120 * 1000
        this.httpServer.headersTimeout = 120 * 1000
        this.io = new Server(this.httpServer, {});
    }

    setup(){
      this.app.use(express.static('public'))
      this.registerEndpoints()
      this.registerHandlers()
    }

    registerEndpoints(){ 
      this.app.get('/', function (req, res) {
          console.log(__dirname)
          res.sendFile(__dirname + '/index.html');
      });
    }

    registerHandlers(){
      this.io.on('connection', socket => {
        console.log('Client joined lobby')
        console.log(socket.id)

        socket.join('lobby')

        socket.on('disconnect', () => {
          console.log('dc');
        })
        
        socket.on('createRoom', async () => {
          socket.leave('lobby')
          console.log('createRoom')
          console.log(await this.io.fetchSockets())
        })

      });
    }

    run(){
      this.httpServer.listen(8081, function () {
        console.log(`Listening on port 8080 `);
      });

    }
}

const server = new GameServer()
server.setup()
server.run()