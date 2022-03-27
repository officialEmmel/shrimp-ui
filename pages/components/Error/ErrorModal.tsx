
import { useState, useEffect } from "react"

import Modal from "../Modal/Modal"

import {getConfig} from "../../../scripts/util"

export default function Error({title, message, hide}:any) {
    if(title === null || title === undefined) {title = "Ein unbekannter Fehler ist aufgetreten!"}
    return (
        <Modal>
            <div className="text-xl text-center font-bold p-3 text-black dark:text-white">{title}</div>
            <div className="text-center p-3 text-black dark:text-white">
                {message}
            </div>
            <button onClick={() => {hide()}} className="w-full mx-auto bg-blue-600 rounded-lg p-1 mt-2">Ok</button>
        </Modal>        
    )
}