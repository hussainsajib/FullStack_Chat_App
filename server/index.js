const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const { addUser, removeUser, getUser, getUsersInroom } = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket)=>{
    socket.on('join', ({name, room}, callback)=>{
        const { error, user } = addUser({ id: socket.id, name, room });
        
        if(error) return callback(error);

        // adding a user to a particular room
        socket.join(user.room);

        // letting the user who joined know that he/she has joined the room
        socket.emit('message', { user: 'admin', text: `${user.name} welcome to the room ${user.room}`});
        // letting everyone else in the room know that a new user has joined
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`});

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInroom(user.room)});

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        console.log(user);
        io.to(user.room).emit('message',{ user: user.name, text: message });
        io.to(user.room).emit('roomData',{ room: user.name, users: getUsersInroom(user.room) });
        callback();
    });

    socket.on('disconnect',()=>{
        const user = removeUser(socket.io);
        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.`});
        }
    });
});

app.use(router);

server.listen(PORT, ()=> console.log(`Server has started on port ${PORT}`));