function Socket(server, parseApacheLog) {
    var io = require('socket.io')(server);

    parseApacheLog.attachCallback((data) => {
        io.emit("updated_data", data);
    });
}

module.exports = Socket;
