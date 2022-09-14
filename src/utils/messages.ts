const moment = require('moment');

export const formatMessage = (username:any, text:any) =>{
  return {
    username,
    text,
    time: moment().format('h:mm a')
  };
}

