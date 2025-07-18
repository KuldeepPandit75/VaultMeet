"use client"
import { WhiteBoard } from "@/components/Game/WhiteBoard";
import { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

export default function Test() {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;
    
        // Connect socket first
        socket.connect();
      }, [socket]);

    return (
        <div className="p-10 h-screen w-screen">
            <WhiteBoard roomId="whiteboard"/>
        </div>
    )
}