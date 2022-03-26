
import type { NextPage } from 'next'
import {useState, useEffect,Fragment, useRef} from "react"
import Skeleton from 'react-loading-skeleton'
import * as Icon from 'react-bootstrap-icons';
import Head from 'next/head'
import Image from 'next/image'

import Configurator from "./components/Settings/ConfigModal"

import MemberList from './MemberList'
import Chat from './Chat'
import {getConfig, getColor} from "../scripts/util"
import { get } from 'https';

import * as Peer from "simple-peer"


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

    let action = (key: any) => {
        switch(key) {
            case "text":

        }
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
                            <MainMenu socket={socket} client={client} action={action} openMenu={openMenu}></MainMenu>
                        }
                    </div>
                }
            </div>
        </div>
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
        <span className="font-mono dark:text-white ">SHRIMP</span>
        </div>
    )
}


export function MainMenu({socket, client, action, openMenu}:any) {
    return (
        <div className="flex flex-col h-screen">
            <Header client={client} menu={openMenu}></Header>
            <MemberList socket={socket} client={client} action={action}></MemberList>
        </div>
    )
}