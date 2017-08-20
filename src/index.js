/* global Phaser */

var Boot = require('./boot')
var Preload = require('./preload')
var GameTitle = require('./gametitle')
var Main = require('./main')
var GameOver = require('./gameover')

module.exports = function() {

    // Create a new game that fills the screen
    var game = new Phaser.Game(600, 670, Phaser.AUTO, 'phaser-container')

    // Add all states
    game.state.add('Boot', Boot)
    game.state.add('Preload', Preload)
    game.state.add('GameTitle', GameTitle)
    game.state.add('Main', Main)
    game.state.add('GameOver', GameOver)

    // Start the first state
    game.state.start('Boot')
}
