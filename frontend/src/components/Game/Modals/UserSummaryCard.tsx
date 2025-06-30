import React, { useEffect, useState } from "react";
import Image from "next/image";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import type { User } from "@/Zustand_Store/AuthStore";
import { useSocket } from "@/context/SocketContext";

interface UserCardProps {
  onClose: () => void;
}

const UserSummaryCard: React.FC<UserCardProps> = ({ onClose }) => {
  const { setProfileBox, profileBox, getUserBySocketId } = useAuthStore();
  const [user, setUser] = useState<User | null>();
  const { isDarkMode, primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { socket } = useSocket();
  const [talkLoading, setTalkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
      const fetchUserData=async()=>{
        try{
          const userData= await getUserBySocketId(profileBox);
          setUser(userData);
        }catch(error){
          console.log(error)
        }
      }
      fetchUserData();
  },[profileBox])

  useEffect(() => {
    if (!socket) return;
    const handleJoinedRoom = () => {
      setTalkLoading(false);
      setProfileBox('close');
    };
    const handleConversationError = (data: { message?: string }) => {
      setTalkLoading(false);
      setError(data.message || 'Could not start conversation');
    };
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('conversationError', handleConversationError);
    return () => {
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('conversationError', handleConversationError);
    };
  }, [socket, setProfileBox]);

  const handleTalk = () => {
    if (!socket || !profileBox) return;
    setTalkLoading(true);
    setError(null);
    socket.emit('startConversation', { targetSocketId: profileBox });
  };

  return (
    <div>
      <div className='w-[100vw] h-[100vh] fixed inset-0 z-10 bg-black/40'
      onClick={()=>{setProfileBox('close')}}
      ></div>
      <div
        className="fixed top-1/2 left-1/2 z-50 transform -translate-x-1/2 -translate-y-1/2 shadow-xl border"
        style={{
          background: isDarkMode ? "#18181b" : "#fff",
          color: isDarkMode ? "#fff" : "#18181b",
          borderColor: isDarkMode ? secondaryAccentColor : primaryAccentColor,
          width: "90vw",
          maxWidth: 320,
          padding: 18,
          borderRadius: 18,
        }}
      >
        <button
          className="absolute top-2 right-2 text-lg font-bold"
          style={{ color: isDarkMode ? "#aaa" : "#444" }}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col items-center text-center gap-2">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt="avatar"
              width={60}
              height={60}
              className="rounded-full object-cover"
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 font-bold"
              style={{ width: 60, height: 60, fontSize: 24 }}
            >
              {user?.fullname.firstname.charAt(0).toUpperCase()}
            </div>
          )}
          <a 
          className="text-base font-semibold mt-1 mb-0.5 cursor-pointer hover:underline"
          href={`/profile/${user?._id}`}
          target="_blank"
          >
            {user?.fullname.firstname} {user?.fullname.lastname}
          </a>
          {user?.location && (
            <p
              className="text-xs"
              style={{ color: isDarkMode ? "#bbb" : "#666" }}
            >
              {user.location}
            </p>
          )}
          {user?.bio && (
            <p
              className="text-xs italic px-1"
              style={{ color: isDarkMode ? "#aaa" : "#888" }}
            >
              {user.bio}
            </p>
          )}
          {user?.skills && (
            <div className="flex flex-wrap gap-1 justify-center mt-1">
              {user.skills.split(",").map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px]"
                  style={{
                    background: isDarkMode
                      ? secondaryAccentColor + "33"
                      : primaryAccentColor + "22",
                    color: isDarkMode ? "#fff" : "#222",
                  }}
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          )}
          {(user?.social?.github ||
            user?.social?.linkedin ||
            user?.social?.x) && (
            <div className="flex gap-2 justify-center mt-2">
              {user?.social.github && (
                <a
                  href={user.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-xs"
                  style={{ color: secondaryAccentColor }}
                >
                  GitHub
                </a>
              )}
              {user?.social.linkedin && (
                <a
                  href={user.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-xs"
                  style={{ color: secondaryAccentColor }}
                >
                  LinkedIn
                </a>
              )}
              {user?.social.x && (
                <a
                  href={user.social.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-xs"
                  style={{ color: secondaryAccentColor }}
                >
                  Twitter
                </a>
              )}
            </div>
          )}
          {/* Talk Button */}
          <button
            className="mt-3 px-4 py-1 rounded-full font-medium text-sm shadow"
            style={{
              background: secondaryAccentColor,
              color: isDarkMode ? "#18181b" : "#fff",
              border: "none",
              outline: "none",
              transition: "background 0.2s",
              opacity: talkLoading ? 0.6 : 1,
              cursor: talkLoading ? 'not-allowed' : 'pointer',
            }}
            onClick={handleTalk}
            disabled={talkLoading}
          >
            {talkLoading ? 'Connecting...' : 'Talk'}
          </button>
          {error && (
            <div className="text-xs text-red-500 mt-1">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSummaryCard;
