// import { getSocket } from "../../features/socket";


// let localStream;
// let remoteStream;
// let peerConnection;

// const servers = {
//     iceServers: [
//         {
//             urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
//         }
//     ]
// }

// let socket;

// let init = async () => {
//     socket = getSocket();
    
//     if (socket.connected) {
//         console.log('bbb')
//         setupWebRTC(socket);
//     } else {
//         console.log('cccc')
//         socket.on('connect', () => {
//             console.log('dddd')
//             setupWebRTC(socket);
//         });
//     }
// }

// let setupWebRTC = async (socket) => {
//     socket.on("playerJoined", handlePlayerJoined);

//     socket.on('messageFromPeer',handleMessageFromPeer)
    
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
//     document.getElementById('user-1').srcObject = localStream;
    
// }

// let handleMessageFromPeer= async(msg,id)=>{
//     console.log('aaaaaaaa')
//     console.log(msg,id)
// }

// let handlePlayerJoined = async (socketId) => {
//     console.log("webrtc noti for user joined:", socketId)
//     createOffer(socketId);
// }

// let createOffer = async (id) => {
//     peerConnection = new RTCPeerConnection(servers);

//     remoteStream = new MediaStream();
//     document.getElementById('user-2').srcObject = remoteStream;

//     localStream.getTracks().forEach(track => {
//         peerConnection.addTrack(track, localStream)
//     });

//     peerConnection.ontrack = (event) => {
//         event.streams[0].getTracks().forEach(track => {
//             remoteStream.addTrack(track);
//         })
//     }

//     peerConnection.onicecandidate = async (event) => {
//         if (event.candidate) {
//             console.log('New ICE candidate:', event.candidate)
//         }
//     }

//     let offer = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offer);

//     socket.emit("sendMessageToPeer",{msg:"hey"},{id})

// }

// // Initialize WebRTC with a slight delay to ensure Lobby.js has initialized first
// setTimeout(() => {
//     init();
// }, 1000);