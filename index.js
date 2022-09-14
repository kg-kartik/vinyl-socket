const socket = io();

var username,room;

console.log("lol");

const addInput = () => {
    console.log("lol");
    username = document.getElementsByName("username").value;
    room = document.getElementsByName("room").value;
}

socket.emit("joinRoom",{username,room});

socket.on("roomUsers",({room,users}) => {
    console.log(room,"room");
    console.log(users,"users");
})