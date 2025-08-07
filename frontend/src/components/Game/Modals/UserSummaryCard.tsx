import React, { useEffect, useState } from "react";
import Image from "next/image";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import type { User } from "@/Zustand_Store/AuthStore";
import { useSocket } from "@/context/SocketContext";
import useChatStore, { Conversation } from "@/Zustand_Store/ChatStore";
import { toast } from "react-hot-toast";
import QuestionSelectionModal from "./QuestionSelectionModal";
import type { DSAQuestion } from "@/data/dsaQuestions";

interface UserCardProps {
  onClose: () => void;
}

const UserSummaryCard: React.FC<UserCardProps> = ({ onClose }) => {
  const { user,setProfileBox, profileBox, getUserBySocketId, getConversations } = useAuthStore();
  const [avatarUser, setAvatarUser] = useState<User | null>();
  const { isDarkMode, primaryAccentColor, secondaryAccentColor } =
    useThemeStore();
  const { socket } = useSocket();
  const [talkLoading, setTalkLoading] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challenge, setChallenge] = useState('Challenge');
  const [error, setError] = useState<string | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const { setIsInGameChatOpen, setGameChatTab, openChat, setGameChatSelectedConversation } = useChatStore();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserBySocketId(profileBox);
        setAvatarUser(userData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUserData();
  }, [profileBox]);

  useEffect(() => {
    if (!socket) return;
    const handleJoinedRoom = () => {
      setTalkLoading(false);
      setProfileBox("close");
    };
    const handleConversationError = (data: { message?: string }) => {
      setTalkLoading(false);
      setError(data.message || "Could not start conversation");
    };
    const handleChallengeSent = () => {
      setChallengeLoading(false);
      setError(null);
    };
    const handleChallengeError = (data: { message?: string }) => {
      setChallengeLoading(false);
      setError(data.message || "Could not send challenge");
    };
    socket.on("joinedRoom", handleJoinedRoom);
    socket.on("conversationError", handleConversationError);
    socket.on("challengeSent", handleChallengeSent);
    socket.on("challengeError", handleChallengeError);
    return () => {
      socket.off("joinedRoom", handleJoinedRoom);
      socket.off("conversationError", handleConversationError);
      socket.off("challengeSent", handleChallengeSent);
      socket.off("challengeError", handleChallengeError);
    };
  }, [socket, setProfileBox]);

  const handleTalk = () => {
    if (!socket || !profileBox) return;
    setTalkLoading(true);
    setError(null);
    socket.emit("startConversation", { targetSocketId: profileBox });
  };

  const handleChallenge = () => {
    setIsQuestionModalOpen(true);
  };

  const handleQuestionSelected = (question: DSAQuestion) => {
    if (!socket || !profileBox) return;
    setChallengeLoading(true);
    setError(null);
    
    socket.emit("sendChallenge", { 
      targetSocketId: profileBox,
      challengerInfo: {
        socketId: socket.id,
        userId: user?._id,
        username: user?.username,
        fullname: user?.fullname
      },
      question: question
    });
    
    setChallenge("Challenge Sent");
    toast.success("Challenge Sent");
    setTimeout(()=>{
      setChallenge("Challenge");
    }, 10000);
  };

  const handleStartChat = async (): Promise<Conversation | null> => {
    if (!avatarUser) return null;

    try {
      // First, try to find an existing conversation
      const conversationsResult = await getConversations(1, 50);
      const existingConversation = conversationsResult.conversations.find(
        conv => conv.otherUser._id === avatarUser._id
      );

      if (existingConversation) {
        // Open existing conversation
        openChat(existingConversation);
        return existingConversation;
      } else {
        // Create a new conversation object without sending a message
        const newConversation: Conversation = {
          conversationId: [avatarUser?._id, avatarUser._id].sort().join('_'),
          otherUser: {
            _id: avatarUser._id,
            fullname: avatarUser.fullname,
            avatar: avatarUser.avatar,
            username: avatarUser.username,
            isOnline: false,
            lastSeen: new Date().toISOString()
          },
          unreadCount: 0
        };
        
        openChat(newConversation);
        return newConversation;
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      return null;
    }
  };

  const handleChat = async () => {
    setIsInGameChatOpen(true);
    setGameChatTab("general");
    
    // Set the selected conversation for the game chat
    const conversation = await handleStartChat();
    if (conversation) {
      setGameChatSelectedConversation(conversation);
    }
    
    setProfileBox("close");
  }

  return (
    <>
      <div>
        <div
          className="w-[100vw] h-[100vh] fixed inset-0 z-10 bg-black/40"
          onClick={() => {
            setProfileBox("close");
          }}
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
            {avatarUser?.avatar ? (
              <Image
                src={avatarUser.avatar}
                alt="avatar"
                width={60}
                height={60}
                className="rounded-full object-cover h-16 w-16"
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 font-bold"
                style={{ width: 60, height: 60, fontSize: 24 }}
              >
                {avatarUser?.fullname.firstname.charAt(0).toUpperCase()}
              </div>
            )}
            <a
              className="text-base font-semibold mt-1 mb-0.5 cursor-pointer hover:underline"
              href={`/profile/${avatarUser?.username}`}
              target="_blank"
            >
              {avatarUser?.fullname.firstname} {avatarUser?.fullname.lastname}
            </a>
            {avatarUser?.location && (
              <p
                className="text-xs"
                style={{ color: isDarkMode ? "#bbb" : "#666" }}
              >
                {avatarUser.location}
              </p>
            )}
            {avatarUser?.bio && (
              <p
                className="text-xs italic px-1"
                style={{ color: isDarkMode ? "#aaa" : "#888" }}
              >
                {avatarUser.bio}
              </p>
            )}
            {avatarUser?.skills && (
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {avatarUser.skills.split(",").map((skill, i) => (
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
            {(avatarUser?.social?.github ||
              avatarUser?.social?.linkedin ||
              avatarUser?.social?.x) && (
              <div className="flex gap-2 justify-center mt-2">
                {avatarUser?.social.github && (
                  <a
                    href={avatarUser.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-xs"
                    style={{ color: secondaryAccentColor }}
                  >
                    GitHub
                  </a>
                )}
                {avatarUser?.social.linkedin && (
                  <a
                    href={avatarUser.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-xs"
                    style={{ color: secondaryAccentColor }}
                  >
                    LinkedIn
                  </a>
                )}
                {avatarUser?.social.x && (
                  <a
                    href={avatarUser.social.x}
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
            <div className="flex gap-2 flex-wrap justify-center">
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
                  cursor: talkLoading ? "not-allowed" : "pointer",
                }}
                onClick={handleTalk}
                disabled={talkLoading}
              >
                {talkLoading ? "Connecting..." : "Talk (Ctrl+Click avatar)"}
              </button>
              
              {/* Challenge Button */}
              <button
                className="mt-3 px-4 py-1 rounded-full font-medium text-sm shadow"
                style={{
                  background: primaryAccentColor,
                  color: isDarkMode ? "#18181b" : "#fff",
                  border: "none",
                  outline: "none",
                  transition: "background 0.2s",
                  opacity: challengeLoading ? 0.6 : 1,
                  cursor: challengeLoading || challenge === "Challenge Sent" ? "not-allowed" : "pointer",
                }}
                onClick={handleChallenge}
                disabled={challengeLoading || challenge === "Challenge Sent"}
              >
                {challengeLoading ? "Sending..." : challenge}
              </button>
              
              {/* Chat Button */}
              <button
                className="mt-3 px-4 py-1 rounded-full font-medium text-sm shadow"
                style={{
                  background: secondaryAccentColor,
                  color: isDarkMode ? "#18181b" : "#fff",
                  border: "none",
                  outline: "none",
                  transition: "background 0.2s",
                  opacity: talkLoading ? 0.6 : 1,
                  cursor: talkLoading ? "not-allowed" : "pointer",
                }}
                onClick={handleChat}
              >
                Chat
              </button>
            </div>
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>
        </div>
      </div>

      {/* Question Selection Modal */}
      <QuestionSelectionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSelectQuestion={handleQuestionSelected}
      />
    </>
  );
};

export default UserSummaryCard;
