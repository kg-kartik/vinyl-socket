const moment = require('moment');

export const formatMessage = (username:string, text:string,correct?:boolean) =>{
  return {
    username,
    text,
    correct,
    time: moment().format('h:mm a')
  };
}

