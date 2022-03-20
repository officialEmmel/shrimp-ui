import type { NextPage } from 'next'
import {useState, useEffect} from "react"
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
const ENDPOINT = "https://socket.emmelnet.systems";
import socketIOClient from "socket.io-client";


import Network from "./Network"


export default function Main() {
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const newSocket: any = socketIOClient(ENDPOINT);
    setSocket(newSocket);
    return () => newSocket.close();
  }, [setSocket]);
  return (
    <div className="bg-white dark:bg-[#121212]">
      {(socket == null) ? <h1></h1>:<Network socket={socket}></Network>}
    </div>
  )
}




