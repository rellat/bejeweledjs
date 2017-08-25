var JewelBoard = require('./jewelboard')
var SocketIO = require('socket.io-client')
var Util = require('../game_server/socket_util')
var GameLogic = require('./gamelogic')

var Main = function(game) {}

Main.prototype.create = function() {
    var self = this
    self.bgm = self.game.add.audio('bgm')
    self.bgm.play()
    self.game.stage.backgroundColor = '#FFF'
    self.chaching = self.game.add.audio('chaching')
    self.chaching.allowMultiple = true
    self.game.stage.backgroundColor = '#999'

    self.game.stage.disableVisibilityChange = true;


    self.socket = SocketIO(window.location.hostname + ':' + window.location.port)
    self.socket.on('game packet', self.socketHandler.bind(self))
    self.socket.emit('join', 'hello')

    self.client_id = null
    self.room_id = null

    self.mainBoard = null
    // self.mainBoard.container.scale.setTo(0.5,0.5)
    // self.mainBoard.container.position.setTo(100,100)

    self.otherBoards = {}
    self.otherCount = 0
}
Main.prototype.update = function() {
    var self = this
    if (self.mainBoard) {
        self.mainBoard.update()
    }
}
Main.prototype.socketHandler = function (message) {
    var self = this
    console.log(JSON.stringify(message));
    // if (!self.mainBoard) return
    if (message.type == Util.ACTION_TYPE.CONNECTION) {
        if (self.socket.id === message.client_id && !self.mainBoard) {
            self.client_id = message.client_id
            self.room_id = message.room_id
            self.mainBoard = new JewelBoard({
                phaserGame: self.game,
                mapsize: message.message,
                tileSize: 75,
                id: self.socket.id,
                randomSeed: message.seed,
                observe: false
            })
            self.mainBoard.logic.pushHistory(message.time,message.seed, message.type, message.message)
            self.mainBoard.on('user action', self.socketResponse.bind(self))
        }else {
            var otherBoard = new JewelBoard({
                phaserGame: self.game,
                mapsize: message.message,
                tileSize: 30,
                id: self.socket.id,
                randomSeed: message.seed,
                observe: true
            })
            otherBoard.initGame(new GameLogic({
                id: self.socket.id,
                mapsize: message.message,
                randomSeed: message.seed
            }))
            otherBoard.logic.pushHistory(message.time,message.seed, message.type, message.message)
            otherBoard.container.position.setTo(self.otherCount * 240 + 20, 650)
            self.otherBoards[message.client_id] = otherBoard
            self.otherCount++
        }
    }else if (message.type == Util.ACTION_TYPE.SEED_RECIVED) {
        if (self.socket.id === message.client_id && !self.mainBoard) {
            self.mainBoard.logic.pushHistory(message.time,message.seed, message.type, message.message)
        }
    }else if (message.type == Util.ACTION_TYPE.ACTION_MADE) {
        if (self.socket.id != message.client_id) {
            console.log('client ' + message.client_id);
            console.log(self.otherBoards);
            self.otherBoards[message.client_id].syncAction(message.message.from, message.message.to, message)
        }
    }else if (message.type == Util.ACTION_TYPE.STATE_RESTORE) {
//{"client_id":"6NqEScVcmD8w2kTHAAAB","room_id":"0fhvmykfc76e80q7beh0ssjor","broadcast":false,"time":1503574211673,"seed":"3dpmulausvplqv3m5vgoav2t9","type":3,"message":
//[[{"time":1503574207124,"owner":"DiSzOuPvpY2ajkJkAAAA","seed":"a0euzl1k8vqijtfss1eeo2yb9","type":0,"message":""}]]
//}
        for (var i = 0; i < message.message.length; i++) {
            var temphistory = message.message[i]
            var otherBoard = new JewelBoard({
                phaserGame: self.game,
                mapsize: temphistory[0].message,
                tileSize: 30,
                id: temphistory[0].owner,
                randomSeed: temphistory[0].seed,
                observe: true
            })
            otherBoard.container.position.setTo(self.otherCount * 240 + 20, 650)

            var templogic = new GameLogic({
                id: message.client_id,
                mapsize: temphistory[0].message,
                randomSeed: temphistory[0].seed
            })

            for (var j = 0; j < temphistory.length; j++) {
                var result = null
                if (temphistory[j].type == Util.ACTION_TYPE.ACTION_MADE) {
                    result = templogic.syncAction(temphistory[j].message.from,temphistory[j].message.to, temphistory[j])
                }else {
                    result = templogic.processMatch()
                }
                while (result.is_matched) {
                    result = templogic.processMatch()
                }
            }
            otherBoard.initGame(templogic)
            self.otherBoards[temphistory[0].owner] = otherBoard
            self.otherCount++
        }

    }else if (message.type == Util.ACTION_TYPE.DISCONNECT) {
        self.otherBoards[message.client_id].container.destroy()
        delete self.otherBoards[message.client_id]
        self.otherCount--
    }
}

Main.prototype.socketResponse = function (message) {
    var self = this
    message.room_id = self.room_id
    self.socket.emit('game packet', message)
}
module.exports = Main
