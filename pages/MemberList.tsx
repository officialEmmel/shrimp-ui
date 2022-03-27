import type { NextPage } from 'next'
import {useState, useEffect, useCallback} from "react"

import {Member} from "./Network"

import { motion, AnimatePresence } from "framer-motion"

import * as Icon from 'react-bootstrap-icons';

import {makeid} from "../scripts/util"

import Modal from "./components/Modal/Modal"

import Space from './components/Space';
import { SP } from 'next/dist/shared/lib/utils';
import Loading from './components/Loading';

import {RTCPeer} from '../scripts/RTCPeer'
import {FileChunker} from '../scripts/FileChunker'
import {FileDigester} from '../scripts/FileDigester'
import {Events} from '../scripts/Events'

import {useDropzone} from 'react-dropzone'

import { useRouter } from 'next/router'
import MemberModal from './components/ShareModal';

export default function MemberList({socket, client, action, setError}: any){
    const [members, setMembers] = useState<Member[] | null>(null)

    const [peers, setPeers] = useState<RTCPeer[]>([])

    const [space, setSpace] = useState<any | null>(null)

    const [shareMode, setMode] = useState<any>(false)
    const [inputFile, setInput] = useState<any | null>(null)

    const router = useRouter()

    useEffect(()=>{
      if(socket === null) {return}

      if(router.query.file !== undefined) {
        setInput(dataURLtoFile(router.query.file, router.query.filename))
      }

      console.log("subscrubing to event listeners")

      Events.on("offer", (data: any) => {
        socket.emit("offer",{sgn:data.detail.sgn,to:data.detail.to, from:data.detail.from})
      })

      Events.on("accept", (data: any) => {
        socket.emit("accept",{sgn:data.detail.sgn,to:data.detail.to, from:data.detail.from})
      })

      Events.on("error", onError)

      return () => {
        console.log("desubscribint to old event listeners")
        Events.off("offer", (e)=>{})
        Events.off("accept", (e)=>{})
        Events.off("data", (e)=>{})
        Events.off("close", (e)=>{})
        Events.off("error", onError)
      };
    },[socket])

    let onError = (e:any) => {
      if(e.detail.err.toString() == "OperationError: Transport channel closed") {return}
      setError({msg:<div><div>{e.detail.err.toString() + " (Peer: "+e.detail.id+") "}</div><a
        href="https://github.com/officialEmmel/shrimp-ui/blob/main/common_errors.md"
        className='underline text-blue-600'>
        Warum sehe ich diesen fehler?</a>
      </div>, title:"Ein WebRTC Fehler ist aufgetreten!"})
    }

    let dataURLtoFile = (dataurl:any, filename:any) => {
 
      var arr = dataurl.split(','),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), 
          n = bstr.length, 
          u8arr = new Uint8Array(n);
          
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], filename, {type:mime});
    }

    useEffect(() => {
      console.log("refreshing peers...")
      let refreshedPeers = peersToArray()
      let r = 0
      for (let i = 0; i < peers.length; i++) {
        const p = peers[i];
        if(p.connected == false) {
          console.log("removing peer to", p.remote.id)
          if(space != null) {
            if(p.remote.id == space.remote.id) {setSpace(null)}
          }
          refreshedPeers.splice(i,1)
          r += 1
        }
      }
      setPeers(refreshedPeers)
      console.log("refreshing finished. removed "+r+" peers")
    },[members])

    let initPeer = (member: any) => {
      if(hasPeer(member.id)) {console.log("client has already a running peer with id " + member.id); return null}
      let p = new RTCPeer(client, member, true)
      setPeers(peersPushArray(p))
      console.log("added new peer to list. waiting for signal...")
      return p
    }

    let acceptPeer = (data: any) => {
      let p = new RTCPeer(client, data.from, false)
      p.peer.signal(data.sgn)
      setPeers(peersPushArray(p))
    }

    let hasPeer = (id: any) => {
      for (let i = 0; i < peers.length; i++) {
        const p = peers[i];
        if(p.remote.id == id) {return true}
      }
      return false
    }

    let getPeer = (id: any) => {
      for (let i = 0; i < peers.length; i++) {
        const p = peers[i];
        if(p.remote.id == id) {return p}
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


    let quickSpace = (files: any, member:any) => {
      //init connection if needed
      let peer: RTCPeer | null = getPeer(member.id)
      if(peer == null) {
        peer = initPeer(member)
        if(peer == null){console.log("ERROR: bruh");return}
      }
      //sending files
      peer.sendFiles(files)
      setSpace(peer)
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
        console.log("got offer from " + data.from.id)
        if(hasPeer(data.from.id)) {console.log("got offer from " + data.from.id + " but already have a peer with that client"); return}
        acceptPeer(data)
      })
      socket.on("accept", (data: any) => {
        console.log(data.from.id + " accepted offer")
        let p = getPeer(data.from.id)
        if(p == null){console.log("ERROR: received acception for peer wich isnt in list. hope you'll never see this"); return}
        p.state = "Establishing WebRTC connection..."
        if(p.accepted) {return}
        p.accepted = true
        p.peer.signal(data.sgn)
      })
      return () => {
        socket.off("offer")
        socket.off("accept")
      };
    }, [socket, peers])


    if(members == null){return (
      <div className="flex flex-1 flex-col justify-center items-center h-full gap-4">
        <div className="w-fit text-center leading-loose mx-5">
          <Loading></Loading>
          <div className="text-xl w-fit p-5 dark:text-white ">Suche andere Nutzer...</div>
        </div>
      </div>
    )}
    if(client == null){return <h1>lel</h1>}
    const listItems = members.map((member) =>  <Item socket={socket} action={openSpace} drop={quickSpace} key={member.id}member={member} client={client}></Item>);
    return (
      <div className="flex flex-1 flex-col justify-center items-center h-full gap-4">
        {(members.length > 0) ?
            <div>
              {shareMode?
                <MemberModal members={members} send={(member:any) => quickSpace(inputFile,member)}></MemberModal>
              :null}
              {(space != null) ?
                <Space setError={setError} peer={space} setPeer={(s:any) => {setSpace(s)}}>

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

function Item({socket, member, client, action, state, drop}: any) {

  const onDrop = (acceptedFiles: any) => {
    console.log("dropped")
    drop(acceptedFiles, member)
  }
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    return (
        <div className="w-fit text-center leading-loose mx-5">
          <div {...getRootProps()} onClick={() => {action(member)}} className="p-4 text-4xl bg-blue-600 text-white rounded-full w-fit mx-auto">
              {
              isDragActive ?
                <motion.div className="mx-auto"><Icon.Plus className="mx-auto"></Icon.Plus></motion.div>:
                <Icon.Person className="mx-auto"></Icon.Person>
              }
          </div>
          <p className="font-bold text-lg mt-1 dark:text-white ">{member.name}</p>
          {/* {(state != null)?<div>{state.name}</div>:null} */}
        </div>
    )
}