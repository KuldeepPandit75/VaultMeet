import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useSocket } from "@/context/SocketContext";
import { useSocketStore } from "@/Zustand_Store/SocketStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { useEffect, useState, useCallback, useRef } from "react";
import useAuthStore, { User } from "@/Zustand_Store/AuthStore";
import Image from "next/image";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
type ExtendedAgoraUser = IAgoraRTCRemoteUser & { _video_muted_?: boolean; _audio_muted_?: boolean };

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  }
);

interface WhiteBoardProps {
  roomId?: string;
}

// Type definitions for Excalidraw
interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roundness: { type: number; value?: number } | null;
  seed: number;
  groupIds: string[];
  frameId: string | null;
  index: string;
  link: string | null;
  locked: boolean;
  opacity: number;
  updated: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  customData?: Record<string, unknown>;
  roughness: number;
  width: number;
  height: number;
  angle: number;
  boundElements: Array<{ id: string; type: string }> | null;
  [key: string]: unknown;
}

interface ExcalidrawAppState {
  [key: string]: unknown;
}

interface ExcalidrawFiles {
  [key: string]: unknown;
}

export const WhiteBoard = ({ roomId }: WhiteBoardProps) => {
  const { socket, isConnected } = useSocket();
  const { setIsWhiteboardOpen, remoteUsers } = useSocketStore();
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const { getUserBySocketId } = useAuthStore();
  const [excalidrawAPI, setExcalidrawAPI] = useState<unknown>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef<boolean>(false);
  const hasUserMadeChangesRef = useRef<boolean>(false);
  const initialLoadCompleteRef = useRef<boolean>(false);
  const [userDatas, setUserDatas] = useState<{ [key: string]: User }>({});
  const [followedUserId, setFollowedUserId] = useState<string | null>(null);
  const [whiteboardRoomUsers, setWhiteboardRoomUsers] = useState<string[]>([]);
  const [isUsersPanelCollapsed, setIsUsersPanelCollapsed] = useState<boolean>(false);
  const lastElementsUpdateRef = useRef<string>("");
  const lastScrollUpdateRef = useRef<string>("");
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState<boolean>(false);
  const [initialWhiteboardData, setInitialWhiteboardData] = useState<{
    elements: ExcalidrawElement[];
    appState: ExcalidrawAppState;
    files: ExcalidrawFiles;
  }>({
    elements: [],
    appState: {},
    files: {}
  });

  // Ensure socket is connected
  useEffect(() => {
    if (socket && !socket.connected) {
      console.log("Connecting socket for whiteboard...");
      socket.connect();
    }
  }, [socket]);

  // Fetch user info for all whiteboard room users (not just remoteUsers)
  useEffect(() => {
    const fetchUserNames = async () => {
      const names: { [key: string]: User } = {};
      // Combine whiteboardRoomUsers and remoteUsers for completeness
      const allSocketIds = Array.from(new Set([...whiteboardRoomUsers, ...remoteUsers.map(u => u.uid.toString())]));
      for (const socketId of allSocketIds) {
        if (!socket || socket.id === socketId) continue; // skip self
        try {
          const userData = await getUserBySocketId(socketId);
          names[socketId] = userData;
        } catch {
          // fallback: just skip
        }
      }
      setUserDatas(names);
    };
    fetchUserNames();
  }, [whiteboardRoomUsers, remoteUsers, getUserBySocketId, socket]);

  // Track actual whiteboard room users and handle initial data
  useEffect(() => {
    if (!socket || !roomId || !isConnected) return;
    
    console.log("Setting up whiteboard room listeners for room:", roomId);
    
    // Handler for initial join
    const handleRoomJoined = (data: { roomId: string; players: string[]; whiteboardData: { elements: ExcalidrawElement[]; appState: ExcalidrawAppState; files: ExcalidrawFiles } }) => {
      console.log("Whiteboard room joined:", data);
      if (data.roomId === roomId && Array.isArray(data.players)) {
        setWhiteboardRoomUsers(data.players);
        if (data.whiteboardData) {
          console.log("Setting initial whiteboard data:", data.whiteboardData);
          setInitialWhiteboardData({
            elements: data.whiteboardData.elements || [],
            appState: data.whiteboardData.appState || {},
            files: data.whiteboardData.files || {}
          });
          setIsInitialDataLoaded(true);
        } else {
          // If no existing data, mark as loaded anyway
          setIsInitialDataLoaded(true);
        }
      }
    };
    
    // Handler for user joined
    const handleUserJoined = (data: { roomId: string; players: string[] }) => {
      if (data.roomId === roomId && Array.isArray(data.players)) {
        setWhiteboardRoomUsers(data.players);
      }
    };
    
    // Handler for user left
    const handleUserLeft = (data: { roomId: string; remainingPlayers: string[] }) => {
      if (data.roomId === roomId && Array.isArray(data.remainingPlayers)) {
        setWhiteboardRoomUsers(data.remainingPlayers);
      }
    };

    // Handler for whiteboard errors
    const handleWhiteboardError = (data: { message: string }) => {
      console.error("Whiteboard error:", data.message);
      // Still load the whiteboard with empty state on error
      setIsInitialDataLoaded(true);
    };
    
    socket.on("whiteboardRoomJoined", handleRoomJoined);
    socket.on("whiteboardUserJoined", handleUserJoined);
    socket.on("whiteboardUserLeft", handleUserLeft);
    socket.on("whiteboardError", handleWhiteboardError);
    
    return () => {
      socket.off("whiteboardRoomJoined", handleRoomJoined);
      socket.off("whiteboardUserJoined", handleUserJoined);
      socket.off("whiteboardUserLeft", handleUserLeft);
      socket.off("whiteboardError", handleWhiteboardError);
    };
  }, [socket, roomId, isConnected]);

  // Join whiteboard room when socket is connected
  useEffect(() => {
    if (roomId && socket && isConnected) {
      console.log("Joining whiteboard room:", roomId);
      // Join the whiteboard room
      socket.emit("joinWhiteboardRoom", { roomId });
      
      // Reset flags when joining a new room
      hasUserMadeChangesRef.current = false;
      initialLoadCompleteRef.current = false;
      setIsInitialDataLoaded(false);
      
      return () => {
        console.log("Leaving whiteboard room:", roomId);
        socket.emit("leaveWhiteboardRoom", { roomId });
        setIsWhiteboardOpen(false);
      };
    }
  }, [roomId, socket, isConnected, setIsWhiteboardOpen]);

  // Fallback: If socket is not connected after 5 seconds, load whiteboard anyway
  useEffect(() => {
    if (roomId && !isInitialDataLoaded) {
      const fallbackTimer = setTimeout(() => {
        if (!isInitialDataLoaded) {
          console.log("Socket connection timeout, loading whiteboard with empty state");
          setIsInitialDataLoaded(true);
        }
      }, 5000);

      return () => clearTimeout(fallbackTimer);
    }
  }, [roomId, isInitialDataLoaded]);

  const handleExcalidrawChange = useCallback((elements: readonly unknown[], appState: {scrollX: number, scrollY: number}, files: unknown) => {
    if (socket && roomId && !isUpdatingRef.current) {
      // Don't send updates until the user has actually made changes
      // and the initial load is complete
      if (!hasUserMadeChangesRef.current || !initialLoadCompleteRef.current) {
        const elementsArray = elements as ExcalidrawElement[];
        if (elementsArray.length > 0) {
          hasUserMadeChangesRef.current = true;
        }
        return;
      }

      const elementsArray = elements as ExcalidrawElement[];
      const elementsString = JSON.stringify(elementsArray);
      const scrollString = JSON.stringify({ scrollX: appState.scrollX, scrollY: appState.scrollY });
      
      // Check if either elements or scroll position has changed
      const elementsChanged = elementsString !== lastElementsUpdateRef.current;
      const scrollChanged = scrollString !== lastScrollUpdateRef.current;
      
      // Only send updates if something has actually changed
      if (!elementsChanged && !scrollChanged) {
        return; // No changes, don't send update
      }

      // Clear any pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        // Always use your own scrollX/scrollY when sending
        lastElementsUpdateRef.current = elementsString;
        lastScrollUpdateRef.current = scrollString;
        socket.emit("whiteboardUpdate", {
          roomId,
          elements: elementsArray.map(el => ({ ...el })),
          appState: { scrollX: appState.scrollX, scrollY: appState.scrollY },
          files: { ...(files as ExcalidrawFiles) },
          userId: socket.id,
        });
        console.log("Update sent:", elementsChanged ? "elements" : "scroll only");
      }, 150);
    }
  }, [socket, roomId]);

  // Listen for updates from other users
  useEffect(() => {
    if (!socket || !roomId || !excalidrawAPI) return;

    const handleWhiteboardUpdate = (data: { 
      roomId: string; 
      userId: string; 
      elements: ExcalidrawElement[]; 
      appState: {scrollX: number, scrollY: number};
      files: ExcalidrawFiles;
    }) => {
      if (data.roomId === roomId && data.userId !== socket.id) {
        // Deduplication: Only compare what you actually apply
        const elementsString = JSON.stringify(data.elements);
        let scrollString = "";
        let appStateToApply: ExcalidrawAppState = {};
        if (data.userId === followedUserId) {
          // If following, apply scroll
          appStateToApply = { scrollX: data.appState.scrollX, scrollY: data.appState.scrollY };
          scrollString = JSON.stringify({ scrollX: data.appState.scrollX, scrollY: data.appState.scrollY });
        } else {
          // Not following, ignore scroll
          appStateToApply = {};
          scrollString = "";
        }
        // Only deduplicate if both elements and scroll match what you actually apply
        if (elementsString === lastElementsUpdateRef.current && scrollString === lastScrollUpdateRef.current) {
          console.log("Skipping update - same as our last update");
          return;
        }
        try {
          isUpdatingRef.current = true;
          const api = excalidrawAPI as { 
            updateScene?: (data: {
              elements: ExcalidrawElement[];
              appState: ExcalidrawAppState;
              collaborators: Map<string, unknown>;
              commitToHistory: boolean;
            }) => void;
            setElements?: (elements: ExcalidrawElement[]) => void;
            setAppState?: (appState: ExcalidrawAppState) => void;
            getAppState?: () => ExcalidrawAppState;
          };
          if (api.updateScene) {
            api.updateScene({
              elements: data.elements || [],
              appState: appStateToApply || {},
              collaborators: new Map(),
              commitToHistory: false
            });
          } else if (api.setElements && api.setAppState) {
            api.setElements(data.elements || []);
            api.setAppState(appStateToApply || {});
          }
          lastElementsUpdateRef.current = elementsString;
          // Only update scroll reference if we're actually applying scroll changes
          if (data.userId === followedUserId) {
            lastScrollUpdateRef.current = scrollString;
          }
          if (!initialLoadCompleteRef.current) {
            initialLoadCompleteRef.current = true;
          }
        } catch (error) {
          console.error("Error updating scene:", error);
        } finally {
          isUpdatingRef.current = false;
        }
      }
    };

    socket.on("whiteboardUpdate", handleWhiteboardUpdate);

    return () => {
      socket.off("whiteboardUpdate", handleWhiteboardUpdate);
    };
  }, [socket, roomId, excalidrawAPI, followedUserId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Show loading state while initial data is being loaded
  if (!isInitialDataLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex relative">
      {/* Whiteboard main area */}
      <div className="flex-1 h-full relative">
        <Excalidraw
          excalidrawAPI={(api) => {
            setExcalidrawAPI(api);
            // Set initial load complete after a short delay to ensure API is ready
            setTimeout(() => {
              initialLoadCompleteRef.current = true;
              console.log("Excalidraw API initialized and ready");
            }, 1000);
          }}
          onChange={handleExcalidrawChange}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              saveAsImage: false,
            },
          }}
          theme={isDarkMode ? "dark" : "light"}
          initialData={{
            elements: initialWhiteboardData.elements as unknown as readonly ExcalidrawElement[],
            appState: initialWhiteboardData.appState as unknown as ExcalidrawAppState,
            files: initialWhiteboardData.files as unknown as ExcalidrawFiles
          } as Record<string, unknown>}
        />
        
        {/* Toggle Button */}
        <button
          onClick={() => setIsUsersPanelCollapsed(!isUsersPanelCollapsed)}
          className={`absolute right-0 top-10 z-50 p-2 rounded-l-lg transition-all duration-300 shadow-lg ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' 
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          } `}
          title={isUsersPanelCollapsed ? "Show Users" : "Hide Users"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 transition-transform duration-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ transform: !isUsersPanelCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Unified Users List */}
      <div className={`border-l h-full overflow-y-auto p-2.5 flex flex-col gap-2 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      } ${isUsersPanelCollapsed ? 'w-0 p-0 overflow-hidden' : 'w-64'}`}>
        <div className={`rounded-lg shadow-sm border mb-2 w-full ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className={`px-3 py-2.5 font-semibold text-sm border-b ${
            isDarkMode 
              ? 'text-white border-gray-700' 
              : 'text-gray-800 border-gray-200'
          }`}>Users</div>
          <div className="p-3 flex flex-col gap-2.5">
            {
              // Build a unique set of all user socketIds (remote + whiteboard, excluding self)
              Array.from(new Set([
                ...remoteUsers.map(u => u.uid.toString()),
                ...whiteboardRoomUsers
              ])).filter(socketId => socket && socket.id !== socketId)
              .map(socketId => {
                const remoteUser = remoteUsers.find(u => u.uid.toString() === socketId);
                const isRemote = !!remoteUser;
                const isWhiteboard = whiteboardRoomUsers.includes(socketId);
                const canFollow = isWhiteboard;
                const name = userDatas?.[socketId]?.fullname?.firstname || `User ${String(socketId).slice(-4)}`;
                return { socketId, remoteUser, isRemote, isWhiteboard, canFollow, name };
              })
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(({ socketId, remoteUser, isRemote, isWhiteboard, canFollow, name }) => (
                <div key={socketId} className={`relative flex items-center gap-2 rounded-md p-1.5 border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <div className="relative w-9 h-9 flex items-center justify-center">
                    {userDatas?.[socketId]?.avatar ? (
                    <Image
                      src={userDatas?.[socketId]?.avatar || "/public/favicon.ico"}
                      alt="User Avatar"
                      width={36}
                      height={36}
                      className="rounded-full object-cover h-[36px] w-[36px] bg-blue-500 border-2 border-blue-500"
                    />
                    ) : (
                      <div className="h-[36px] w-[36px] flex items-center justify-center rounded-full text-white font-bold text-lg shadow-lg bg-blue-500 border-2 border-blue-500"
                      style={{
                        backgroundColor: primaryAccentColor,
                        boxShadow: `0 4px 12px ${primaryAccentColor}40`,
                      }}>
                        {userDatas?.[socketId]?.fullname?.firstname?.charAt(0) || "U"}
                      </div>
                    )}
                    {/* Mic/Video state icons */}
                    {isRemote && (
                      <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                        {/* Mic indicator */}
                        {(remoteUser as ExtendedAgoraUser)._audio_muted_ ? (
                          <div title="Mic off" className="bg-red-500 rounded-full p-0.5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div title="Mic on" className="bg-green-500 rounded-full p-0.5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {/* Video indicator */}
                        {(remoteUser as ExtendedAgoraUser)._video_muted_ ? (
                          <div title="Video off" className="bg-red-500 rounded-full p-0.5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                        ) : (
                          <div title="Video on" className="bg-blue-500 rounded-full p-0.5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{name}</div>
                    <div className="flex gap-1 mt-0.5">
                      {isRemote && <span title="Remote user" className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 rounded px-1">RTC</span>}
                      {isWhiteboard && <span title="Whiteboard user" className="text-xs text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded px-1">WB</span>}
                    </div>
                  </div>
                  {canFollow && (
                    followedUserId === socketId ? (
                      <button
                        className="bg-red-500 text-white border-none rounded px-2 py-0.5 text-xs cursor-pointer hover:bg-red-600 transition-colors"
                        onClick={() => setFollowedUserId(null)}
                      >
                        Unfollow
                      </button>
                    ) : (
                      <button
                        className="bg-blue-500 text-white border-none rounded px-2 py-0.5 text-xs cursor-pointer hover:bg-blue-600 transition-colors"
                        onClick={() => setFollowedUserId(socketId)}
                      >
                        Follow
                      </button>
                    )
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};