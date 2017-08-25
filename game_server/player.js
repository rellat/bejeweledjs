var Util = require('./game_util')

/**
 * Player
 * @param {*} options {id, is_dealer, money_on_hand}
 */
function Player(options) {
    var self = this
    if (!(self instanceof Player)) return new Player(options)

    self.id = options.id
    self.is_dealer = options.is_dealer || false
    self.cards = []
    self.actions = []
    self.history = []
    self.state = Util.PLAYERSTATES.DROP

    self.moneyOnHand = options.money_on_hand || 0
    self.betOnTurn = 0
}
Player.prototype.getCards = function() {
    return this.cards
}
Player.prototype.pushCard = function(card) {
    var self = this
    self.cards.push(card)
    var score = self.getScore()
    if (score > 21) {
        self.state = Util.PLAYERSTATES.BUST
    } else if (score == 21 && !self.history.length) {
        self.state = Util.PLAYERSTATES.BLACKJACK
    }
}
Player.prototype.emptyCards = function() {
    var self = this
    self.cards = []
    self.history = []
    self.state = Util.PLAYERSTATES.DROP
}

/** Can a player split their dealt cards.
 * @return {Boolean}
 */
Player.prototype.canSplit = function() {
    var self = this
        // The dealer can never split their cards
    if (self.is_dealer) { return false }

    var cards = this.cards
    if (cards.length === 2 && cards[0].rank === cards[1].rank) { return true }
    return false
}

/** Can a player double down their hand.
 * @return {Boolean}
 */
Player.prototype.canDouble = function() {
    var self = this
        // The dealer can never double down
    if (self.is_dealer) { return false }
    if (self.moneyOnHand < self.betOnTurn * 2) { return false }
    // A double down is only allowed on the first play or after a split
    if (this.history.length === 0 || this.history[this.history.length - 1] === Util.ACTIONS.SPLIT) { return true }
    return false
}

/** Get a list of possible actions for the player.
 * @return {Array}
 */
Player.prototype.getActions = function() {
    var total = Util.score(this.cards)
    this.actions = []
    if (total < 21) {
        this.actions.push(Util.ACTIONS.HIT)
        this.actions.push(Util.ACTIONS.STAND)
    } else if (total == 21) {
        this.actions.push(Util.ACTIONS.STAND)
    }
    if (this.canDouble.call(this)) { this.actions.push(Util.ACTIONS.DOUBLE) }
    // if (this.canSplit.call(this)) { this.actions.push(Util.ACTIONS.SPLIT) }
    return this.actions
}

Player.prototype.getScore = function() {
    return Util.score(this.cards)
}

Player.prototype.doAction = function(action) {
    var self = this
    if (action == Util.ACTIONS.DEAL) {
        self.state = Util.PLAYERSTATES.DEAL
    } else if (action == Util.ACTIONS.DROP) {
        self.state = Util.PLAYERSTATES.DROP
    } else if (action == Util.ACTIONS.HIT) {
        // nothing to do
    } else if (action == Util.ACTIONS.STAND) {
        self.state = Util.PLAYERSTATES.STAND
    } else if (action == Util.ACTIONS.DOUBLE && self.canDouble.call(self)) {
        // nothing to do
    } else if (action == Util.ACTIONS.SPLIT && self.canSplit.call(self)) {
        // not implemented yet
    } else {
        throw 'cant make the action'
    }
    self.history.push(action)
}
module.exports = Player