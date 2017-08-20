var GameLogic = require('./gamelogic')

var JewelBoard = function(options) {
    var self = this

    self.game = options.phaserGame
    self.logic = new GameLogic({
        mapsize: options.mapsize,
        randomSeed: options.randomSeed
    })
    self.container = self.game.add.group()
    self.tileSize = options.tileSize || 100 // pixel
    self.tileScaler = self.tileSize / self.game.cache.getImage('blue').width

    self.canMove = false
    self.activeTile1 = null
    self.activeTile2 = null

    self.swipeSpeed = 400
    self.removeSpeed = 300
    self.fallSpeed = 500

    // initTiles
    for (var i = 0; i < self.logic.jewelMap.length; i++) {
        for (var j = 0; j < self.logic.jewelMap[i].length; j++) {
            var jewel = self.logic.jewelMap[i][j]
            var tile = self.addTile(jewel.x, jewel.y - self.logic.jewelMap[i].length, {
                x: jewel.x,
                y: jewel.y,
                type: jewel.type
            })
            self.game.add.tween(tile).to({
                y: jewel.y * self.tileSize
            }, self.fallSpeed - 50, 'Linear', true)
        }
    }
    self.game.time.events.add(self.fallSpeed, function() {
        var result = self.logic.processMatch()
        self.processMatch(result)
    })
}

JewelBoard.prototype.addTile = function(x, y, jewelobj) {
    var self = this

    // Drops at the correct x position but initializes at the top of the screen
    var tile = self.container.create(x * self.tileSize, y * self.tileSize, jewelobj.type)
    tile.scale.setTo(self.tileScaler, self.tileScaler)

    // tile.anchor.setTo(0,0)
    tile.inputEnabled = true
    // tile.tileType = type
    tile.jewel = jewelobj
    tile.events.onInputDown.add(self.tilePress, self)
    tile.events.onInputUp.add(self.tileRelease, self)

    return tile
}

JewelBoard.prototype.tilePress = function(tile, pointer) {
    var self = this
    if (self.canMove) {
        self.activeTile1 = tile
    }
    // console.log('tile pressed: ' + self.canMove + ' type: ' +tile.jewel.type);
    // console.log('compare: x: ' +tile.jewel.x + ' y: ' +tile.jewel.y + ' map: x: ' + self.logic.jewelMap[tile.y / self.tileSize][tile.x / self.tileSize].x + ' y: '+self.logic.jewelMap[tile.y / self.tileSize][tile.x / self.tileSize].y);
}
JewelBoard.prototype.tileRelease = function (tile, pointer) {
    var self = this
    if (self.activeTile1 == tile && !self.activeTile2) {
        self.tileDeactivate()
    }
};
JewelBoard.prototype.tileDeactivate = function() {
    var self = this
    self.activeTile1 = null
    self.activeTile2 = null
}

JewelBoard.prototype.update = function() {
    var self = this
    // must called by parent
    if (self.activeTile1 && !self.activeTile2) {
        var inputPos = self.container.toLocal(self.game.input.position)
        // var inputPos = self.game.input.position

        var hoverPosX = Math.floor(inputPos.x / self.tileSize)
        var hoverPosY = Math.floor(inputPos.y / self.tileSize)
        var targetPosX = self.activeTile1.jewel.x
        var targetPosY = self.activeTile1.jewel.y

        var difX = (hoverPosX - targetPosX)
        var difY = (hoverPosY - targetPosY)

        if (!(hoverPosY > self.logic.mapsize.y - 1 || hoverPosY < 0) && !(hoverPosX > self.logic.mapsize.x - 1 || hoverPosX < 0)) {
            // when move occur inside of board
            if ((Math.abs(difY) === 1 && difX === 0) || (Math.abs(difX) === 1 && difY === 0)) {
                // when it's a swipe, not a click
                self.canMove = false
                self.activeTile2 = self.getTilePos(hoverPosX, hoverPosY)

                var result = self.logic.execAction({
                    x: targetPosX,
                    y: targetPosY
                }, {
                    x: hoverPosX,
                    y: hoverPosY
                })
                self.swapTiles(self.activeTile1, self.activeTile2)

                self.processMatch(result)
            }
        }else {
            self.tileDeactivate()
        }
    }
}

JewelBoard.prototype.processMatch = function(result) {
    var self = this
    if (result.is_matched && self.activeTile1 && self.activeTile2) {
        self.game.time.events.add(self.swipeSpeed, function() {
            self.removeTileGroup(result.matchedJewels)
        })
        self.game.time.events.add(self.swipeSpeed + self.removeSpeed, function() {
            self.fillTiles(result.jewelMoves)
        })
        self.tileDeactivate()
    } else if (result.is_matched) {
        self.removeTileGroup(result.matchedJewels)
        self.game.time.events.add(self.removeSpeed, function() {
            self.fillTiles(result.jewelMoves)
        })
        self.tileDeactivate()
    } else if (self.activeTile1 && self.activeTile2) {
        // swap back
        self.game.time.events.add(self.swipeSpeed, function() {
            self.swapTiles(self.activeTile1, self.activeTile2)
            self.game.time.events.add(self.swipeSpeed, function() {
                self.tileDeactivate()
                self.canMove = true
            })
        })
    } else {
        self.game.time.events.add(self.swipeSpeed, function() {
            self.tileDeactivate()
            self.canMove = true
        })
    }
}

JewelBoard.prototype.getTilePos = function(posX, posY) {
    var self = this
    var targettile = null
    self.container.forEach(function(child) {
        // if (child.x === posX * self.tileSize && child.y === posY * self.tileSize) {
        //     targettile = child
        // }
        if (child.jewel.x === posX && child.jewel.y === posY) {
            targettile = child
        }
        // console.log(child.x, posX * self.tileSize, child.y, posY * self.tileSize)
    }, self, true)
    return targettile
}
JewelBoard.prototype.swapTiles = function(tile1, tile2) {
    var self = this
    var tile1Pos = {
        x: (tile1.x) / self.tileSize,
        y: (tile1.y) / self.tileSize
    }
    var tile2Pos = {
        x: (tile2.x) / self.tileSize,
        y: (tile2.y) / self.tileSize
    }

    var tempjewel = tile1.jewel
    tile1.jewel = tile2.jewel
    tile2.jewel = tempjewel

    self.game.add.tween(tile1).to({
        x: tile2Pos.x * self.tileSize,
        y: tile2Pos.y * self.tileSize
    }, self.swipeSpeed * 0.6, Phaser.Easing.Linear.In, true)
    self.game.add.tween(tile2).to({
        x: tile1Pos.x * self.tileSize,
        y: tile1Pos.y * self.tileSize
    }, self.swipeSpeed * 0.6, Phaser.Easing.Linear.In, true)
}

JewelBoard.prototype.removeTileGroup = function(jewels) {
    var self = this
    // console.log('remove jewel: ' + JSON.stringify(jewels))
    for (var i = 0; i < jewels.length; i++) {
        var tile = self.getTilePos(jewels[i].x, jewels[i].y)
        var tween = self.game.add.tween(tile).to({
            alpha: 0.1
        }, self.removeSpeed - 50, 'Linear', true)

        function removechild(child) { // remove from container and destroy
            self.container.remove(child)
        }
        tween.onComplete.add(removechild, this)
        // console.log(jewels[i].x, ' ', jewels[i].y, ' ', tile)
    }
}
JewelBoard.prototype.fillTiles = function(jewelMoves) {
    var self = this
    for (var i = 0; i < jewelMoves.length; i++) {
        var tile = self.getTilePos(jewelMoves[i].from.x, jewelMoves[i].from.y)
        var jewel = {
            x: jewelMoves[i].to.x,
            y: jewelMoves[i].to.y,
            type: jewelMoves[i].to.type
        }
        if (!tile) {
            tile = self.addTile(jewelMoves[i].from.x, jewelMoves[i].from.y, jewel)
        } else {
            tile.jewel = jewel
        }
        self.game.add.tween(tile).to({
            y: jewelMoves[i].to.y * self.tileSize
        }, self.fallSpeed - 100, 'Linear', true)
    }
    self.game.time.events.add(self.fallSpeed + 50, function() {
        var result = self.logic.processMatch()
        self.processMatch(result)
        console.log('matching again');
    })
}

module.exports = JewelBoard
