import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('');
  const [typing, setTyping] = useState('');
  const [privateRecipient, setPrivateRecipient] = useState('');
  const [privateMessage, setPrivateMessage] = useState('');
  const [privateMessages, setPrivateMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messageHistory, setMessageHistory] = useState([]);

  useEffect(() => {
    socket.on('userJoined', (message) => {
      setMessages((prevMessages) => [...prevMessages, { username: 'System', message }]);
      setNotifications((prevNotifications) => [...prevNotifications, { type: 'join', message }]);
    });

    socket.on('userLeft', (message) => {
      setMessages((prevMessages) => [...prevMessages, { username: 'System', message }]);
      setNotifications((prevNotifications) => [...prevNotifications, { type: 'leave', message }]);
    });

    socket.on('systemMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, { username: 'System', message }]);
    });

    socket.on('messageHistory', (history) => {
      setMessages(history);
    });

    socket.on('newMessage', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on('typing', (message) => {
      setTyping(message);
    });

    // Fetch the list of available rooms from the server
    socket.emit('getRooms', (availableRooms) => {
      setRooms(availableRooms);
    });

    socket.on('privateMessage', ({ from, message }) => {
      setPrivateMessages((prevPrivateMessages) => [...prevPrivateMessages, { username: from, message }]);
    });

    socket.on('messageHistory', (history) => {
      setMessageHistory(history);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (username.trim() === '' || room.trim() === '') {
      alert('Please enter a username and room');
      return;
    }

    // Join the selected room
    socket.emit('joinRoom', { username, room });
    setCurrentRoom(room);
    setMessages([]); // Clear messages when switching rooms
  };

  const sendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('sendMessage', { username, room: currentRoom, message });
      setMessage('');
    }
  };

  const sendTypingEvent = () => {
    socket.emit('typing', { username, room: currentRoom });
  };

  const sendPrivateMessage = () => {
    if (privateMessage.trim() !== '' && privateRecipient.trim() !== '') {
      // Send the private message to the server
      socket.emit('privateMessage', { from: username, to: privateRecipient, message: privateMessage });
      setPrivateMessage('');
      setPrivateRecipient('');
    }
  };

  return (
    <div>
      <div>
        <label>Username: </label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label>Room: </label>
        <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
      </div>
      <div>
        <h1>Messages in Room: {currentRoom}</h1>
        <ul>
          {messageHistory.map((msg, index) => (
            <li key={index}>{`${msg.username}: ${msg.message}`}</li>
          ))}
        </ul>
        <div>{typing}</div>
        <div>
          <label>Message: </label>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onInput={sendTypingEvent} />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
      <div>
        <h1>Available Rooms</h1>
        <ul>
          {rooms.map((roomName, index) => (
            <li key={index}>{roomName}</li>
          ))}
        </ul>
      </div>
      <div>
        <h1>Private Messages</h1>
        <ul>
          {privateMessages.map((msg, index) => (
            <li key={index}>{`${msg.username}: ${msg.message}`}</li>
          ))}
        </ul>
        <div>
          <label>Recipient: </label>
          <input type="text" value={privateRecipient} onChange={(e) => setPrivateRecipient(e.target.value)} />
          <label>Message: </label>
          <input type="text" value={privateMessage} onChange={(e) => setPrivateMessage(e.target.value)} />
          <button onClick={sendPrivateMessage}>Send Private Message</button>
        </div>
      </div>
      <div>
        <h1>Notifications</h1>
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>{notification.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
