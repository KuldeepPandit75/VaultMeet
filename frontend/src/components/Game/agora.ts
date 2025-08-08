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

// Callback function for screen share state changes
let screenShareStateCallback: ((isSharing: boolean) => void) | null = null;

// Function to register screen share state callback
export const onScreenShareStateChange = (callback: (isSharing: boolean) => void) => {
  screenShareStateCallback = callback;
};

// Function to notify about screen share state changes
const notifyScreenShareStateChange = (isSharing: boolean) => {
  isScreenSharing = isSharing;
  if (screenShareStateCallback) {
    screenShareStateCallback(isSharing);
  }
};

export default async function initializeClient(
  socket: Socket
) {
  if (typeof window === "undefined") return;
  
  const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
  AgoraRTC.setLogLevel(4);
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  setupEventListeners(socket);
  await createLocalMediaTracks();
}

async function createLocalMediaTracks() {
  const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
  
  // Create audio track independently
  try {
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: "music_standard", // Better quality for voice
    });
    
    // Initially enable but mute audio track
    if (localAudioTrack) {
      localAudioTrack.setEnabled(true);
      localAudioTrack.setMuted(true);
    }
    
    console.log("Audio track created successfully");
  } catch (error) {
    console.error("Error creating audio track:", error);
    localAudioTrack = null;
  }

  // Create video track independently
  try {
    localVideoTrack = await AgoraRTC.createCameraVideoTrack({
      encoderConfig: "480p_1", // Lower resolution for better performance
      facingMode: "user",
    });
    
    // Initially disable video track
    if (localVideoTrack) {
      localVideoTrack.setEnabled(false);
    }
    
    console.log("Video track created successfully");
  } catch (error) {
    console.error("Error creating video track:", error);
    localVideoTrack = null;
  }
}

async function joinChannel(channelName: string, uid: string) {
  if (!client) return;

  // Check if client is already connected to the same channel
  if (client.connectionState === "CONNECTED" && currentChannel === channelName) {
    console.log("Already connected to channel:", channelName);
    return;
  }

  try {
    console.log("Joining channel:", channelName, "with uid:", uid);
    await client.join(appId, channelName, token, uid);
    console.log("Successfully joined channel");

    // Publish available tracks after joining
    const tracksToPublish = [];
    
    if (localAudioTrack && localAudioTrack.enabled) {
      tracksToPublish.push(localAudioTrack);
      console.log("Audio track added for publishing");
    } else if (localAudioTrack && !localAudioTrack.enabled) {
      console.log("Audio track exists but is disabled, skipping publish");
    } else {
      console.log("No audio track available");
    }
    
    // Only publish video track if it's enabled
    if (localVideoTrack && localVideoTrack.enabled) {
      tracksToPublish.push(localVideoTrack);
      console.log("Video track added for publishing");
    } else if (localVideoTrack && !localVideoTrack.enabled) {
      console.log("Video track exists but is disabled, skipping publish");
    } else {
      console.log("No video track available");
    }
    
    if (tracksToPublish.length > 0) {
      console.log(`Publishing ${tracksToPublish.length} track(s)`);
      await client.publish(tracksToPublish);
      console.log("Local tracks published successfully");
    } else {
      console.log("No tracks available to publish");
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
      } else {
        console.log("Already connected to channel:", data.roomId);
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
  });

  socket.on('leaveChannel',async()=>{
    
    const remoteUsers = useSocketStore.getState().remoteUsers;
    if (remoteUsers) {
      useSocketStore.getState().clearRemoteUsers();
    }
    console.log('leaving Channel');
    await leaveChannel();
  })

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
  if (!localVideoTrack || !client) return;

  try {
    const isEnabled = localVideoTrack.enabled;
    
    if (!isEnabled) {
      // Enable video track first
      await localVideoTrack.setEnabled(true);
      
      // Publish the video track if connected to a channel
      if (currentChannel && client.connectionState === "CONNECTED") {
        await client.publish(localVideoTrack);
        console.log("Video track published after enabling");
      }
      
      // Play the video locally
      const localPlayerContainer = document.getElementById("user-1") as HTMLVideoElement;
      if (localPlayerContainer) {
        await localVideoTrack.play(localPlayerContainer);
        localPlayerContainer.style.display = "block";
      }
    } else {
      // Unpublish the video track before disabling
      if (currentChannel && client.connectionState === "CONNECTED") {
        await client.unpublish(localVideoTrack);
        console.log("Video track unpublished before disabling");
      }
      
      // Disable video track
      await localVideoTrack.setEnabled(false);
      
      // Stop local video display
      const localPlayerContainer = document.getElementById("user-1") as HTMLVideoElement;
      if (localPlayerContainer) {
        localVideoTrack.stop();
        localPlayerContainer.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error toggling camera:", error);
  }
};

// Function to get available media devices
export const getAvailableDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
    const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
    
    return {
      audioInputDevices,
      videoInputDevices
    };
  } catch (error) {
    console.error("Error getting available devices:", error);
    return {
      audioInputDevices: [],
      videoInputDevices: []
    };
  }
};

// Function to switch audio input device
export const switchAudioDevice = async (deviceId: string) => {
  if (!client) return false;
  
  try {
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    
    // Create new audio track with selected device
    const newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
      microphoneId: deviceId,
      encoderConfig: "music_standard",
    });
    
    // Unpublish old track if it exists
    if (localAudioTrack) {
      await client.unpublish(localAudioTrack);
      localAudioTrack.close();
    }
    
    localAudioTrack = newAudioTrack;
    
    // Publish new audio track
    if (localAudioTrack) {
      await client.publish(localAudioTrack);
    }
    
    console.log("Audio device switched successfully");
    return true;
  } catch (error) {
    console.error("Error switching audio device:", error);
    return false;
  }
};

// Function to switch video input device
export const switchVideoDevice = async (deviceId: string) => {
  if (!client) return false;
  
  try {
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    
    // Create new video track with selected device
    const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
      cameraId: deviceId,
      encoderConfig: "480p_1",
      facingMode: "user",
    });
    
    // Unpublish old track if it exists
    if (localVideoTrack) {
      await client.unpublish(localVideoTrack);
      localVideoTrack.close();
    }
    
    localVideoTrack = newVideoTrack;
    
    // Publish new video track
    if (localVideoTrack) {
      await client.publish(localVideoTrack);
      
      // Update local video display
      const localPlayerContainer = document.getElementById("user-1") as HTMLVideoElement;
      if (localPlayerContainer && !localVideoTrack.muted) {
        await localVideoTrack.play(localPlayerContainer);
      }
    }
    
    console.log("Video device switched successfully");
    return true;
  } catch (error) {
    console.error("Error switching video device:", error);
    return false;
  }
};

export const toggleMicrophone = async () => {
  if (!localAudioTrack || !client) return;

  try {
    const isMuted = localAudioTrack.muted;
    await localAudioTrack.setMuted(!isMuted);
    console.log(`Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
  } catch (error) {
    console.error("Error toggling microphone:", error);
  }
};

// Function to retry creating video track (useful when camera becomes available)
export const retryVideoTrack = async () => {
  if (!client) return false;
  
  try {
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    
    // Try to create video track again
    const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
      encoderConfig: "480p_1",
      facingMode: "user",
    });
    
    localVideoTrack = newVideoTrack;
    
    // Initially mute the video track
    if (localVideoTrack) {
      localVideoTrack.setEnabled(true);
      localVideoTrack.setMuted(true);
    }
    
    // Publish the new video track if we're in a channel
    if (currentChannel && localVideoTrack) {
      await client.publish(localVideoTrack);
    }
    
    console.log("Video track created and published successfully");
    return true;
  } catch (error) {
    console.error("Error retrying video track creation:", error);
    return false;
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
    
    // Add event listener for when screen sharing ends externally
    if (localScreenTrack) {
      localScreenTrack.on("track-ended", () => {
        console.log("Screen sharing ended by user (external)");
        handleScreenShareEndedExternally();
      });
    }
    
    console.log("Screen track created successfully");
    return localScreenTrack;
  } catch (error) {
    console.error("Error creating screen track:", error);
    return null;
  }
}

// Function to handle screen share ending externally (from browser popup)
async function handleScreenShareEndedExternally() {
  if (!client || !currentChannel) {
    console.error("Client not connected or no channel");
    return;
  }

  try {
    console.log("Handling external screen share stop...");
    
    // Unpublish screen track
    if (localScreenTrack) {
      await client.unpublish(localScreenTrack);
      localScreenTrack.close();
      localScreenTrack = null;
      console.log("Unpublished and closed screen track");
    }

    // Republish video track if available
    if (localVideoTrack) {
      await client.publish(localVideoTrack);
      console.log("Republished video track");
    }
    
    // Notify about state change
    notifyScreenShareStateChange(false);
    console.log("Screen share stopped externally");
  } catch (error) {
    console.error("Error handling external screen share stop:", error);
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
    
    // Notify about state change
    notifyScreenShareStateChange(true);
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
    
    // Notify about state change
    notifyScreenShareStateChange(false);
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

// Function to cleanup Agora client and tracks
export const cleanupAgoraClient = async () => {
  console.log("Cleaning up Agora client...");
  
  try {
    // Stop screen sharing if active
    if (isScreenSharing) {
      await stopScreenShare();
    }
    
    // Leave current channel
    if (client && currentChannel) {
      await client.leave();
      currentChannel = null;
    }
    
    // Close local tracks
    if (localAudioTrack) {
      localAudioTrack.close();
      localAudioTrack = null;
    }
    
    if (localVideoTrack) {
      localVideoTrack.close();
      localVideoTrack = null;
    }
    
    if (localScreenTrack) {
      localScreenTrack.close();
      localScreenTrack = null;
    }
    
    // Clear remote users from store
    useSocketStore.getState().clearRemoteUsers();
    
    console.log("Agora client cleanup complete");
  } catch (error) {
    console.error("Error during Agora client cleanup:", error);
  }
};
