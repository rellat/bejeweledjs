var crypto = require('crypto')
var SeedRandom = require('seedrandom')
var Util = require('../game_server/socket_util')

var GameLogic = function(options) {
    var self = this

    self.jewelTypes = ['blue', 'green', 'red', 'yellow']

    self.randomSeed = options.randomSeed || Date.now()
    self.random = SeedRandom(self.randomSeed)
    self.score = 0
    self.id = options.id || 'offline'

    self.history = []
    // make an Action packet:
    // time: Timetic by owner,
    // owner: object owner - player id,
    // seed: current seed number for random
    // type: (0 for player connection, 1 for recieved seed transfer, 2 for player made action),
    // message: any

    // jewelMap init
    self.jewelMap = []
    self.mapsize = options.mapsize || {
        x: 12,
        y: 12
    }
    for (var i = 0; i < self.mapsize.x; i++) {
        self.jewelMap.push([])
        for (var j = 0; j < self.mapsize.y; j++) {
            self.jewelMap[i].push({
                type: self.makeJewel(),
                x: j,
                y: i
            })
        }
    }
    // console.log('ready jewelmap ' + JSON.stringify(self.jewelMap))
}

GameLogic.prototype.pushHistory = function (time, seed, type, message) {
    var self = this
    self.randomSeed = seed
    // push action to history log
    self.history.push({ time: time, owner: self.id, seed: seed, type: type, message: message })
};

GameLogic.prototype.makeJewel = function() {
    var self = this
    return self.jewelTypes[Math.floor(self.random() * 4)]
}
GameLogic.prototype.getJewelMoves = function() {
    var self = this
    var moves = []
    // get moves from exist jewels
    for (var i = 0; i < self.jewelMap[0].length; i++) {
        for (var j = self.jewelMap.length - 1; j >= 0; j--) {
            var jewelFrom = null
            var jewelTo = self.jewelMap[j][i]
            if (!self.jewelMap[j][i].type) {
                var tempY = -1
                for (var k = j - 1; k >= 0; k--) {
                    if (self.jewelMap[k][i].type) {
                        jewelFrom = self.jewelMap[k][i]
                        jewelTo.type = jewelFrom.type
                        jewelFrom.type = null
                        moves.push({
                            from: jewelFrom,
                            to: jewelTo
                        })
                        k = -1 // same as break
                    }
                }
                if (!jewelFrom) {
                    jewelTo.type = self.makeJewel()
                    moves.push({
                        from: {
                            x: i,
                            y: tempY--
                        },
                        to: jewelTo
                    })
                }
            }
        }
    }
    // make jewels and get moves
    return moves
}
GameLogic.prototype.getMatch = function() {
    var self = this
    var matches = []

    // Finds a horizontal match
    for (var i = 0; i < self.jewelMap.length; i++) {
        var tempmatch = []
        var continued = false
        for (var j = 0; j < self.jewelMap[i].length; j++) {
            if (j > 0) {
                if (tempmatch[(tempmatch.length - 1)].type == self.jewelMap[i][j].type) {
                    continued = true
                } else {
                    continued = false
                }
                if (!continued && tempmatch.length > 2) {
                    matches.push(tempmatch)
                    tempmatch = []
                } else if (continued && tempmatch.length >= 2 && j == self.jewelMap[i].length - 1) {
                    tempmatch.push(self.jewelMap[i][j])
                    matches.push(tempmatch)
                    tempmatch = []
                } else if (!continued) {
                    tempmatch = []
                }
            }
            // console.log('i: ' + i + ' j: ' + j + ' jewel: ' + JSON.stringify(self.jewelMap[i][j]) + ' match: ' + JSON.stringify(tempmatch))
            tempmatch.push(self.jewelMap[i][j])
        }
    }

    // Now for vertical matches
    for (var l = 0; l < self.jewelMap[0].length; l++) {
        var tempmatch = []
        var continued = false
        for (var k = 0; k < self.jewelMap.length; k++) {
            if (k > 0) {
                if (tempmatch[(tempmatch.length - 1)].type == self.jewelMap[k][l].type) {
                    continued = true
                } else {
                    continued = false
                }
                if (!continued && tempmatch.length > 2) {
                    matches.push(tempmatch)
                    tempmatch = []
                } else if (continued && tempmatch.length >= 2 && k == self.jewelMap.length - 1) {
                    tempmatch.push(self.jewelMap[k][l])
                    matches.push(tempmatch)
                    tempmatch = []
                } else if (!continued) {
                    tempmatch = []
                }
            }
            tempmatch.push(self.jewelMap[k][l])
        }
    }
    if (matches.length == 0) {
        return null
    } else {
        return matches
    }
}
GameLogic.prototype.processMatch = function() {
    var self = this

    var matches = self.getMatch()
    if (!matches) {
        return {
            is_matched: false
        }
    }

    // get all jewels pos which will replaced
    var matchedJewels = []
    for (var i = 0; i < matches.length; i++) {
        for (var j = 0; j < matches[i].length; j++) {
            if (matchedJewels.indexOf(matches[i][j]) === -1) {
                matchedJewels.push(matches[i][j])
                matches[i][j].type = null
            }
        }
    }

    // get moves for animation. it also create jewels for replace
    var jewelMoves = self.getJewelMoves()
    var tempscore = self.calculateScore(matches)
    self.score += tempscore

    return {
        is_matched: true,
        matchedJewels: matchedJewels,
        score: self.score,
        jewelMoves: jewelMoves
    }
}
GameLogic.prototype.execAction = function(posFrom, posTO) {
    var self = this
    // console.log(JSON.stringify(self.jewelMap));

    posFrom.type = self.jewelMap[posFrom.y][posFrom.x].type
    posTO.type = self.jewelMap[posTO.y][posTO.x].type

    self.jewelMap[posFrom.y][posFrom.x].type = posTO.type
    self.jewelMap[posTO.y][posTO.x].type = posFrom.type

    var result = self.processMatch()
    // console.log(JSON.stringify(result) + ' from: ' + JSON.stringify(posFrom)+ ' to: ' + JSON.stringify(posTO));
    // console.log('change from: ' + JSON.stringify(self.jewelMap[posFrom.y][posFrom.x])+ ' to: ' + JSON.stringify(self.jewelMap[posTO.y][posTO.x]));
    // console.log(JSON.stringify(self.jewelMap));
    if (!result.is_matched) {
        self.jewelMap[posFrom.y][posFrom.x].type = posFrom.type
        self.jewelMap[posTO.y][posTO.x].type = posTO.type
    }else {
        self.pushHistory(Date.now(), self.randomSeed, Util.ACTION_TYPE.ACTION_MADE, {from: posFrom, to: posTO})
    }
    return result
}
GameLogic.prototype.syncAction = function(posFrom, posTO, message) {
    var self = this

    posFrom.type = self.jewelMap[posFrom.y][posFrom.x].type
    posTO.type = self.jewelMap[posTO.y][posTO.x].type

    self.jewelMap[posFrom.y][posFrom.x].type = posTO.type
    self.jewelMap[posTO.y][posTO.x].type = posFrom.type

    var result = self.processMatch()
    if (!result.is_matched) {
        self.jewelMap[posFrom.y][posFrom.x].type = posFrom.type
        self.jewelMap[posTO.y][posTO.x].type = posTO.type
        console.warn('client '+ self.id + ' recieved invalidate action');
    }else {
        self.pushHistory(message.time, message.randomSeed, message.type, message.message)
    }
    return result
}
GameLogic.prototype.validateBoard = function(hashtext) {
    var self = this
    var md5data = crypto.createHash('md5').update(JSON.stringify(self.jewelMap)).digest('hex')
    if (md5data === hashtext) {
        return true
    } else {
        return false
    }
}
GameLogic.prototype.calculateScore = function(matches) {
    var score = 0
    for (var i = 0; i < matches.length; i++) {
        score += 100 + (matches[i].length - 3) * 50
    }
    return score
}
module.exports = GameLogic
