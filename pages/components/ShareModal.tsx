import { useState, useEffect } from "react"

import Modal from "./Modal/Modal"
import * as Icon from 'react-bootstrap-icons';
import {getConfig} from "../../scripts/util"

export default function MemberModal({members, send}:any) {
    if(members == undefined) {return <div></div>}
    let list = members.map((member:any) => {
        return (              
        <li onClick={() => {send(member);}} key="">
            <div className="text-xl flex py-3 dark:bg-neutral-800 bg-neutral-200 rounded-lg" >
                <div onClick={() => {}} className="text-blue px-2 rounded-full inline-flex items-center font-bold text-xl md:text-lg">
                    <div className="inline-flex p-2 text-xl bg-blue-600 text-white rounded-full w-fit mx-auto mr-2">
                    <Icon.Person className="self-center"></Icon.Person>
                    </div>
                    <span className="mb-0 md:mb-0 dark:text-white">{member.name}</span>
                </div>
            </div>
        </li>)
    })
    return (
        <Modal>
            <div className="text-center text-xl font-bold p-1">An wen möchtest du die Datei senden?</div>
            <ul className="overflow-y-auto space-y-1">
                {list}
            </ul>
        </Modal>        
    )
}