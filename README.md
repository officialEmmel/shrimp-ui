# Shrimp

### A network wide peer-to-peer chat to share text & files across devices.

![687DEC30-3E78-43F8-88B7-FED46474F2B5.png](Shrimp%2073745/687DEC30-3E78-43F8-88B7-FED46474F2B5.png)

# Made using:

- WebRTC for Peer-to-Peer file and text transfer (simple-peer)
- WebSockets for Signaling and client management in backend
- NextJS with Tailwind CSS as frontend (Motion Framer for animation)
- FileChunker and FileDigester logic from Snapdrop

# How it works:

Shrimp is using WebRTC protocol for text and file transfer. If a client connects it gets all other online clients from the server. To start a chat two peers start a WebRTC connection to transfer data over a DataChannel. The signaling between them is handled via WebSockets and an external backend server.
