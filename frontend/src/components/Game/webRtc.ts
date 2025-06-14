import { Socket } from 'socket.io-client';

let socket: Socket | undefined;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let peerConnection: RTCPeerConnection | null = null;

const servers = {
    iceServers: [
        {
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
    ]
}

const mediaConstraints = { video: true, audio: true };

export const setupWebRTC = async (socketInstance: Socket) => {
    socket = socketInstance;
    socket.on("joinedRoom", handlePlayerJoinRoom)
    socket.on('playerDisconnected',handlePlayerLeave)
    socket.on('leftRoom',closeWebRTCConnection)
    socket.on('messageFromPeer', handleMessageFromPeer)

    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        const videoTrack = localStream?.getTracks().find(track=> track.kind==='video')
        if(videoTrack){
            videoTrack.enabled=false;
        }
        const audioTrack = localStream?.getTracks().find(track=> track.kind==='audio')
        if(audioTrack){
            audioTrack.enabled=false;
        }
        const localVideo = document.getElementById('user-1') as HTMLVideoElement;
        if (!localVideo) return;
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

const handlePlayerLeave=async()=>{
    // document.getElementById('user-2').style.display='none'
}

const handleMessageFromPeer = async (msg: { text: string }, id: string) => {
    const message = JSON.parse(msg.text)

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

const handlePlayerJoinRoom = async ({socketId}: {socketId: string}) => {
    if(socketId!=socket?.id){

        createOffer(socketId);
    }
}

const createPeerConnection = async (id: string) => {
    peerConnection = new RTCPeerConnection(servers);
    
    remoteStream = new MediaStream();
    const remoteVideo = document.getElementById('user-2') as HTMLVideoElement;
    if (!remoteVideo) return;
    remoteVideo.srcObject = remoteStream;
    remoteVideo.style.display='block'

    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        const localVideo = document.getElementById('user-1') as HTMLVideoElement;
        if (!localVideo) return;
        localVideo.srcObject = localStream;
    }

    localStream.getTracks().forEach(track => {
        peerConnection?.addTrack(track, localStream as MediaStream)
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream?.addTrack(track);
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            socket?.emit("sendMessageToPeer", { text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, id)

        }
    }

}

const createOffer = async (id: string) => {

    await createPeerConnection(id);

    const offer = await peerConnection?.createOffer();
    await peerConnection?.setLocalDescription(offer);

    socket?.emit("sendMessageToPeer", { text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, id)

}

const createAnswer = async (id: string, offer: RTCSessionDescription) => {

    await createPeerConnection(id);

    await peerConnection?.setRemoteDescription(offer)

    const answer= await peerConnection?.createAnswer();

    await peerConnection?.setLocalDescription(answer)

    socket?.emit("sendMessageToPeer", { text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, id)
    

}

const addAnswer= async(answer: RTCSessionDescription)=>{
    if(!peerConnection?.currentRemoteDescription){
        peerConnection?.setRemoteDescription(answer)
    }
}

export const toggleCamera = async() => {
    const videoTrack = localStream?.getTracks().find(track=> track.kind==='video')

    if(videoTrack?.enabled){
        videoTrack.enabled=false;
    }else{
        videoTrack!.enabled=true;
    }
}

export const toggleMicrophone = async() => {
    const audioTrack = localStream?.getTracks().find(track=> track.kind==='audio')
    audioTrack!.enabled=!audioTrack!.enabled
}