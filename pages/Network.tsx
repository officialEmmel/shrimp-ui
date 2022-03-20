
import type { NextPage } from 'next'
import {useState, useEffect,Fragment, useRef} from "react"
import Skeleton from 'react-loading-skeleton'
import * as Icon from 'react-bootstrap-icons';
import Head from 'next/head'
import Image from 'next/image'

import MemberList from './MemberList'
import Chat from './Chat'
import {getConfig, getColor} from "../scripts/util"
import { get } from 'https';


export interface Member {
    name: string,
    id: string,
    color: string
}

export default function Network({socket}:any) {
    const [client, setClient] = useState<any>(null)
    const [configured, setConfig] = useState<any>(null)
    const [connected, setConnection] = useState<any>(false)
    const [inChat, setInChat] = useState<any>(false)
    const [chat, setChat] = useState<any>(null)

    useEffect(()=>{

        socket.on("connect", () => {
            setConnection(true)
        })
        socket.on("disconnect", () => {
            setConnection(false)
        })
        socket.on('registered', (data: any) => {
            setClient(data.member)
        })

        socket.on('updated', (data: any) => {
            setClient(data.member)
        })

        return () => {
            socket.off('registered');
            socket.off('updated');
            socket.off('connect');
            socket.off('disconnect');
        };
    }, [socket])

    useEffect(()=>{
        if(socket == null) {return}
        socket.on('connect', () => {
            let c = getConfig()
            if(c==null) {return}
            if(c.name == null || c.color == null) { 
                setConfig(false)
            } else {
                setConfig(true)
                socket.emit('register', {id:c.id,name:c.name,token:c.token,color:c.color})
            }
        })
        return () => {
            socket.off('connect');
        };
    }, [configured])

    useEffect(()=>{
        if(chat == null){ return}
        setInChat(true)
    }, [chat])

    useEffect(()=>{
        if(socket == null) {return}
        socket.emit("get_members")
    }, [inChat])

    let openChat = (member: any) => {
        setChat(member)
    }

    let setConf = (name: any, color: any) => {
        if (typeof window == 'undefined') {return null}
        localStorage.setItem("name",name)
        localStorage.setItem("color",color)
        setConfig(true)
        if(socket == null) {return}
        let c = getConfig()
        if(c==null) {return}
        socket.emit('register', {id:c.id,name:c.name,token:c.token,color:c.color})
    }

    let openMenu = () => {
        setConfig(false)
    }

    return(
        <div >
            <Head>
                <title>Shrimp Messenger</title>
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
                <link rel="manifest" href="/site.webmanifest"/>
                <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#232323"/>
                <meta name="msapplication-TileColor" content="#931c3d"/>
                <meta name="theme-color" content="#ffffff"/>
            </Head>
            {(client == null) ? <Skeleton></Skeleton> : null}
            {(configured != null && !configured)?
                <Configurator submit={setConf}></Configurator>
            :
            <div></div>
            }
            <div>
                {(client == null) ? 
                    <h1>Connecting...</h1>
                    :
                    <div>
                        {(inChat)?
                            <Chat socket={socket} member={chat} client={client} inChat={setInChat}></Chat>
                            : 
                            <MainMenu socket={socket} client={client} openChat={openChat} openMenu={openMenu}></MainMenu>
                        }
                    </div>
                }
            </div>
        </div>
    )
}

export function Configurator({submit}:any) {
    const [oldConfig, setOldConfig] = useState({name:null,color:null})
    const [name, setName] = useState<any>(null)
    const [color, setColor] = useState<any>("normal")

    useEffect(()=>{
        let c: any = getConfig()
        if(c == null){setOldConfig({name:null,color:null});return}
        setOldConfig(c)
        if(c.name != null){setName(c.name)}
        if(c.color != null){setColor(c.color)}
    }, [])

    return (
        <div className="fixed inset-0 bg-gray-600 dark:bg-neutral-900 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative w-auto top-20 mx-auto p-5 max-w-md rounded-md bg-gray-100 dark:bg-[#121212]">
                <form className=" px-6 pb-4 space-y-6 " action="#">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Profil konfigurieren</h3>
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Name</label>
                        <input type="text" name="name" id="name" onChange={(e) => {setName(e.target.value)}} className="bg-gray-50 dark:text-white dark:bg-neutral-700  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 " placeholder={(oldConfig.name != null)?oldConfig.name:"Rick Astley"} defaultValue={(oldConfig.name != null)?oldConfig.name:""} required/>
                    </div>
                    <div>
                        <label htmlFor="color" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Farbe</label>
                        <select id="countries" onChange={(e) => {setColor(e.target.value)}} className="bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-white  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 " value={(color != null)?color:"normal"}>
                        <option value="normal" >Keine</option>
                        <option value="blue" >Blau</option>
                        <option value="green" >Grün</option>
                        <option value="yellow" >Gelb</option>
                        <option value="orange" >Orange</option>
                        <option value="red" >Rot</option>
                        </select>
                    </div>
                    <button type="submit" onClick={() => {if(name != null){submit(name, color)}}} className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center ">Fortfahren</button>
                </form>
            </div>
        </div>
        
    )
}

export function Tag({color, text}:any) {
    return (
        <div className={"bg-"+color+"-600 w-fit p-0.5 rounded inline m-1 py-0"}>{text}</div>
    )
}

export function Header({client, menu}:any) {
    return (
        <div className="flex mx-2 my-1 ">
            <Logo></Logo>
            <div onClick={() => {menu()}} className="bg-blue-600 text-white px-2 rounded-full inline-flex items-center ml-auto font-bold text-xl md:text-lg">
                <Icon.PersonCircle className="mr-2"></Icon.PersonCircle>
                <span className="mb-0 md:mb-0" >{client.name}</span>
            </div>
        </div>
    )
}

export function Logo() {
    return (
        <div className="text-3xl font-bold inline-flex items-middle"> 
        <Image className="invert dark:invert-0" alt="" src="/logo.svg" width="60" height="30"></Image>
        <span className="font-mono dark:text-white ">SHRIMP;</span>
        </div>
    )
}


export function MainMenu({socket, client, openChat, openMenu}:any) {
    return (
        <div className="flex flex-col h-screen">
            <Header client={client} menu={openMenu}></Header>
            <MemberList socket={socket} client={client} openChat={openChat}></MemberList>
        </div>
    )
}