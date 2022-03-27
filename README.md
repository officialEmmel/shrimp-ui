<img src="https://github.com/officialEmmel/shrimp-ui/blob/main/public/logo.svg" width="250"></img>
# Shrimp

### A network wide peer-to-peer chat to share text & files across devices.

<img src="https://raw.githubusercontent.com/officialEmmel/shrimp-ui/main/rtc_con.png" width="500"></img>

# Made using:

- [WebRTC](https://webrtc.org/) for Peer-to-Peer file and text transfer (simple-peer)
- [WebSockets](https://developer.mozilla.org/de/docs/Web/API/WebSockets_API) for Signaling and client management in backend
- [NextJS](https://nextjs.org/) with [Tailwind CSS](https://tailwindcss.com/) as frontend ([Motion Framer](https://www.framer.com/motion/) for animation)
- FileChunker and FileDigester logic from [Snapdrop](https://snapdrop.net/)


# How it works:

Shrimp is using WebRTC protocol for text and file transfer. If a client connects it gets all other online clients from the server. To start a chat two peers start a WebRTC connection to transfer data over a DataChannel. The signaling between them is handled via WebSockets and an external backend server.

### Backend Repo: [officialEmmel/shrimp-server](https://github.com/officialEmmel/shrimp-server)
