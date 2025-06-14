import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Message } from "@/Zustand_Store/MsgStore";
import { Socket } from "socket.io-client";

interface ChatBoxProps {
  messages: Message[];
  socket: Socket | null;
  handleSentMsg: () => void;
  setTypedMsg: (msg: string) => void;
  typedMsg: string;
}

export const ChatBox = ({ messages, socket, handleSentMsg, setTypedMsg, typedMsg }: ChatBoxProps) => {
  return (
    <div className="h-[60vh] w-[25vw] absolute bottom-20 right-10 bg-[#111] rounded-lg !p-5 flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((msg, index) => (
            <div
              key={index}
              className={`mb-2 ${
                msg.senderId === socket?.id ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block !p-2 rounded-lg ${
                  msg.senderId === socket?.id ? "bg-blue-500" : "bg-gray-500"
                }`}
              >
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
            if (e.key === "Enter") {
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
  );
};
