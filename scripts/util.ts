import { v4 as uuidv4 } from 'uuid';

export function uuid(){return uuidv4()}
export function makeid(length: any) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789?!=+-*_.,/[]{}';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}
export function getConfig() {
    if (typeof window == 'undefined') {return null}
    let id = localStorage.getItem("id")
    let uname = localStorage.getItem("name")
    let color = localStorage.getItem("color")
    let sestok = localStorage.getItem("token")
    if(id==null)
    {
        id = "client_" + uuidv4()
        localStorage.setItem("id", id)
    }

    if(sestok==null)
    {
        sestok = "token_"+makeid(64)
        localStorage.setItem("token", sestok)
    }

    return {id:id,name:uname,token:sestok, color:color}
}

export function getImageDimensions(file: any) {
    return new Promise (function (resolved, rejected) {
      var i = new Image()
      i.onload = function(){
        resolved({w: i.width, h: i.height})
      };
      i.src = file
    })
  }

export function getColor(id:string){
    switch(id){
        case "blue":
            return "bg-gradient-to-r from-cyan-200 via-cyan-500 to-green-300"
        case "green":
            return "bg-gradient-to-r from-sky-400 via-green-500 to-lime-400"
        case "yellow":
            return "bg-gradient-to-r from-orange-400 via-yellow-300 to-lime-400"
        case "orange":
            return "bg-gradient-to-r from-red-600 via-orange-400 to-yellow-500"
        case "red":
            return "bg-gradient-to-r from-yellow-600 via-red-700 to-pink-900"
        default: 
            return "bg-gray-400"
    }
}