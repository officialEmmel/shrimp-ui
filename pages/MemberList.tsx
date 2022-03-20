import type { NextPage } from 'next'
import {useState, useEffect} from "react"

import {Member} from "./Network"

import * as Icon from 'react-bootstrap-icons';

export default function MemberList({socket, client, openChat}: any){
    const [members, setMembers] = useState<Member[]>([])
    useEffect(() => {
      if(socket == null){return}
      if(client == null){return}
      socket.on("members", (data: { members: any }) => {
        let arr: Member[] = [];
        for (let i = 0; i < data.members.length; i++) {
          const element =  data.members[i];
          if(element.id == client.id) {continue}
          if(element.online == false) {continue}
          let e: Member = {
            name: element.name,
            id: element.id,
            color: element.color
          }
          arr.push(e)
        }
        setMembers(arr);
      });
      return () => {
        socket.off('members');
        socket.off("message")
      };
    },[socket, client])
  
    if(members == null){return <h1>lol</h1>}
    if(client == null){return <h1>lel</h1>}
    const listItems = members.map((member) =>  <Item openChat={openChat} key={member.id}member={member} client={client}></Item>);
    return (
      <div className="flex flex-1 flex-col justify-center items-center h-full gap-4">
        {(members.length > 0) ? 
            <div className="flex flex-wrap justify-center items-center gap-4 w-full">
              {listItems}
            </div>
          :
          <div className="flex flex-wrap justify-center items-center gap-4 w-full">
              <div className="text-xl w-fit p-5 dark:text-white ">Aktuell ist niemand online :(</div>
          </div>
        }
      </div>
    )
  
}

function Item({member, client, openChat}: any) {
    return (        
        <div onClick={() => {openChat(member)}} className="w-fit text-center leading-loose mx-5">
          <div className="p-4 text-4xl bg-blue-600 text-white rounded-full w-fit mx-auto">
            <Icon.Person className="mx-auto"></Icon.Person>
          </div>
          <p className="font-bold text-lg mt-1 dark:text-white ">{member.name}</p>
        </div>
    )
}