var socketio = require('socket.io')
var RoomManager = require('./roommanager')

module.exports = function(server) {
    var io = socketio.listen(server)
    var roomManager = new RoomManager(io)

    io.on('connection', function(socket) {
        socket.on('join', function(message) {
            // attach room manager
            roomManager.requestGameRoom(socket)
        })

        socket.on('disconnect', function() {
            console.log('Client has disconnected: ' + socket.id)
            roomManager.userDisconnect(socket)
        })
    })
}
