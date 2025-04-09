import { getSocket } from "../../features/socket";


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

let init = async () => {


    const socket = getSocket();

    if (socket.connected) {

        socket.on("playerJoined", handlePlayerJoined)
    } else {
        socket.on('connect', () => {
            socket.on("playerJoined", handlePlayerJoined)

        })
    }



    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    document.getElementById('user-1').srcObject = localStream;

    createOffer()
}

let handlePlayerJoined = async (socketId) => {
    console.log("webrtc noti for user joined:", socketId)
}

let createOffer = async () => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('user-2').srcObject = remoteStream;

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
            console.log('New ICE candidate:', event.candidate)
        }
    }

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log('Offer:', offer)

}

setTimeout(() => {

    init();
}, 1000)