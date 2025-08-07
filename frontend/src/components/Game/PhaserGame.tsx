'use client';

import { useEffect, useRef, useState } from "react";
import type { Game } from 'phaser';
import { useSocket } from "@/context/SocketContext";
import useAuthStore from "@/Zustand_Store/AuthStore";
import LeaderboardModal from "./Modals/LeaderboardModal";
import TopDevelopersModal from "./Modals/TopDevelopersModal";

interface PhaserGameProps {
  eventId?: string; // Optional eventId for event-specific spaces
  roomId?: string; // Optional roomId for room-specific spaces
  mapType?: string; // NEW: Map type to load (e.g., "general", "hackmeet")
}

const PhaserGame = ({ eventId, roomId, mapType = "hackmeet" }: PhaserGameProps) => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTopDevelopers, setShowTopDevelopers] = useState(false);
  const { socket } = useSocket();
  const {user} = useAuthStore();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle leaderboard modal events
  useEffect(() => {
    const handleOpenLeaderboard = () => {
      setShowLeaderboard(true);
    };

    const handleOpenProgLeaderboard = () => {
      setShowTopDevelopers(true);
    };

    window.addEventListener('openLeaderboard', handleOpenLeaderboard);
    window.addEventListener('openProgLeaderboard', handleOpenProgLeaderboard);

    return () => {
      window.removeEventListener('openLeaderboard', handleOpenLeaderboard);
      window.removeEventListener('openProgLeaderboard', handleOpenProgLeaderboard);
    };
  }, []);

  useEffect(() => {
    if (!isClient || !gameContainer.current || !socket) return;

    let resizeObserver: ResizeObserver | null = null;

    const initGame = async () => {
      const Phaser = (await import('phaser')).default;
      const Lobby = (await import('@/components/Game/Scenes/Lobby')).default;
      const GeneralSpace = (await import('@/components/Game/Scenes/GeneralSpace')).default;

      if (!gameContainer.current) return;

      const config = {
        type: Phaser.AUTO,
        width: gameContainer.current.clientWidth,
        height: gameContainer.current.clientHeight - 400,
        backgroundColor: "#000",
        pixelArt: true,
        parent: gameContainer.current,
        physics: {
          default: "arcade",
          arcade: {
            gravity: { y: 0, x: 0 },
            debug: false,
          },
        },
        scene: mapType === "general" ? [GeneralSpace] : [Lobby],
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      // Wait for the next frame to ensure scene is initialized
      requestAnimationFrame(() => {
        const sceneKey = mapType === "general" ? "GeneralSpace" : "Lobby";
        game.scene.start(sceneKey, { 
          socket, 
          userId: user?._id,
          eventId: eventId, // Pass eventId to the scene
          roomId: roomId, // Pass roomId to the scene
          mapType: mapType // NEW: Pass mapType to the scene
        });
      });

      const handleResize = () => {
        if (gameContainer.current) {
          game.scale.resize(
            gameContainer.current.clientWidth,
            gameContainer.current.clientHeight
          );
        }
      };

      resizeObserver = new ResizeObserver(handleResize);
      if (gameContainer.current) {
        resizeObserver.observe(gameContainer.current);
      }
    };

    initGame();

    // Cleanup function for the useEffect
    return () => {
      // Destroy the game if it exists
      if (gameRef.current) {
        console.log('Destroying Phaser game...');
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      
      // Disconnect resize observer if it exists
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    };
  }, [isClient, socket, eventId, roomId, user?._id]);

  return (
    <>
      <div
        ref={gameContainer}
        id="game-container"
        className="w-full h-full"
      />
      <LeaderboardModal 
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
      <TopDevelopersModal 
        isOpen={showTopDevelopers}
        onClose={() => setShowTopDevelopers(false)}
      />
    </>
  );
};

export default PhaserGame;
