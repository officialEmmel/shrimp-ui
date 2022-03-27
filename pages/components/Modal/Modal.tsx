import { motion } from "framer-motion";
import Backdrop from "./Backdrop";

export default function Modal({handleClose, children}:any) {
    return (
        <Backdrop onClick={handleClose}>
            <motion.div
            onClick={(e:any) => {e.stopPropagation()}}
            className="text-white dark:bg-[#121212] bg-white max-w-screen-lg w-fit md:w-1/2 max-h-screen-lg h-fit m-auto p-1 rounded-md"
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0, opacity: 0}}
            >
                {children}
            </motion.div>
        </Backdrop>
    )
}