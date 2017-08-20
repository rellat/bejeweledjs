var Preload = function(game) {};

Preload.prototype = {

    preload: function() {
        this.game.load.image('red', 'assets/characters_red.png');
        this.game.load.image('green', 'assets/characters_green.png');
        this.game.load.image('blue', 'assets/characters_blue.png');
        this.game.load.image('yellow', 'assets/characters_yellow.png');
        this.game.load.spritesheet('coinflip', 'assets/coinflip.png', 128, 128);
        this.game.load.audio('chaching', ['assets/chaching.mp3', 'assets/chaching.ogg']);
        this.game.load.image("gametitle", "assets/sprites/bootcamp.png");
        this.game.load.image("playbutton", "assets/sprites/playbutton.png");
    },

    create: function() {
        this.game.state.start("GameTitle");
    }
};
module.exports = Preload
