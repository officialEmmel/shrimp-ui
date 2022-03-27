import { motion } from "framer-motion"

export default function Loading() {
    let variants = {
        anim: {
          x: [-30,30],
          opacity: [0,1,0],
          scale: [0,1,0],
          transition: {
            x: {
              yoyo: Infinity,
              duration: 0.5
            },
            opacity: {
              yoyo: Infinity,
              duration: 0.5
            },
            scale: {
              yoyo: Infinity,
              duration: 0.5
            }
          }
        }
    }
    return (
        <motion.div  
        animate="anim"
        variants={variants}
        className="dark:bg-white bg-black w-5 h-5 rounded-full p-4 text-4xl text-white  mx-auto" >
        </motion.div>
    )
}