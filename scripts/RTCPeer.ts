import {FileChunker} from './FileChunker'
import {FileDigester} from './FileDigester'
import {Events} from './Events'
import {makeid} from "./util"
var Peer = require("simple-peer")
export class RTCPeer {
    initiator: any;
    peer: any;
    socket: any;
    connected: any;
    _chunker: FileChunker | undefined;
    _filesQueue: any[];
    _busy: boolean;
    _lastProgress: number | undefined;
    _digester: FileDigester | undefined;
    _reader: any;
    remote: any;
    local: any;
    history: any[];
    state: string;
    accepted: boolean
    constructor(local: any, remote: any, initiator: boolean) {
      this.remote = remote
      this.local = local
      this.initiator = initiator
      this.peer = new Peer({initiator: initiator,trickle: false})
      this.connected = null
      this._filesQueue = [];
      this._busy = false;
      this.state = "Peer initialized. Waiting for signal..."
      this.history = []
      this.accepted = false
  
      this.peer.on("signal", (data: any) => {
        console.log("signal...")
        if(this.initiator == true) {
          console.log("sending offer via websocket...")
          this.state = "sending offer..."
          Events.fire("state-changed",this.state)
          Events.fire("offer",{sgn:data,to:this.remote, from:this.local})
        } else {
          console.log("sending acception via websocket...")
          this.state = "sending acception..."
          Events.fire("state-changed",this.state)
          Events.fire("accept",{sgn:data,to:this.remote, from:this.local})
        }
      })
  
      this.peer.on("connect", () => {
        this.state = "connected"
        Events.fire("state-changed",this.state)
        console.log("connected!!!!!!") //DEBUG
        this.connected = true
  
        Events.fire("connected", {})
  
        if (this._busy) return;
        this._dequeueFile();
  
      })
  
      this.peer.on('data', (data: any) => {
        this._onMessage(data)
      })
  
      this.peer.on('close', (data: any) => {
        console.log('rtc connection closed') //DEBUG
        this.connected = false
        Events.fire("close", this)
        Events.fire("disconnect",{id:this.remote.id})
      })
  
      Events.on("send-text", (t) => {
        this.sendText(t)
      })
  
      this.peer.on('error', (err:any) => {console.log('error', err); Events.fire("error",{err:err,id:this.remote.id})})
    }
  
    getHistory(): any {
      return this.history
    }
  
    getFile(id:any) {
      for (let i = 0; i < this.history.length; i++) {
        const h = this.history[i];
        if(h.data.id == id && h.type == "data" && h.sender != this.local.id) {
          return h.data.blob
        }
      }
      return null
    }
  
    sendFiles(files: any) {
      for (let i = 0; i < files.length; i++) {
          this._filesQueue.push(files[i]);
      }
      if(!this.connected) {return}
      if (this._busy) return;
      this._dequeueFile();
    }
  
    _dequeueFile() {
        if (!this._filesQueue.length) return;
        this._busy = true;
        const file: any = this._filesQueue.shift();
        this._sendFile(file);
    }
  
    _send(data: any) {
      if(this.connected) {
        this.peer.send(data)
      }
    }
  
    _sendMessage(data: any) {
      this._send(data)
    }
  
    _onMessage(data:any){
      try {data = JSON.parse(data.toString())} catch(err){
        this._onChunkReceived(data)
        return
      }
      if(data.type == undefined) {return}
      switch(data.type) {
        case "header":
          console.log("header received")//DEBUG
          this._onFileHeader(data);
          break;
        case 'partition':
          console.log("partition received")//DEBUG
            this._onReceivedPartitionEnd(data);
            break;
        case 'partition-received':
            this._sendNextPartition();
            break;
        case 'progress':
            console.log("progress:",data.progress)
            this._onDownloadProgress(data.progress, data.id);
            break;
        case 'transfer-complete':
            this._onTransferCompleted(data.id);
            break;
        case 'text':
          this._onTextReceived(data);
          break;
      }
    }
  
    _onFileHeader(header: any) {
      this._lastProgress = 0;
      this._digester = new FileDigester({
          name: header.name,
          mime: header.mime,
          size: header.size,
          id: header.id
      },  (file: any) => this._onFileReceived(file));
    }
  
    _onFileReceived(proxyFile: any) {
      //Events.fire('file-received', proxyFile);
      this.updateHistory("data", proxyFile, this.remote);
      this.sendJSON({ type: 'transfer-complete', id:proxyFile.id });
    }
  
    _onChunkReceived(chunk: any) {
      if(!chunk.byteLength) return;
      if(this._digester == undefined) {return}
  
      this._digester.unchunk(chunk);
      const progress = this._digester.progress;
      this._onDownloadProgress(progress,this._digester._id);
  
      // occasionally notify sender about our progress
      if(progress==undefined) {return}
      if(this._lastProgress==undefined) {return}
      if (progress - this._lastProgress < 0.01) return;
      this._lastProgress = progress;
      this._sendProgress(progress, this._digester._id);
    }
  
    _onDownloadProgress(progress: any, id:any) {
      Events.fire('file-progress', { sender: this.local, progress: progress, id:id });
    }
  
    _sendFile(file: any) {
      let id = makeid(16)
      this.sendJSON({
          type: 'header',
          name: file.name,
          mime: file.type,
          size: file.size,
          id: id
      });
      this._chunker = new FileChunker(file,
        (chunk: any) => this._send(chunk),
        (offset: any) => this._onPartitionEnd(offset));
      this._chunker.nextPartition();
      file.id = id
      this.updateHistory("data", file, this.local)
    }
  
    _onPartitionEnd(offset: any) {
      this.sendJSON({ type: 'partition', offset: offset });
    }
  
    _onReceivedPartitionEnd(offset: any) {
      this.sendJSON({ type: 'partition-received', offset: offset });
    }
  
    _onTransferCompleted(id:any) {
      this._onDownloadProgress(1,id);
      this._reader = null;
      this._busy = false;
      this._dequeueFile();
      Events.fire('notify-user', 'File transfer completed.');
    }
  
    _sendNextPartition() {
      if (!this._chunker || this._chunker.isFileEnd()) return;
      this._chunker.nextPartition();
    }
  
    _sendProgress(progress: any, id: string) {
      this.sendJSON({ type: 'progress', progress: progress, id:id });
    }
  
    sendJSON(json:any) {
      this._sendMessage(JSON.stringify(json))
    }
  
    sendText(text: any) {
      const unescaped = btoa(unescape(encodeURIComponent(text)));
      this.sendJSON({ type: 'text', text: unescaped });
      this.updateHistory("text", text,this.local);
  }
    updateHistory(type:string, data:any, sender:any) {
      let obj: any = {type:type, data:data, sender:sender, timestamp:Date.now()};
      if(type === 'data') {
        obj.timeout = false
        if(sender.id == this.local.id) {
          if(obj.data.size> 1e7){obj.warning = true}
          this.history.push(obj)
          Events.fire("append-history",null)
          return
        }
        if(data.size > 1e7) {
          let TIME = 30000
          console.log("too largeeeee")
          obj.timeout = true
          obj.deletingTime = Date.now() + TIME
          setTimeout((id:any) => {
            let r: any= null
            for (let i = 0; i < this.history.length; i++) {
              const e = this.history[i];
              if(e.data.id == id) {r = i; break}
            }
            if(r == null) {console.log("not found lol"); return}
            console.log("deleting lol")
            this.history.splice(r,1)
            Events.fire("append-history",null)
          }, TIME, data.id)
        }
        if(!this.iOS()) {
          obj.dataURL = URL.createObjectURL(data.blob)
          data.blob = null
          this.history.push(obj)
          Events.fire("append-history",null)
          return
        }
        // XXX MAY BE BAD FOR PERFOMANCE
        let reader = new FileReader();
        reader.onload = e => {
          obj.dataURL = reader.result
          data.blob = null
          this.history.push(obj)
          Events.fire("append-history",null)
        }
        reader.readAsDataURL(data.blob)
        return
      } else {
        this.history.push(obj)
        Events.fire("append-history",null)
      }
  
    }

    iOS() {
      return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
      ].includes(navigator.platform)
      // iPad on iOS 13 detection
      || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    }
  
    _onTextReceived(message: any) {
        const escaped = decodeURIComponent(escape(atob(message.text)));
        this.updateHistory("text",escaped,this.remote)
        Events.fire('text-received', { text: escaped, sender: this.remote });
    }
  
  
  }
  