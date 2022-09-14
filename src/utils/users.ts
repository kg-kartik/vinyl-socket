interface Users{
    id:string
    username:string
    room:string
}

const users:Array<Users> = [];

// Join user to chat
export const userJoin = (id:any, username:any, room:any):Users => {
  const user = { id, username, room };

  users.push(user);

  return user;
}

// Get current user
export const getCurrentUser = (id:any):Users => {
  return users.find(user => user.id === id);
}

// User leaves chat
export const userLeave = (id:any):Users => {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
export const getRoomUsers = (room:any):Array<Users> => {
  return users.filter(user => user.room === room);
}


