var Util = require('./game_util')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var debug = require('debug')('blackjackon:game_deck')

/**
 * Card
 * 
 * @param suit number 0~3, Util.SUITS.HEART = 0 ...
 * @param rank number 1~13
 */
function Card(suit, rank) {
    var self = this
    if (!(self instanceof Card)) return new Card()
    if (arguments.length < 2) return debug('cant create a card')

    self.suit = suit
    self.rank = Util.RANKS[rank - 1]
}
Card.prototype.getName = function() {
    var self = this
    return { suit: Util.SHAPES[self.suit], rank: self.rank }
}

/**
 * Deck
 * 
 * @method shuffle shuffling the deck
 * @method nextCard get next card from the deck
 */
inherits(Deck, EventEmitter)

function Deck() {
    var self = this
    if (!(self instanceof Deck)) return new Deck()

    self.deck = new Array(52)
    var c = 0
        // i는 카드 모양, j는 카드의 값을 의미한다. 52개의 카드를 덱에 세팅한다.
    for (var i = 0; i < 4; i++) {
        for (var j = 1; j <= 13; j++) {
            self.deck[c++] = new Card(i, j)
        }
    }
    self.count = c
    debug('Deck check: ' + JSON.stringify(self.deck))
}
// 섞는 방법을 더 어렵게 해 볼수도 있겠다.
Deck.prototype.shuffle = function() {
    var self = this
    self.count = 4 * 13
    for (var i = self.count - 1; i > 0; i--) {
        var j = Math.floor((i) * Math.random())
        var temp = self.deck[i]
        if (!self.deck[i]) {
            debug('Deck check card: null i: ' + i)
        }
        if (!self.deck[j]) {
            debug('Deck check card: null j: ' + j)
        }
        self.deck[i] = self.deck[j]
        self.deck[j] = temp
    }
    debug('Deck check: ' + JSON.stringify(self.deck))
}

Deck.prototype.nextCard = function() {
    if (this.count === 0) {
        // throw 'this deck is out of card'
        this.emit('outofcard')
    }
    return this.deck[--this.count]
}

module.exports.Card = Card
module.exports.Deck = Deck