var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

server.listen(8080);

// routing
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Se almacenan los usuarios que se conectan al chat.
var usernames = {};

// Salas que están actualmente disponibles en el chat.
var rooms = ['Room1', 'Room2', 'Room3'];

// Inicia conección.
io.sockets.on('connection', function(socket) {

    // Cuando el cliente emite 'adduser', esta escucha y ejecuta.
    socket.on('adduser', function(username) {
        // Almacena los usuario en la sesión del socket.
        socket.username = username;
        // Almacena las salas en la sesión del socket.
        socket.room = 'Room1';
        // Agregar un usuario a la lista global de usuarios conectados.
        usernames[username] = username;
        // Agrega los usuarios  a sala uno por defecto.
        socket.join('Room1');
        // Emite un mensaje de 'usuario conectado' a la sala uno por defecto.
        socket.emit('updatechat', username, 'Se ha conectado a la Sala 1');
        // Emite un mensaje indicando que una persona se ha conectado a una sala.
        socket.broadcast.to('Room1').emit('username', '', ' se ha conectado a esta sala.');
        socket.emit('updaterooms', rooms, 'Room1');
    });

    // Cuando el usuario envia un mensaje 'sendchat', este se ejecuta enviando 2 parámetros
    socket.on('sendchat', function(data) {

        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    // El usuario puede cambiarse de sala.
    socket.on('switchRoom', function(newroom) {
        // se usa 'leave' para dejar la sala actual.
        socket.leave(socket.room);
        // se usa join para uniser a una nueva sala.
        socket.join(newroom);
        // se usa emit para comunicar que se ha conectado a una nueva sala.
        socket.emit('updatechat', 'SERVER', 'Se ha conectado a ' + newroom);
        // se envia un mensaje a todos los usuarios para indicar que el usuario se ha desconectado.
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' Ha dejado esta sala');
        // actualiza la sesión coon el nombre de la nueva sala.
        socket.room = newroom;
        // se envia un mensaje a todos los usuarios para indicar que el usuario se ha conectado.
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' se ha unido a esta sala');
        socket.emit('updaterooms', rooms, newroom);
    });


    // Deconección de los usuarios.
    socket.on('disconnect', function() {
        // Remueve el usuario de la lista global.
        delete usernames[socket.username];
        // actualización de los usuarios en el chat, del lado del cliente.
        io.sockets.emit('updateusers', usernames);
        // Envía un mensaje a todos los usuarios conectados indicando que un usuario se ha desconectado.
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' se ha desconectado');
        socket.leave(socket.room);
    });
});