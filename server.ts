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
import axios from "axios";

require("dotenv").config();

import {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getUsers,
} from "./src/utils/users";
import API from "./src/utils/request";
import { getTracks, tracksSeed } from "./src/utils/tracks";

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

dotenv.config();


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

	//joining room using socket id
	socket.join(user.room);
	console.log(socket.id)

	if(data.type === "admin"){
	  const addToRedis = async () => {
		try {
		  const response = await API.post("/room/create",{
		      admin_id:data.username,
			  room_id:data.room_id,
		  })
		  
		  console.log(response.data);

		  const tracksRes = await API.post("/questions/create",{
			track_ids:data.track_ids,
			room_id:data.room_id
		  })
 
          const testVar = tracksSeed(tracksRes.data);		 

		  console.log(testVar,"test");
		}
		catch (err) {
			//catch err
			console.log(err);
		}
	  }
	
	  addToRedis();
	}
	else{
	  const addToRedis = async () => {
		try {
		  const response = await API.post("/room/add_player",{
			room_id:data.room,
			user_id:data.username
		  })
  
		  console.log(response.data);
		}
		catch (err) {
		  //catch err
		  console.log(err);
		}
	  }
  
	  addToRedis();
	}

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
  	socket.on("chatMessage", (msg:any,roomId:any,id:any) => { 

	//!todo answer validation

	// const answerCheck = async () => {
	// 	try {
	// 	      const res = await API.post("/questions/fetch", {
	// 			roomId,
	// 		});
	
	// 		return res.data;
	// 	} catch (error) {
	// 		console.error(error);
	// 	}
	// }

	// const result = answerCheck();

	// result.map((res:any) => {
	// 	if(res.id === id){
	// 		if(res.name === msg){
	// 		}
	// 	}
	// })
	
	
		const user = getCurrentUser(socket.id);
		io.to(user.room).emit("message", formatMessage(user.username, msg));
	
  	});

  	socket.on("startGame",(data:any) => {
		var counter = 10;
	
		let user = getCurrentUser(socket.id);

		io.to(user.room).emit("tracksData",getTracks());

		var roundCountdown = setInterval(() => {
	
			io.to(user.room).emit('counter', counter);
		
			counter--;
	
			if (counter === 0) {
				//next round
				clearInterval(roundCountdown);
			}
		}, 1000);

	}) 


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