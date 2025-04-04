import Phaser from 'phaser';
import { Socket } from 'socket.io-client';

declare class Lobby extends Phaser.Scene {
    socket: Socket | null;
    otherPlayers: { [id: string]: Phaser.Physics.Arcade.Sprite };
    player: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    distBwUnP: number;

    constructor();

    preload(): void;

    create(): void;

    update(): void;

    initializeSocket(): void;

    shutdown(): void;
}

export default Lobby;
