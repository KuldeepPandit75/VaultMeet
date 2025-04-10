import io from 'socket.io-client';

let socket = null;
let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
    ]
}

const mediaConstraints = { video: true, audio: true };

export const getSocket = () => {
    const API_URL = import.meta.env.VITE_BACKEND_URL;

    if (!socket) {
        socket = io(API_URL, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => { console.log('Socket connected:', socket.id); setupWebRTC(socket) });
        socket.on('disconnect', () => console.log('Socket disconnected'));
    }
    return socket;
};

let setupWebRTC = async (socket) => {
    socket.on("joinedRoom", handlePlayerJoinRoom)
    socket.on('playerDisconnected',handlePlayerLeave)
    socket.on('leftRoom',closeWebRTCConnection)
    socket.on('messageFromPeer', handleMessageFromPeer)

    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        const localVideo = document.getElementById('user-1');
        localVideo.srcObject = localStream;
        localVideo.muted = true;
    }
}

const closeWebRTCConnection = () => {
    console.log("Closing WebRTC connection");
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }

    console.log("WebRTC connection closed.");
};

let handlePlayerLeave=async()=>{
    // document.getElementById('user-2').style.display='none'
}

let handleMessageFromPeer = async (msg, id) => {
    let message = JSON.parse(msg.text)

    if(message.type==='offer'){
        createAnswer(id,message.offer)
    }
    if(message.type==='answer'){
        addAnswer(message.answer)
    }
    if(message.type==='candidate'){

        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }

}

let handlePlayerJoinRoom = async ({socketId}) => {
    if(socketId!=socket.id){

        createOffer(socketId);
    }
}

let createPeerConnection = async (id) => {
    peerConnection = new RTCPeerConnection(servers);
    
    remoteStream = new MediaStream();
    document.getElementById('user-2').srcObject = remoteStream;
    document.getElementById('user-2').style.display='block'

    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        document.getElementById('user-1').srcObject = localStream;
    }

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            socket.emit("sendMessageToPeer", { text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, id)

        }
    }

}

let createOffer = async (id) => {

    await createPeerConnection(id);

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("sendMessageToPeer", { text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, id)

}

let createAnswer = async (id, offer) => {

    await createPeerConnection(id);

    await peerConnection.setRemoteDescription(offer)

    let answer= await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer)

    socket.emit("sendMessageToPeer", { text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, id)
    

}

let addAnswer= async(answer)=>{
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

export default socket