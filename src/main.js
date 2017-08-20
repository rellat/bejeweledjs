var JewelBoard = require('./jewelboard')

var Main = function(game) {}

Main.prototype.create = function() {
    var self = this
    self.bgm = self.game.add.audio('bgm')
    self.bgm.play()
    self.game.stage.backgroundColor = '#FFF'
    self.chaching = self.game.add.audio('chaching')
    self.chaching.allowMultiple = true
    self.game.stage.backgroundColor = '#999'

    self.mainBoard = new JewelBoard({
        phaserGame: self.game,
        mapsize: { x: 6, y: 6 },
        tileSize: 100,
        // randomSeed: 'AforAppleBforBanana'
        randomSeed: 'AforAppleBforBanan'
    })
    // self.mainBoard.container.scale.setTo(0.6,0.6)
    // self.mainBoard.container.position.setTo(100,100)
}
Main.prototype.update = function() {
    var self = this
    if (self.mainBoard) {
        self.mainBoard.update()
    }
}

module.exports = Main
