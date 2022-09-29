interface track{
    name:string
    image:string
    url:string
    question_id:string
}

let Tracks:Array<track> = [];

export const tracksSeed = (tracksArr:track[]) => {
    Tracks = tracksArr;

    return Tracks;
}

export const getTracks = () => {
    return Tracks;
}
