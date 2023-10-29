import { io } from 'socket.io-client';

// const socketRef: SocketIOClient.Socket = null;

const SOCKET_SERVER_URL = 'http://localhost:8000';
const socket = io(SOCKET_SERVER_URL);

socket.emit('join_room', {
  room: '1234',
});

console.log('Connect');

// socket.disconnect();

// console.log('Disconnect');
