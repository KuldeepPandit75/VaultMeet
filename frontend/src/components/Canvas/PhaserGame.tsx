import Phaser from "phaser";
import { useEffect, useRef } from "react";
import Lobby from "./Scenes/Lobby.js";

const PhaserGame = () => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#000",
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

    const handleResize = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      game.destroy(true);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={gameContainer}
      id="game-container"
      style={{ width: "100%", height: "100vh" }}
    />
  );
};

export default PhaserGame;
