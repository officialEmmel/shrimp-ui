import { motion } from "framer-motion";
import Backdrop from "./Backdrop";

export default function Modal({handleClose, text}:any) {
    return (
        <Backdrop onClick={handleClose}>
            <motion.div
            onClick={(e:any) => {e.stopPropagation()}}
            className="text-white bg-gray-600 max-w-screen-lg w-1/2 max-h-screen-lg h-1/2 m-auto p-1 rounded-md flex flex-col items-center"
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0, opacity: 0}}
            >
            </motion.div>
        </Backdrop>
    )
}