import { useState, useEffect } from "react"

import Modal from "../Modal/Modal"

import {getConfig} from "../../../scripts/util"

export default function Configurator({submit}:any) {
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
        <Modal>
            <form className=" p-2  space-y-6 " action="#">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Profil konfigurieren</h3>
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Name</label>
                        <input type="text" name="name" id="name" onChange={(e) => {setName(e.target.value)}} className="bg-gray-200 dark:text-white dark:bg-neutral-700  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 " placeholder={(oldConfig.name != null)?oldConfig.name:"Rick Astley"} defaultValue={(oldConfig.name != null)?oldConfig.name:""} required/>
                    </div>
                    {/* <div>
                        <label htmlFor="color" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Farbe</label>
                        <select id="countries" onChange={(e) => {setColor(e.target.value)}} className="bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-white  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 " value={(color != null)?color:"normal"}>
                        <option value="normal" >Keine</option>
                        <option value="blue" >Blau</option>
                        <option value="green" >Grün</option>
                        <option value="yellow" >Gelb</option>
                        <option value="orange" >Orange</option>
                        <option value="red" >Rot</option>
                        </select>
                    </div> */}
                    <button type="submit" onClick={() => {if(name != null){submit(name, color)}}} className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center ">Fortfahren</button>
                </form>
        </Modal>        
    )
}