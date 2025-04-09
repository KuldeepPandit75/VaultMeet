import PhaserGame from "./PhaserGame.tsx";
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
import { useNavigate } from "react-router-dom";
import './webrtc.js'

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
  const navigate=useNavigate();
  
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
    if (!socket?.id) {
      console.error('Socket ID is undefined');
      return;
    }

    const newMessage: Message = {
      message: typedMsg,
      senderId: socket.id,
      timestamp: Date.now()
    };
    
    socket.emit("sendMsg", { message: typedMsg });
    setMessages(prev => [...prev, newMessage]);
    setTypedMsg("");
  };

  const navToHome=()=>{
    const socket=getSocket();

    socket.disconnect();

    navigate("/")
    
  }


  return (
    <div className="overflow-hidden">
      <PhaserGame />

      {/* Chat Box */}

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

      {/* buttons */}

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

      {/* homeBtn */}

      <div
        className="homeBtn absolute top-4 right-4 bg-[#111] h-14 w-14 flex justify-center items-center rounded-[50%] cursor-pointer scale-[0.9] hover:scale-[1] transition-all duration-200 hover:shadow-lg hover:shadow-[rgba(0,0,0,0.3)]"
        onClick={navToHome}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          width="40"
          height="40"
          viewBox="0 0 64 64"
          fill="#AF8D86"
        >
          <path d="M 32 8 C 31.08875 8 30.178047 8.3091875 29.435547 8.9296875 L 8.8007812 26.171875 C 8.0357812 26.810875 7.7634844 27.925203 8.2714844 28.783203 C 8.9184844 29.875203 10.35025 30.088547 11.28125 29.310547 L 12 28.710938 L 12 47 C 12 49.761 14.239 52 17 52 L 47 52 C 49.761 52 52 49.761 52 47 L 52 28.712891 L 52.71875 29.3125 C 53.09275 29.6255 53.546047 29.777344 53.998047 29.777344 C 54.693047 29.777344 55.382672 29.416656 55.763672 28.722656 C 56.228672 27.874656 55.954891 26.803594 55.212891 26.183594 L 52 23.498047 L 52 15 C 52 13.895 51.105 13 50 13 L 48 13 C 46.895 13 46 13.895 46 15 L 46 18.484375 L 34.564453 8.9296875 C 33.821953 8.3091875 32.91125 8 32 8 z M 32 12.152344 C 32.11475 12.152344 32.228766 12.191531 32.322266 12.269531 L 48 25.369141 L 48 46 C 48 47.105 47.105 48 46 48 L 38 48 L 38 34 C 38 32.895 37.105 32 36 32 L 28 32 C 26.895 32 26 32.895 26 34 L 26 48 L 18 48 C 16.895 48 16 47.105 16 46 L 16 25.367188 L 31.677734 12.269531 C 31.771234 12.191531 31.88525 12.152344 32 12.152344 z"></path>
        </svg>
      </div>

      {/* Video Call Interface */}

      <video className="video-player absolute h-[25vh] w-[20vw] bg-black top-10 left-10 rounded-sm" id="user-1" autoPlay playsInline></video>
      <video className="video-player absolute h-[25vh] w-[20vw] bg-black top-10 left-90 rounded-sm" id="user-2" autoPlay playsInline></video>
    </div>
  );
}

export default Canvas;
