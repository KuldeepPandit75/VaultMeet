'use client';

import { useEffect, useRef, useState } from "react";
import type { Game } from 'phaser';
import { useSocket } from "@/context/SocketContext";
import useAuthStore from "@/Zustand_Store/AuthStore";

const PhaserGame = () => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { socket } = useSocket();
  const {user} =useAuthStore();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !gameContainer.current || !socket) return;

    const initGame = async () => {
      const Phaser = (await import('phaser')).default;
      const Lobby = (await import('@/components/Game/Scenes/Lobby')).default;

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
        scene: [Lobby],
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      // Wait for the next frame to ensure scene is initialized
      requestAnimationFrame(() => {
        game.scene.start("Lobby", { socket, userId: user?._id });
      });

      const handleResize = () => {
        if (gameContainer.current) {
          game.scale.resize(
            gameContainer.current.clientWidth,
            gameContainer.current.clientHeight
          );
        }
      };

      const resizeObserver = new ResizeObserver(handleResize);
      if (gameContainer.current) {
        resizeObserver.observe(gameContainer.current);
      }

      return () => {
        game.destroy(true);
        resizeObserver.disconnect();
      };
    };

    initGame();
  }, [isClient, socket]);

  return (
    <div
      ref={gameContainer}
      id="game-container"
      className="w-full h-full"
    />
  );
};

export default PhaserGame;
