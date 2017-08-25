var debug = require('debug')('bejeweled:GameObject')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')

var Util = require('./socket_util')
var Player = require('../game_client/gamelogic')

/**
 * GameRoom
 *
 * @event userleave 유저가 방을 나가는 액션을 할 때 호출. socket disconnect할 땐 반대로 roomManager에서 메소드를 호출한다.
 */
inherits(GameRoom, EventEmitter)

function GameRoom(options) {
    var self = this
    if (!(self instanceof GameRoom)) return new GameRoom(options)

    self.room_id = options.room_id || Math.random().toString(36).substr(2)
    self.gameState = Util.GAMESTATES.INIT // 시퀀셜 진행

    self.players = {}
    self.gameInterval = null
    self.prevTick = 0
    self.ChangeGameState = function(state) {
        self.gameState = state
        self.prevTick = Date.now()
        // self.makeRespnse()
    }
}
GameRoom.prototype.initGame = function() {
    var self = this
    self.ChangeGameState(Util.GAMESTATES.READY)

    function gameLoop() {
        var self = this
        for (var key in self.players) {
            if (self.players.hasOwnProperty(key)) {
                var player = self.players[key]
                // self.makeRespnse(player)
                var response = {
                    client_id: player.id,
                    room_id: self.room_id,
                    broadcast: false,
                    time: Date.now(),
                    seed: Math.random().toString(36).substr(2),
                    type: Util.ACTION_TYPE.SEED_RECIVED,
                    message: ''
                }
                player.pushHistory(response.time, response.seed, response.type, response.message)
                self.emit('response', response)
            }
        }
    }

    if (self.gameInterval) clearInterval(self.gameInterval)
    self.gameInterval = setInterval(gameLoop.bind(self), 1000 * 100) // call every second
}

GameRoom.prototype.pushClient = function(options) {
    var self = this
    var player = new Player(options)
    var response = {
        client_id: options.id,
        room_id: self.room_id,
        broadcast: true,
        time: Date.now(),
        seed: player.randomSeed,
        type: Util.ACTION_TYPE.CONNECTION,
        message: options.mapsize
    }
    player.pushHistory(response.time, response.seed, response.type, response.message)
    self.emit('response', response)

    var otherplayers = []
    for (var key in self.players) {
        if (self.players.hasOwnProperty(key)) {
            var tempplayer = self.players[key]
            otherplayers.push(tempplayer.history)
        }
    }
    if (otherplayers.length > 0) {

        var response = {
            client_id: player.id,
            room_id: self.room_id,
            broadcast: false,
            time: Date.now(),
            seed: player.randomSeed,
            type: Util.ACTION_TYPE.STATE_RESTORE,
            message: otherplayers
        }
        self.emit('response', response)
    }
    self.players[options.id] = player
}

/**
 * clientEventHandler
 *
 * @param {*} message {
 *  client_id: String
 *  room_id: String
 *  time: Timetic by client,
    seed: current seed number for random
    type: (0 for player connection, 1 for recieved seed transfer, 2 for player made action),
    message: any
 * }
 * @event {*} response {
 *  client_id: String
 *  room_id: String
 broadcast:
 time:
 seed:
 type:
 message: any :: send random seed, send otherPlayer's action and connection info, restore otherPlaye's game by history
 * }
 */
GameRoom.prototype.clientEventHandler = function(message) {
    var self = this
    var player = self.players[message.client_id]
    // debug('got action' + JSON.stringify(message))

        // client id -> action
    if (self.gameState == Util.GAMESTATES.READY) {
        if (message.type == Util.ACTION_TYPE.ACTION_MADE) {
            self.players[message.client_id].syncAction(message.message.from, message.message.to, message)
            // broadcast to others
            var response = {
                client_id: player.id,
                room_id: self.room_id,
                broadcast: true,
                time: message.time,
                seed: message.seed,
                type: message.type,
                message: message.message
            }
            self.emit('response', response)
        }
    } else {
        debug('ignore client action: ' + JSON.stringify(message))
    }
}
GameRoom.prototype.updateDisconectedUser = function(client_id) {
    var self = this
    if (self.players[client_id]) {
        var response = {
            client_id: client_id,
            room_id: self.room_id,
            broadcast: true,
            type: Util.ACTION_TYPE.DISCONNECT
        }
        self.emit('response', response)

        delete self.players[client_id]
    }
    debug('client: ' + client_id + ' disconnect from room: ' + self.room_id)
}

module.exports = GameRoom
