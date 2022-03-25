import type { NextPage } from 'next'
import {useState, useEffect} from "react"

import {Member} from "./Network"

import { motion, AnimatePresence } from "framer-motion"

import * as Icon from 'react-bootstrap-icons';

var Peer = require("simple-peer")

import Modal from "./components/Modal/Modal"

import Space from './components/Space';
import { SP } from 'next/dist/shared/lib/utils';

class RTCPeer {
  remote_id: any;
  local_id: any;
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
  constructor(local: any, remote: any, initiator: boolean) {
    this.remote_id = remote
    this.local_id = local
    this.initiator = initiator
    this.peer = new Peer({initiator: initiator,trickle: false})
    this.connected = null
    this._filesQueue = [];
    this._busy = false;

    this.peer.on("signal", (data: any) => {
      console.log("signal...")
      if(this.initiator == true) {
        console.log("sending offer via websocket...")
        Events.fire("offer",{sgn:data,to:this.remote_id, from:this.local_id})
      } else {
        console.log("sending acception via websocket...")
        Events.fire("accept",{sgn:data,to:this.remote_id, from:this.local_id})
      }
    })

    this.peer.on("connect", () => {
      console.log("connected!!!!!!")
      this.connected = true
      Events.fire("connected", {})

      if (this._busy) return;
      this._dequeueFile();

    })
    this.peer.on('data', (data: any) => {
      //Events.fire("data", {data:data,peer:this})
      this._onMessage(data)
    })

    this.peer.on('close', (data: any) => {
      console.log('rtc connection closed'.toString())
      this.connected = false
      Events.fire("close", this)
    })

    this.peer.on('error', (err:any) => console.log('error', err))
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
        console.log("header received")
        this._onFileHeader(data);
        break;
      case 'partition':
        console.log("partition received")
          this._onReceivedPartitionEnd(data);
          break;
      case 'partition-received':
          this._sendNextPartition();
          break;
      case 'progress':
        console.log("progress:",data.progress)
          this._onDownloadProgress(data.progress);
          break;
      case 'transfer-complete':
          this._onTransferCompleted();
          break;
    }
  }

  _onFileHeader(header: any) {
    this._lastProgress = 0;
    this._digester = new FileDigester({
        name: header.name,
        mime: header.mime,
        size: header.size
    },  (file: any) => this._onFileReceived(file));
  }

  _onFileReceived(proxyFile: any) {
    Events.fire('file-received', proxyFile);
    this.sendJSON({ type: 'transfer-complete' });
  }

  _onChunkReceived(chunk: any) {
    if(!chunk.byteLength) return;
    
    this._digester.unchunk(chunk);
    const progress = this._digester.progress;
    this._onDownloadProgress(progress);

    // occasionally notify sender about our progress 
    if (progress - this._lastProgress < 0.01) return;
    this._lastProgress = progress;
    this._sendProgress(progress);
  } 

  _onDownloadProgress(progress: any) {
    Events.fire('file-progress', { sender: this.local_id, progress: progress });
  }

  _sendFile(file: { name: any; type: any; size: any; }) {
    this.sendJSON({
        type: 'header',
        name: file.name,
        mime: file.type,
        size: file.size
    });
    this._chunker = new FileChunker(file,
      (chunk: any) => this._send(chunk),
        (offset: any) => this._onPartitionEnd(offset));
    this._chunker.nextPartition();
  }

  _onPartitionEnd(offset: any) {
    this.sendJSON({ type: 'partition', offset: offset });
  }

  _onReceivedPartitionEnd(offset: any) {
    this.sendJSON({ type: 'partition-received', offset: offset });
  }

  _onTransferCompleted() {
    this._onDownloadProgress(1);
    this._reader = null;
    this._busy = false;
    this._dequeueFile();
    Events.fire('notify-user', 'File transfer completed.');
  }

  _sendNextPartition() {
    if (!this._chunker || this._chunker.isFileEnd()) return;
    this._chunker.nextPartition();
  }

  _sendProgress(progress: any) {
    this.sendJSON({ type: 'progress', progress: progress });
  }

  sendJSON(json:any) {
    this._sendMessage(JSON.stringify(json))
  }

}

class FileChunker {
  _chunkSize: number;
  _maxPartitionSize: number;
  _offset: number;
  _partitionSize: number;
  _file: any;
  _onChunk: any;
  _onPartitionEnd: any;
  _reader: FileReader;

  constructor(file: any, onChunk: any, onPartitionEnd: any) {
      this._chunkSize = 64000; // 64 KB
      this._maxPartitionSize = 1e6; // 1 MB
      this._offset = 0;
      this._partitionSize = 0;
      this._file = file;
      this._onChunk = onChunk;
      this._onPartitionEnd = onPartitionEnd;
      this._reader = new FileReader();
      this._reader.addEventListener('load', e => this._onChunkRead(e.target.result));
  }

  nextPartition() {
      this._partitionSize = 0;
      this._readChunk();
  }

  _readChunk() {
      const chunk = this._file.slice(this._offset, this._offset + this._chunkSize);
      this._reader.readAsArrayBuffer(chunk);
  }

  _onChunkRead(chunk: any) {
      this._offset += chunk.byteLength;
      this._partitionSize += chunk.byteLength;
      this._onChunk(chunk);
      if (this._isPartitionEnd() || this.isFileEnd()) {
          this._onPartitionEnd(this._offset);
          return;
      }
      this._readChunk();
  }

  repeatPartition() {
      this._offset -= this._partitionSize;
      this._nextPartition();
  }
  _nextPartition() {
    throw new Error('Method not implemented.');
  }

  _isPartitionEnd() {
      return this._partitionSize >= this._maxPartitionSize;
  }

  isFileEnd() {
      return this._offset >= this._file.size;
  }

  get progress() {
      return this._offset / this._file.size;
  }
}

class FileDigester {
  _buffer: any[];
  _bytesReceived: number;
  _size: any;
  _mime: string;
  _name: any;
  _callback: any;
  progress: number | undefined;

  constructor(meta: { size: any; mime: string; name: any; }, callback: any) {
      this._buffer = [];
      this._bytesReceived = 0;
      this._size = meta.size;
      this._mime = meta.mime || 'application/octet-stream';
      this._name = meta.name;
      this._callback = callback;
  }

  unchunk(chunk: any) {
      this._buffer.push(chunk);
      this._bytesReceived += chunk.byteLength || chunk.size;
      const totalChunks = this._buffer.length;
      this.progress = this._bytesReceived / this._size;
      if (isNaN(this.progress)) this.progress = 1

      if (this._bytesReceived < this._size) return;
      // we are done
      let blob = new Blob(this._buffer, { type: this._mime });
      this._callback({
          name: this._name,
          mime: this._mime,
          size: this._size,
          blob: blob
      });
  }

}

class Events {
  static fire(type: string, detail: any) {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
  }

  static on(type: any, callback: (this: Window, ev: any) => any) {
      return window.addEventListener(type, callback, false);
  }

  static off(type: any, callback: (this: Window, ev: any) => any) {
    return window.removeEventListener(type, callback, false);
}
}

export default function MemberList({socket, client, action}: any){
    const [members, setMembers] = useState<Member[]>([])

    const [peers, setPeers] = useState<RTCPeer[]>([])

    const [space, setSpace] = useState<any | null>(null)


    useEffect(()=>{
      if(socket === null) {return}
      console.log("subscrubing to event listeners")

      Events.on("offer", (data: any) => {
        socket.emit("offer",{sgn:data.detail.sgn,to:data.detail.to, from:data.detail.from})
      })

      Events.on("accept", (data: any) => {
        socket.emit("accept",{sgn:data.detail.sgn,to:data.detail.to, from:data.detail.from})
      })

      Events.on("close", (data: any) => {
      })

      Events.on("notify-user", (data: any) => {
        console.log(data.detail)
      })

      Events.on("file-received", (data: any) => {
        console.log(data.detail)
      })

      Events.on("data", (data:any) => {
        console.log(data.detail.data.toString())
      })
      return () => {
        console.log("desubscribint to old event listeners")
        Events.off("offer", (e)=>{})
        Events.off("accept", (e)=>{})
        Events.off("data", (e)=>{})
        Events.off("close", (e)=>{})
      };
    },[socket])

    useEffect(() => {
      console.log("refreshing peers...")
      let refreshedPeers = peersToArray()
      let r = 0
      for (let i = 0; i < peers.length; i++) {
        const p = peers[i];
        if(p.connected == false) {
          console.log("removing peer to", p.remote_id)
          refreshedPeers.splice(i,1)
          r += 1
        }
      }
      setPeers(refreshedPeers)
      console.log("refreshing finished. removed "+r+" peers")
    },[members])

    let initPeer = (member: any) => {
      if(hasPeer(member.id)) {console.log("client has already a running peer with id " + member.id); return null}
      let p = new RTCPeer(client.id, member.id, true)
      setPeers(peersPushArray(p))
      console.log("added new peer to list. waiting for signal...")
      return p
    }

    let acceptPeer = (data: any) => {
      let p = new RTCPeer(client.id, data.from, false)
      p.peer.signal(data.sgn)
      setPeers(peersPushArray(p))
    }

    let hasPeer = (id: any) => {
      for (let i = 0; i < peers.length; i++) {
        const p = peers[i];
        if(p.remote_id == id) {return true}
      }
      return false
    }

    let getPeer = (id: any) => {
      for (let i = 0; i < peers.length; i++) {
        const p = peers[i];
        if(p.remote_id == id) {return p}
      }
      return null
    }

    let peersPushArray = (p: RTCPeer): RTCPeer[] => {
      let arr: RTCPeer[] = []
      for (let i = 0; i < peers.length; i++) {
        const element = peers[i];
        arr.push(element)
      }
      arr.push(p)
      return arr
    }

    let peersToArray = (): RTCPeer[] => {
      let arr: RTCPeer[] = []
      for (let i = 0; i < peers.length; i++) {
        const element = peers[i];
        arr.push(element)
      }
      return arr
    }

    let peersSpliceArray = (i: number): RTCPeer[] => {
      let arr: RTCPeer[] = []
      for (let i = 0; i < peers.length; i++) {
        const element = peers[i];
        arr.push(element)
      }
      arr.splice(i, 1)
      return arr
    }

    let quickSpace = (files: any, member:any) => {
      let peer: RTCPeer | null = getPeer(member.id)
        if(peer == null) {
          peer = initPeer(member)
          if(peer == null){console.log("ERROR: bruh");return}
        }
        console.log("adding peers to RTCPeer...")
        peer.sendFiles(files)
    }

    let openSpace = (member:any) => {
        let peer: RTCPeer | null = getPeer(member.id)
        if(peer == null) {
          peer = initPeer(member)
          if(peer == null){console.log("ERROR: bruh");return}
        }
        setSpace(peer)
    }

    useEffect(() => {
      if(socket == null){return}
      if(client == null){return}
      socket.on("members", (data: { members: any }) => {
        let arr: Member[] = [];
        for (let i = 0; i < data.members.length; i++) {
          const element =  data.members[i];
          if(element.id == client.id) {continue}
          if(element.online == false) {continue}
          let e: Member = {
            name: element.name,
            id: element.id,
            color: element.color
          }
          arr.push(e)
        }
        setMembers(arr);
      });
      let r = false

      return () => {
        socket.off('members');
        socket.off("message")
      };
    },[socket, client])

    useEffect(() => {
      if(socket == null){return}
      socket.on("offer", (data:any) => {
        console.log("got offer from " + data.from)
        if(hasPeer(data.from)) {console.log("got offer from " + data.from + " but already have a peer with that client")}
        acceptPeer(data)
      })
      socket.on("accept", (data: any) => {
        console.log(data.from + " accepted offer")
        let p = getPeer(data.from)
        if(p == null){console.log("ERROR: received acception for peer wich isnt in list. hope you'll never see this"); return} 
        p.peer.signal(data.sgn)
      })
      return () => {
        socket.off("offer")
        socket.off("accept")
      };
    }, [socket, peers])
  
    if(members == null){return <h1>lol</h1>}
    if(client == null){return <h1>lel</h1>}
    const listItems = members.map((member) =>  <Item socket={socket} action={openSpace} key={member.id}member={member} client={client}></Item>);
    return (
      <div className="flex flex-1 flex-col justify-center items-center h-full gap-4">
        {(members.length > 0) ? 
            <div>
              {(space != null) ?
                <Space peer={space} setPeer={(s:any) => {setSpace(s)}}>

                </Space>
                :
                null
              }
              <div className="flex flex-wrap justify-center items-center gap-4 w-full">
                {listItems}
              </div>
            </div>
          :
          <div className="flex flex-wrap justify-center items-center gap-4 w-full">
              <div className="text-xl w-fit p-5 dark:text-white ">Aktuell ist niemand online :(</div>
          </div>
        }
      </div>
    )
  
}

function Item({socket, member, client, action, state}: any) {
  const [menu, showMenu] = useState(false)

  

  let toogleMenu = () => {
    if(menu) {
      showMenu(false)
    } else {showMenu(true)}
  }
    return (        
        <motion.div className="w-fit text-center leading-loose mx-5">
          <div onClick={() => {action(member)}} className="p-4 text-4xl bg-blue-600 text-white rounded-full w-fit mx-auto">
            <Icon.Person className="mx-auto"></Icon.Person>
          </div>
          <p className="font-bold text-lg mt-1 dark:text-white ">{member.name}</p>
          {/* {(state != null)?<div>{state.name}</div>:null} */}
        </motion.div>
    )
}