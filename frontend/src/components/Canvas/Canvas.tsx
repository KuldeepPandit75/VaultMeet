import PhaserGame from "./PhaserGame.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faMicrophone,
  faPaperPlane,
  faVideo,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getSocket } from '../../features/socket.js';

type Message = {
  message: string;
  senderId: string;
  timestamp: number;
}

function Canvas() {
  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);
  const [box, setBox] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMsg, setTypedMsg] = useState("");
  
  const recMsgs = useSelector((state: any) => state.recMsg) as Message[];

  
  useEffect(() => {
    if (recMsgs && recMsgs.length > 0) {
      const newMessage = recMsgs[recMsgs.length - 1];
      const socket=getSocket();
      if(newMessage.senderId!=socket.id){

        setMessages(prev => [...prev, newMessage]);
      }
    }
  }, [recMsgs]);
  
  const handleSentMsg = () => {
    if (!typedMsg.trim()) return;
    
    const socket = getSocket();
    const newMessage = {
      message: typedMsg,
      senderId: socket.id,
      timestamp: Date.now()
    };
    
    socket.emit("sendMsg", { message: typedMsg });
    if(!socket?.id) return;
    setMessages(prev => [...prev, newMessage]);
    setTypedMsg("");
    console.log(messages)
  };


  return (
    <div className="overflow-hidden">
      <PhaserGame />
      {box ? (
        <div className="h-[60vh] w-[25vw] absolute bottom-30 right-10 bg-[#111] rounded-lg !p-5 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4">
            {messages
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((msg, index) => (
                <div key={index} className={`mb-2 ${msg.senderId === getSocket().id ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block !p-2 rounded-lg ${msg.senderId === getSocket().id ? 'bg-blue-500' : 'bg-gray-500'}`}>
                    {msg.message}
                  </div>
                </div>
              ))}
          </div>
          <div className="w-full flex items-center justify-between">
            <input
              type="text"
              className="w-[80%] bg-white h-8 rounded-lg !px-2"
              placeholder="Enter Message"
              value={typedMsg}
              onChange={(e) => {
                setTypedMsg(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSentMsg();
                }
              }}
            />
            <FontAwesomeIcon
              icon={faPaperPlane}
              className="h-5 w-5 bg-white rounded-[50%] !p-2 cursor-pointer"
              onClick={handleSentMsg}
            />
          </div>
        </div>
      ) : null}
      <div className="absolute w-[25vw] h-[60px] bg-[#111] bottom-10 right-10 rounded-lg flex justify-around items-center">
        {mic ? (
          <button
            className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
            onClick={() => {
              setMic(false);
            }}
          >
            <FontAwesomeIcon icon={faMicrophone} className="text-white" />
          </button>
        ) : (
          <button
            className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
            onClick={() => {
              setMic(true);
            }}
          >
            <FontAwesomeIcon
              icon={faMicrophoneSlash}
              className="text-red-500"
            />{" "}
          </button>
        )}
        {video ? (
          <button
            className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
            onClick={() => {
              setVideo(false);
            }}
          >
            <FontAwesomeIcon icon={faVideo} className="text-white" />{" "}
          </button>
        ) : (
          <button
            className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
            onClick={() => {
              setVideo(true);
            }}
          >
            <FontAwesomeIcon icon={faVideoSlash} className="text-red-500" />{" "}
          </button>
        )}
        <button
          className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
          onClick={() => {
            setBox((prev) => !prev);
          }}
        >
          <FontAwesomeIcon icon={faMessage} className="text-white" />{" "}
        </button>
      </div>
    </div>
  );
}

export default Canvas;
