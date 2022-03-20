import type { NextPage } from 'next'
import {useState, useEffect, useRef} from "react"

import * as Icon from 'react-bootstrap-icons';

import Error from './general'

import { motion, AnimatePresence } from "framer-motion"

export default function Chat({socket, member, client, inChat}: any) {

    const [history, setHistory] = useState<any[]>([])
    const [loadHistory, setLoad] = useState<any>(false)
    const [message, setMessage] = useState<any>(null)

    const [error, setError] = useState<any>(null)

    const messagesEndRef = useRef<any>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    
      useEffect(() => {
        scrollToBottom()
      }, [history]);

    useEffect(()=>{
        socket.emit("get_chat",{sender:localStorage.getItem("token"), addressee:member.id})
        socket.on("history", (json: any) => {
            setHistory(json.messages)
            console.log("got history from server: ", json.messages)
        })
        return () => {
            socket.off('history');
        };
    }, [socket])

    useEffect(()=>{
        socket.on("message", (json: any) => {
            if(json.sender_id != member.id && json.sender_id != client.id) {return}
            let arr: any[] = []
            console.log("history ",history)
            for (let i = 0; i < history.length; i++) {
                const h = history[i];
                console.log("his",h);
                arr.push(h)
            }
            arr.push(json)
            console.log("array ",arr)
            setHistory(arr)
        })
        return () => {
            socket.off('message');
        };
    }, [socket,history])

    useEffect(()=>{console.log(history)},[history, setHistory])

    let sendMessage = () => {
        if(socket == null) {return}
        console.log("sending")
        if(message == null) {
            setError("Die Nachricht muss Text enthalten"); 
            setTimeout(() => {setError(null)}, 2000)
            return}
        if(isBlank(message)) {setError("Die Nachricht muss Text enthalten"); return}
        if(message.length > 255) {setError("Nachricht hat die maximale Länge erreicht"); return}
        socket.emit('private', {message: message, addressee:member.id, sender:localStorage.getItem("token")})
        setMessage("")
    }

    let valueChange = (e:any) => {
        setMessage(e.target.value)
    }

    let isBlank = (str: string) => {
        return (!str || /^\s*$/.test(str));
    }

    let listHis = history.map((msg) => {
        if(client == undefined) {return <div></div>}
        if(member == undefined) {return <div></div>}
        return (
            <motion.li ref={messagesEndRef} key={msg.timestamp} initial={{y: "100vh"}} transition={{ type: "spring", damping: 15 }}  animate={{y: "0vh"}} className="flex">
                {(msg.sender_id == client.id)?
                <div className="w-full px-4 py-2 text-gray-700 dark:text-gray-200 rounded ">
                    <span className="block text-blue-500 font-bold ">{client.name}</span>
                    <span className="block">{msg.message}</span>
                    <span className="block font-thin text-xs">{new Date(msg.timestamp).getHours()+":"+new Date(msg.timestamp).getMinutes()}</span>
                </div>
                :
                <div className="w-full px-4 py-2 text-gray-700 rounded dark:text-gray-200 ">
                    <span className="block text-red-500 font-bold">{member.name}</span>
                    <span className="block">{msg.message}</span>
                    <span className="block font-thin text-xs">{new Date(msg.timestamp).getHours()+":"+new Date(msg.timestamp).getMinutes()}</span>
                </div>
                }
            </motion.li>
        )
    });


    if(member == undefined) {return <div></div>}


    return (
        <div className="flex flex-col h-screen">
            <div className="text-xl flex py-3" >
                <div onClick={() => {inChat(false)}} className="text-blue px-2 rounded-full inline-flex items-center font-bold text-xl md:text-lg">
                    <Icon.ArrowLeft className="mr-2 dark:text-white"></Icon.ArrowLeft>
                    <div className="inline-flex p-2 text-xl bg-blue-600 text-white rounded-full w-fit mx-auto mr-2">
                    <Icon.Person className="self-center"></Icon.Person>
                    </div>
                    <span className="mb-0 md:mb-0 dark:text-white" >{member.name}</span>
                </div>
            </div>
            <div className="overflow-auto">
                <ul className="w-full flex flex-col space-y-2">
                    {listHis}
                </ul>
            </div>
            <AnimatePresence
                initial={false}
                exitBeforeEnter={true}
                onExitComplete={() => null}
            >
                {(error != null)?<Error message={error}></Error>:null}
            </AnimatePresence>
            <div className="flex p-1 bg-gray-50 dark:bg-slate-800">
                <input className="w-full rounded-xl bg-gray-300 dark:bg-gray-500 dark:text-white  mr-2" onChange={(v) => {valueChange(v)}} value={message} type="text"></input>
                <button onClick={() =>{sendMessage()}} type="button"><Icon.ArrowUpCircleFill className="text-3xl text-blue-500"></Icon.ArrowUpCircleFill></button>
            </div>
        </div>
    )
}