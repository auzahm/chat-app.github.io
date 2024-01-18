const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const messageHistory = {};

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);

    if (!messageHistory[room]) {
      messageHistory[room] = [];
    }

    const joinMessage = `${username} has joined the room`;
    io.to(room).emit('userJoined', joinMessage);

    socket.emit('messageHistory', messageHistory[room]);
    socket.broadcast.to(room).emit('systemMessage', joinMessage);
  });

  socket.on('sendMessage', ({ username, room, message }) => {
    const newMessage = { username, message };
    messageHistory[room].push(newMessage);

    if (messageHistory[room].length > 10) {
      messageHistory[room].shift();
    }

    io.to(room).emit('newMessage', newMessage);
  });

  socket.on('privateMessage', ({ from, to, message }) => {
    io.to(to).emit('privateMessage', { from, message });
  });

  socket.on('typing', ({ username, room }) => {
    socket.to(room).emit('typing', `${username} is typing...`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    // Notify room members about the user leaving
    const username = messageHistory[currentRoom] && messageHistory[currentRoom].find(user => user.userId === socket.id)?.username;
    const leaveMessage = username ? `${username} has left the room` : 'A user has left the room';
    io.to(currentRoom).emit('userLeft', leaveMessage);
  });
});

const port = 3001;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
