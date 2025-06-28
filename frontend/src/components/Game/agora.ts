import { Socket } from "socket.io-client";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng";
import { useSocketStore } from "../../Zustand_Store/SocketStore";

// Agora configuration
const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
const token = null; // Use token authentication in production

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let localVideoTrack: ICameraVideoTrack | null = null;
let localScreenTrack: ILocalVideoTrack | null = null; // Screen track type
let currentChannel: string | null = null;
let isScreenSharing = false;


export default async function initializeClient(
  socket: Socket
) {
  if (typeof window === "undefined") return;
  
  const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
  // AgoraRTC.setLogLevel(4);
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  setupEventListeners(socket);
  await createLocalMediaTracks();
}

async function createLocalMediaTracks() {
  try {
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack = await AgoraRTC.createCameraVideoTrack();

    // Initially disable tracks
    if (localAudioTrack) {
      localAudioTrack.setEnabled(true);
      localAudioTrack.setMuted(true);
    }
    if (localVideoTrack) {
      localVideoTrack.setEnabled(true);
      localVideoTrack.setMuted(true);
    }


  } catch (error) {
    console.error("Error creating media tracks:", error);
  }
}

async function joinChannel(channelName: string, uid: string) {
  if (!client) return;

  try {
    console.log("Joining channel:", channelName, "with uid:", uid);
    await client.join(appId, channelName, token, uid);
    console.log("Successfully joined channel");

    // Publish tracks after joining
    if (localAudioTrack && localVideoTrack) {
      console.log("Publishing local tracks");
      await client.publish([localAudioTrack, localVideoTrack]);
      console.log("Local tracks published successfully");
    } else {
      console.log("No local tracks available to publish");
    }

    currentChannel = channelName;
  } catch (error) {
    console.error("Error joining channel:", error);
  }
}

function setupEventListeners(socket: Socket) {
  if (!client) return;

  // Handle room joining
  socket.on(
    "joinedRoom",
    async (data: { roomId: string; players: string[]; socketId: string }) => {
      console.log("Received joinedRoom event:", data);
      if (currentChannel !== data.roomId) {
        // Leave previous channel if any
        if (currentChannel) {
          console.log("Leaving previous channel:", currentChannel);
          await leaveChannel();
        }
        // Join new channel
        await joinChannel(data.roomId, socket.id || "");
      }
    }
  );

  // Handle room leaving
  socket.on("leftRoom", async (data: { playerId: string }) => {
    console.log("Received leftRoom event");
    const videoContainer = document.getElementById(
      `user-container-${data.playerId}`
    );
    if (videoContainer) {
      videoContainer.remove();
    }
    // Remove user from store
    const remoteUser = useSocketStore.getState().remoteUsers.find(u => u.uid === data.playerId);
    if (remoteUser) {
      useSocketStore.getState().removeRemoteUser(remoteUser);
    }
    await leaveChannel();
  });

  // Handle user joined
  client.on("user-joined", (user: IAgoraRTCRemoteUser) => {
    console.log("Remote user joined:", user.uid);
    useSocketStore.getState().addRemoteUser(user);
  });

  // Handle user published
  client.on(
    "user-published",
    async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      console.log("User published event:", user.uid, mediaType);
      try {
        // Subscribe to the remote user
        await client?.subscribe(user, mediaType);
        console.log("Subscribed to user:", user.uid, mediaType);

        if (mediaType === "video") {
          const connectedUsersDiv = document.querySelector(".connectedUsers");
          if (!connectedUsersDiv) {
            console.error("Connected users div not found");
            return;
          }

          const joinedUserVid = document.getElementById(
            `user-container-${user.uid}`
          );
          if (joinedUserVid) {
            // Create video element
            const videoElement = document.createElement("video");
            videoElement.id = `user-${user.uid}`;
            videoElement.className = "w-full h-full object-cover";
            videoElement.autoplay = true;
            videoElement.playsInline = true;

            // Add video element to container
            joinedUserVid.appendChild(videoElement);

            // Play the video track
            console.log("Playing video for user:", user.uid);
            user.videoTrack?.play(videoElement);
          }
        }

        if (mediaType === "audio") {
          console.log("Playing audio for user:", user.uid);
          user.audioTrack?.play();
        }

        // Update user state in store
        const store = useSocketStore.getState();
        store.addRemoteUser(user);
      } catch (error) {
        console.error("Error in user-published handler:", error);
      }
    }
  );

  // Handle user unpublished
  client.on("user-unpublished", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
    console.log("User unpublished event:", user.uid, mediaType);
    
    // Update user state in store
    const store = useSocketStore.getState();
    store.addRemoteUser(user);

    // Remove video element if video is unpublished
    if (mediaType === "video") {
      const videoElement = document.getElementById(`user-${user.uid}`);
      if (videoElement) {
        videoElement.remove();
      }
    }
  });

  // Handle user left
  client.on("user-left", (user: IAgoraRTCRemoteUser) => {
    console.log("User left event:", user.uid);
    useSocketStore.getState().removeRemoteUser(user);
    const videoContainer = document.getElementById(
      `user-container-${user.uid}`
    );
    if (videoContainer) {
      videoContainer.remove();
    }
  });

  // Handle user state change
  client.on("user-info-updated", (uid: string, msg: string) => {
    console.log("User state updated:", uid, msg);
    const store = useSocketStore.getState();
    const user = store.remoteUsers.find(u => u.uid === uid);
    if (user) {
      store.addRemoteUser(user);
    }
  });

  // Handle connection state change
  client.on(
    "connection-state-change",
    (curState: string, prevState: string) => {
      console.log("Connection state changed:", prevState, "->", curState);
    }
  );
}

async function leaveChannel() {
  try {
    if (client) {
      await client.leave();
    }
    currentChannel = null;
  } catch (error) {
    console.error("Error leaving channel:", error);
  }
}

export const toggleCamera = async () => {
  if (localVideoTrack) {
    const isMuted = localVideoTrack.muted;
    await localVideoTrack.setMuted(!isMuted); // Toggle mute state

    const localPlayerContainer = document.getElementById("user-1") as HTMLVideoElement;
    if (localPlayerContainer) {
      if (!isMuted) {
        // We're muting now — optionally stop showing video
        localVideoTrack.stop(); // Uncomment if you want to remove video feed
      } else {
        // We're unmuting now — play the video
        localVideoTrack.play(localPlayerContainer);
      }
    }
  }
};

export const toggleMicrophone = async () => {
  if (localAudioTrack) {
    const isMuted = localAudioTrack.muted;
    await localAudioTrack.setMuted(!isMuted);
  }
};

// Function to create screen sharing track
async function createScreenTrack() {
  try {
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    const screenTrackResult = await AgoraRTC.createScreenVideoTrack({
      encoderConfig: "1080p_1",
    });
    
    // Handle the result which can be either a single track or an array
    if (Array.isArray(screenTrackResult)) {
      localScreenTrack = screenTrackResult[0]; // Take the video track from the array
    } else {
      localScreenTrack = screenTrackResult;
    }
    
    console.log("Screen track created successfully");
    return localScreenTrack;
  } catch (error) {
    console.error("Error creating screen track:", error);
    return null;
  }
}

// Function to start screen sharing
export const startScreenShare = async () => {
  if (!client || !currentChannel) {
    console.error("Client not connected or no channel");
    return false;
  }

  try {
    console.log("Starting screen share...");
    
    // Create screen track
    const screenTrack = await createScreenTrack();
    if (!screenTrack) {
      console.error("Failed to create screen track");
      return false;
    }

    // Unpublish current video track
    if (localVideoTrack) {
      await client.unpublish(localVideoTrack);
      console.log("Unpublished video track");
    }

    // Publish screen track
    await client.publish(screenTrack);
    console.log("Published screen track");
    
    isScreenSharing = true;
    return true;
  } catch (error) {
    console.error("Error starting screen share:", error);
    return false;
  }
};

// Function to stop screen sharing
export const stopScreenShare = async () => {
  if (!client || !currentChannel) {
    console.error("Client not connected or no channel");
    return false;
  }

  try {
    console.log("Stopping screen share...");
    
    // Unpublish screen track
    if (localScreenTrack) {
      await client.unpublish(localScreenTrack);
      localScreenTrack.close();
      localScreenTrack = null;
      console.log("Unpublished and closed screen track");
    }

    // Republish video track
    if (localVideoTrack) {
      await client.publish(localVideoTrack);
      console.log("Republished video track");
    }
    
    isScreenSharing = false;
    return true;
  } catch (error) {
    console.error("Error stopping screen share:", error);
    return false;
  }
};

// Function to toggle screen sharing
export const toggleScreenShare = async () => {
  if (isScreenSharing) {
    return await stopScreenShare();
  } else {
    return await startScreenShare();
  }
};
