var GameTitle = function(game) {}

GameTitle.prototype = {
    create: function() {
        this.game.stage.backgroundColor = '#333'
        var title = this.game.add.sprite(this.game.width / 2, 60, 'gametitle')
        title.scale.setTo(0.8, 0.8)
        title.anchor.set(0.5)
        var playButton = this.game.add.button(this.game.width / 2, this.game.height / 2 + 50, 'playbutton', function() { this.startGame() }.bind(this))
        playButton.anchor.set(0.5)

        var style = { font: '20px Arial', fill: '#ffffff', align: 'center' }
        var text = this.game.add.text(this.game.world.centerX, this.game.height - 50, '(Click and drag to swap and match logos)', style)
        text.anchor.set(0.5)
    },

    startGame: function() {
        this.game.state.start('Main')
    }

}
module.exports = GameTitle
