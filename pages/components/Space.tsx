import Modal from "./Modal/Modal";
import Backdrop from "./Modal/Backdrop";
import { AnimatePresence, motion } from "framer-motion";
import * as Icon from 'react-bootstrap-icons';

export default function Space({peer, setPeer}:any) {
    return (
        <Backdrop onClick={() => {setPeer(null);}}>
            <motion.div
            onClick={(e:any) => {e.stopPropagation()}}
            className="text-white dark:bg-[#121212] max-w-screen-lg w-1/2 max-h-screen-lg h-1/2 m-auto p-1 rounded-md flex flex-col items-center"
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0, opacity: 0}}
            >
            <div className="flex flex-col h-screen w-full">
                <div className="text-xl flex py-3" >
                    <div onClick={() => {}} className="text-blue px-2 rounded-full inline-flex items-center font-bold text-xl md:text-lg">
                        <div className="inline-flex p-2 text-xl bg-blue-600 text-white rounded-full w-fit mx-auto mr-2">
                        <Icon.Person className="self-center"></Icon.Person>
                        </div>
                        <span className="mb-0 md:mb-0 dark:text-white">{peer.remote_id}</span>
                    </div>
                </div>
                <div className="overflow-auto flex-1">
                    <ul className="w-full flex flex-col space-y-2">
                        {}
                    </ul>
                </div>
                <div className="flex p-1 bg-gray-50 dark:bg-slate-800">
                    <input className="w-full rounded-xl bg-gray-300 dark:bg-gray-500 dark:text-white  mr-2" onChange={(v) => {}} type="text"></input>
                    <button onClick={() =>{}} type="button"><Icon.ArrowUpCircleFill className="text-3xl text-blue-500"></Icon.ArrowUpCircleFill></button>
                </div>
            </div>
            </motion.div>
        </Backdrop>
    )
}