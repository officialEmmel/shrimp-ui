
import { motion } from "framer-motion"
export function Error({message}){

    let dropIn = {
        hidden: {
           opacity: 0 
        },
        visible: {
            opacity: 1
        }
    }

    if(message == null) {return <div></div>}
    return (<motion.div 
        exit={{ opacity:0 }}
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        className="bg-red-900 relative mx-2 text-white dark: px-3 py-1 mb-2 rounded-lg"
        >{message}</motion.div>)
}