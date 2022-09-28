const bodyParser = require("body-parser");
import express from "express";
const app = express();
import cors from "cors";
import dotenv from "dotenv";
import mongoose, { ConnectOptions } from "mongoose";
import { ErrorHandler } from "./src/middlewares/errorHandler";
import Users from "./src/routes/Users";
import {formatMessage} from "./src/utils/messages";
import {createAdapter} from "@socket.io/redis-adapter";
import * as redis from "redis";

require("dotenv").config();

import {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getUsers,
} from "./src/utils/users";

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

dotenv.config();

// const db: string = process.env.MONGO_URI;
// console.log(db);

// mongoose
//     .connect(db, {
//         useNew Parser: true,
//         useUnifiedTopology: true
//     } as ConnectOptions)
//     .then(() => {
//         console.log("databse ");
//     })
//     .catch((err) => {
//         console.log("Error connecting to the database", err);
//     });

const PORTNUMBER: number = parseInt(process.env.PORT) || 5000;

app.use("/user", Users);

app.use(ErrorHandler);

var server = app.listen(PORTNUMBER, (): void => {
    console.log(`Server is running on ${PORTNUMBER}`);
});

var io = require("socket.io")(server,{
  cors: {
    // origin: "http://localhost:3000/",
    methods: ["GET", "POST"]
  }
});

const botName = "ChatCord Bot";
  
  // Run when client connects
io.on("connection", (socket:any) => {

  console.log("connected");

  socket.on("joinRoom", (data:any) => {
    
    console.log("joined");
    //!todo add user to redis
    const user = userJoin(socket.id, data.username, data.room);

    console.log(user,"userr");

    socket.join(user.room);
    console.log(socket.id)

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // Broadcast when a user connects
    //send to everyone except to the sender
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });

  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg:any) => { 
    const user = getCurrentUser(socket.id);
    console.log(socket.id);

    console.log(user,"user");
  // socket.emit("message", "Hi this is a test message from server "+msg);
    if(user) {
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    }
  });

  socket.emit("getUsers",getUsers());

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
  
});