import { Socket } from "socket.io-client";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { useSocketStore } from "../../Zustand_Store/SocketStore";

// Agora configuration
const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
const token = null; // Use token authentication in production

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let localVideoTrack: ICameraVideoTrack | null = null;
let currentChannel: string | null = null;

export default async function initializeClient(
  socket: Socket
) {
  if (typeof window === "undefined") return;

  const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
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
    if (localAudioTrack) localAudioTrack.setEnabled(false);
    if (localVideoTrack) localVideoTrack.setEnabled(false);
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
        await joinChannel(data.roomId, data.socketId);
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
        const updatedUser = { ...user };
        if (mediaType === "audio") updatedUser.hasAudio = true;
        if (mediaType === "video") updatedUser.hasVideo = true;
        store.addRemoteUser(updatedUser);
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
    const updatedUser = { ...user };
    if (mediaType === "audio") updatedUser.hasAudio = false;
    if (mediaType === "video") updatedUser.hasVideo = false;
    store.addRemoteUser(updatedUser);

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
      const updatedUser = { ...user };
      if (msg === "mute-video") updatedUser.hasVideo = false;
      else if (msg === "unmute-video") updatedUser.hasVideo = true;
      else if (msg === "mute-audio") updatedUser.hasAudio = false;
      else if (msg === "unmute-audio") updatedUser.hasAudio = true;
      store.addRemoteUser(updatedUser);
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
    const isEnabled = !localVideoTrack.enabled;
    localVideoTrack.setEnabled(isEnabled);

    const localPlayerContainer = document.getElementById(
      "user-1"
    ) as HTMLVideoElement;
    if (localPlayerContainer) {
      if (isEnabled) {
        localVideoTrack.play(localPlayerContainer);
      } else {
        // localVideoTrack.stop();
      }
    }
  }
};

export const toggleMicrophone = async () => {
  if (localAudioTrack) {
    localAudioTrack.setEnabled(!localAudioTrack.enabled);
  }
};
