import dotenv from 'dotenv';
import 'reflect-metadata';
import { Server as HttpServer, createServer } from 'http';
import Websocket from './socket';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';

class Server {
  app: express.Express;
  httpServer: HttpServer;
  io: SocketIOServer;
  users: Record<string, any[]>;
  socketToRoom: Record<string, string>;
  maximum: number;
  HOST: string;
  PORT: number;
  constructor() {
    dotenv.config();
    this.users = {};
    this.maximum = 2;
    this.socketToRoom = {};
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = Websocket.getInstance(this.httpServer);
    this.HOST = process.env.HOST || 'localhost';
    this.PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

    this.initializeMiddleware();
    this.initializeWebSocket();
    this.startServer();
  }

  initializeMiddleware() {
    this.app.use(cors());
    this.app.use(helmet());
  }

  initializeWebSocket() {
    this.io.on('connection', (socket) => {
      socket.on('join_room', (data) => this.handleJoinRoom(socket, data));
      socket.on('offer', (sdp) => this.handleOffer(socket, sdp));
      socket.on('answer', (sdp) => this.handleAnswer(socket, sdp));
      socket.on('candidate', (candidate) => this.handleCandidate(socket, candidate));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  handleJoinRoom(socket, data) {
    if (this.users[data.room]) {
      const length = this.users[data.room].length;
      console.log('length users: ', length);
      if (length === this.maximum) {
        socket.to(socket.id).emit('room_full');
        return;
      }
      this.users[data.room].push({ id: socket.id });
    } else {
      this.users[data.room] = [{ id: socket.id }];
    }
    console.log('this.users[data.room]', this.users[data.room]);
    // Client socket join this room
    this.socketToRoom[socket.id] = data.room;
    socket.join(data.room);
    console.log(`[${this.socketToRoom[socket.id]}]: ${socket.id} enter`);

    //The server notifies the current client about which user is in this room.
    const usersInThisRoom = this.users[data.room].filter((user) => user.id !== socket.id);
    console.log('usersInThisRoom', usersInThisRoom);
    this.io.sockets.to(socket.id).emit('all_users', usersInThisRoom);
    console.log('User in this room: ', usersInThisRoom);

    // console.log('this.users', this.users);
    // console.log('this.socketToRoom', this.socketToRoom);
  }

  handleOffer(socket, sdp) {
    console.log('offer: ' + socket.id);
    socket.broadcast.emit('getOffer', sdp);
  }

  handleAnswer(socket, sdp) {
    console.log('answer: ' + socket.id);
    socket.broadcast.emit('getAnswer', sdp);
  }

  handleCandidate(socket, candidate) {
    console.log('candidate: ' + socket.id);
    socket.broadcast.emit('getCandidate', candidate);
  }

  handleDisconnect(socket) {
    console.log(`[${this.socketToRoom[socket.id]}]: ${socket.id} exit`);
    const roomID = this.socketToRoom[socket.id];
    let room = this.users[roomID];
    if (room) {
      room = room.filter((user) => user.id !== socket.id);
      this.users[roomID] = room;
      if (room.length === 0) {
        delete this.users[roomID];
        return;
      }
    }
    socket.broadcast.to(room).emit('user_exit', { id: socket.id });
    console.log(this.users);
  }

  startServer() {
    this.httpServer.listen(this.PORT, () => {
      console.log(`Server running at http://${this.HOST}:${this.PORT}`);
    });
  }
}

const server = new Server();
