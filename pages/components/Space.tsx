import Modal from "./Modal/Modal";
import Backdrop from "./Modal/Backdrop";
import InChatError from "./Error/InChatError"
import { AnimatePresence, motion } from "framer-motion";
import * as Icon from 'react-bootstrap-icons';
import Image from "next/image"
import { useEffect, useRef, useState} from "react";
import { text } from "stream/consumers";
import {getImageDimensions} from "../../scripts/util"
import Loading from "./Loading";

import {Events} from '../../scripts/Events'
import { useDropzone } from "react-dropzone";

export default function Space({peer, setPeer, setError}:any) {

    const [history, setHistory] = useState<any>([]);
    const [state, setState] = useState<any>("")
    const [message, setMessage] = useState<any>("")

    const [chatErr, setChatErr] = useState<any>(null)

    const messagesEndRef = useRef<any>(null)
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    
    useEffect(() => {
    scrollToBottom()
    }, [history]);
    useEffect(() => {
        if(peer == undefined || peer == null) {return}
        setHistory(peer.getHistory())
        setState(peer.state)

        Events.on("append-history", append)
        Events.on("state-changed",updateState)
        Events.on("error", onError)
        Events.on("disconnect", onDisconnect)
        
        return () => {
            Events.off("history", (e)=>{})
            Events.off("append-history", append)
            Events.off("state-changed",updateState)
          };
    }, [peer, history])

    let append = (e:any) => {
        let arr: any = [];
        for (let i = 0; i < peer.getHistory().length; i++) {
            const e = peer.getHistory()[i];
            arr.push(e)
        }
        setHistory(arr);
    }
    
    let updateState = (e:any) => {
        let s = peer.state
        setState(s);
    }

    let onDisconnect = (e:any) => {
        if(e.detail.id == peer.remote.id) {setPeer(null)}
    }

    let onError = (e:any) => {
        //setError({msg:"Die Verbindung zu "+peer.remote.name+" wurde verloren. Bitte versuche es erneut.", title:"Verbindung verloren"});setPeer(null)
        if(e.detail.id == peer.remote.id) {setPeer(null)}
    }


    let sendText = () => {
        if(isBlank(message)) {showError("Die Nahricht muss Text enthalten."); return}
        //if(message.length > 9999) {showError("Die Nachricht darf maximal 10000 Zeichen lang sein"); return}
        peer.sendText(message)
        setMessage("")
    }

    let isBlank = (str: string) => {
        return (!str || /^\s*$/.test(str));
    }

    let sendFile = (e:any) => {
        for (let i = 0; i < e.target.files.length; i++) {
            const f = e.target.files[i]
            if(f.size == 0) {showError("Die Datei ist 0 Bytes groß"); return}
            if(f.size > 5e7) {
                showError("Die maximale Dateigröße beträgt 50 MB"); return
            }
        }
        peer.sendFiles(e.target.files)
        setMessage("")
    }

    let showError = (msg: any) => {
        setChatErr(msg)
        setTimeout(() => {setChatErr(null)}, 3000)
    }

    let listHis = history.map((msg: any) => {
        let content = (obj:any) => {
            switch(msg.type) {
                case "text":
                   return <span className="block">{obj.data}</span>
                case "data":
                   return (
                        <File file={obj} peer={peer} showError={showError}></File>
                   )
                case "proxy":
                    return (
                        <div>File was received. Working on download link...</div>
                    )
            }
        }

        let time = new Date(msg.timestamp).toLocaleTimeString().split(":")

        return (
            <motion.li key={msg.timestamp} ref={messagesEndRef} initial={{scale: 0}} transition={{ type: "spring", damping: 15 }}  animate={{scale: 1}} className="flex">
                {(msg.sender.id == peer.local.id)?
                <div className=" px-4 py-2 text-gray-700 dark:text-gray-200 rounded max-w-full">
                    <span className="block text-blue-500 font-bold ">{peer.local.name}</span>
                    {content(msg)}
                    <span className="block font-thin text-xs mt-1">{time[0]+":"+time[1]}</span>
                </div>
                :
                <div className=" px-4 py-2 text-gray-700 rounded dark:text-gray-200 max-w-full w-fit">
                    <span className="block text-red-500 font-bold">{peer.remote.name}</span>
                    {content(msg)}
                    <span className="block font-thin text-xs mt-1">{time[0]+":"+time[1]}</span>
                </div>
                }
            </motion.li>
        )
    });

    const onDrop = (acceptedFiles: any) => {
        console.log("dropped")
        peer.sendFiles(acceptedFiles)
      }
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    return (
        <Backdrop onClick={() => {setPeer(null);}}>
            <motion.div
            onClick={(e:any) => {e.stopPropagation()}}
            className="dark:text-white text-black dark:bg-[#121212] bg-white xl:w-3/4 mx-0 my-3 max-h-screen-lg xl:h-3/4 w-full h-full rounded-md flex flex-col items-center"
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0, opacity: 0}}
            >
            {(state == "connected")? 
                    <div className="flex flex-col h-full w-full">
                    <div className="text-xl flex py-3 dark:bg-neutral-800 bg-neutral-200 rounded-t-none xl:rounded-t-lg" >
                        <div onClick={() => {}} className="text-blue px-2 rounded-full inline-flex items-center font-bold text-xl md:text-lg">
                            <div className="inline-flex p-2 text-xl bg-blue-600 text-white rounded-full w-fit mx-auto mr-2">
                            <Icon.Person className="self-center"></Icon.Person>
                            </div>
                            <span className="mb-0 md:mb-0 dark:text-white">{peer.remote.name}</span>
                        </div>
                        <div onClick={() => {setPeer(null)}} className="ml-auto text-blue px-2 rounded-full inline-flex items-center font-bold text-xl md:text-lg">
                            <div className="inline-flex p-2 text-xl -600 dark:text-white text-black rounded-full w-fit mx-auto">
                            <Icon.XLg className="self-center"></Icon.XLg>
                            </div>
                        </div>
                    </div>
                    <div {...getRootProps({onClick: (e) => {e.stopPropagation();}})} className="overflow-y-auto  flex-1">
                        <ul className="w-full flex flex-col space-y-2">
                            {listHis}
                        </ul>
                    </div>
                    <AnimatePresence initial={false}exitBeforeEnter={true}onExitComplete={() => null}>
                        {(chatErr != null)?<InChatError message={chatErr}></InChatError>:null}
                    </AnimatePresence>
                    <div className="flex p-1 bg-neutral-200 dark:bg-neutral-800 rounded-b-none xl:rounded-b-lg">
                        <input className="w-full rounded-xl bg-white dark:bg-gray-500 dark:text-white  mr-2" value={message} onChange={(v) => {setMessage(v.target.value)}} type="text"></input>
                        <label onClick={() =>{}} htmlFor="fileInput"><Icon.PlusCircleFill className="text-3xl mr-2 text-blue-500"></Icon.PlusCircleFill></label>
                        <input id="fileInput" type="file" className="hidden" onChange={(e)=>sendFile(e)} multiple />
                        <button onClick={() =>{sendText()}} type="button"><Icon.ArrowUpCircleFill className="text-3xl text-blue-500 "></Icon.ArrowUpCircleFill></button>
                    </div>
                </div>
                :
                <div className="flex flex-1 flex-col justify-center items-center h-full gap-4">
                <div className="w-fit text-center leading-loose mx-5">
                  <Loading></Loading>
                  <div className="text-xl w-fit p-5 dark:text-white ">{state}</div>
                  <button onClick={() => {setPeer(null)}}className="w-fit bg-blue-600 px-2 rounded-lg">Ausblenden</button>
                </div>
                </div>
            }
            </motion.div>
        </Backdrop>
    )
}

export function File({file, peer, showError}:any) {
    const [progress, setProgress] = useState<any>(1);
    const [delTime, setDelTime] = useState<any>(null);
    useEffect(() => {
        Events.on('file-progress', handleProgress)

        if(file.timeout) {
            setDelTime(file.deletingTime-Date.now())
            setInterval((setDelTime, time ) => {
                let t = time-Date.now()
                setDelTime(t)
            }, 1000, setDelTime, file.deletingTime)
        }

        return () => {
            Events.off('file-progress',handleProgress)
        }
    }, [file])
    let formatSize = (bytes:any) => {
        if (bytes >= 1e9) {
            return (Math.round(bytes / 1e8) / 10) + ' GB';
        } else if (bytes >= 1e6) {
            return (Math.round(bytes / 1e5) / 10) + ' MB';
        } else if (bytes > 1000) {
            return Math.round(bytes / 1000) + ' KB';
        } else {
            return bytes + ' Bytes';
        }
    }
    
    if(file.data == null) {return <div>Fehler: File not found</div>}

    let handleProgress = (e:any) => {
        if(e.detail.id == file.data.id) {
            setProgress(e.detail.progress)
        }
    }

    return (
    <div onClick={() => {if(file.sender.id == peer.local.id) {showError("Du kannst von dir gesendete Dateien nicht herunterladen."); return}}} className="bg-blue-600 text-white rounded-lg w-fit">
        {(file.sender.id == peer.local.id)?
        <NonImage file={file} formatSize={formatSize}></NonImage>
        :
        <div>
            {(file.data.mime.split("/")[0] == "image")?
                <ImageFile file={file} formatSize={formatSize}></ImageFile>:<NonImage file={file} formatSize={formatSize}></NonImage>
            }
        </div>
        }
        {(file.timeout)?<div className="w-full text-sm font-thin p-2 bg-orange-700 rounded-b-lg">Diese Datei wird aus Performancegründen in <b className="font-bold">{Math.round(delTime/1000)}</b> Sekunden gelöscht, da sie über 10 MB groß ist. Große Dateien sind für Shrimp nicht geeignet.</div>:null}
        {(file.warning)?<div className="w-full text-sm font-thin p-2 bg-orange-700 rounded-b-lg">Dateien sollten nicht größer als 10 MB sein, da die Website- und Browserperformance sonst stark darunter leidet.</div>:null}
        {
            (progress == 1)?null:
            <progress className="w-full align-bottom rounded-b-md" value={progress}></progress>
        }
    </div>)
}

export function NonImage({file, formatSize}:any) {
    return (
    <div className="mt-1 flex  p-2  mr-2 align-middle items-middle">
        <div className="inline-flex text-xl  text-white rounded-full w-fit  mr-2">
            <FileIcon mime={file.data.mime}></FileIcon>
        </div>
        <a className="mt- md:mb-0 dark:text-white hover:underline" href={file.dataURL} target="_blank" download={file.data.name} rel="noreferrer">
            {file.data.name}
            <div className="text-gray-300 text-sm">{formatSize(file.data.size)}</div>
        </a>
    </div>
    )
}

export function ImageFile({file, formatSize}:any) {
    const [dim, setDim] = useState<any>({w:0,h:0})
    useEffect(() => {
        let get = (async () => {
            let d = await getImageDimensions(file.dataURL)
            setDim(d)
        })
        get()
        
    }, [file])
    return (
    <div className="mt-1 p-2 align-middle items-middle">
        <Image src={file.dataURL} width={dim.w} height={dim.h}></Image>
        <a className="block md:mb-0 dark:text-white hover:underline" href={file.dataURL} target="_blank" download={file.data.name} rel="noreferrer">
            {file.data.name}
            <div className="text-gray-300 text-sm">{formatSize(file.data.size)}</div>
        </a>
    </div>
    )
}

export function FileIcon({mime}:any){
    if(mime == undefined) {return <Icon.FileEarmark className="self-center"></Icon.FileEarmark>}
    let type = mime.split("/")[0]
    switch(type){
        case "text":
            return <Icon.FileEarmarkText className="self-center"></Icon.FileEarmarkText> 
        case "video":
            return <Icon.FileEarmarkPlay className="self-center"></Icon.FileEarmarkPlay>
        case "audio":
            return <Icon.FileEarmarkMusic className="self-center"></Icon.FileEarmarkMusic>
        case "application":
            return <Icon.FileEarmarkBinary className="self-center"></Icon.FileEarmarkBinary>
        default: 
            return <Icon.FileEarmark className="self-center"></Icon.FileEarmark>
    }

}