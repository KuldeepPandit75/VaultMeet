import { RefObject } from 'react';
import Phaser from 'phaser';
import Lobby from './Scenes/Lobby.js';

declare module 'PhaserGame' {
  import { FunctionComponent } from 'react';

  const PhaserGame: FunctionComponent;

  export default PhaserGame;
}

export interface GameConfig extends Phaser.Types.Core.GameConfig {
  parent?: string | HTMLElement | RefObject<HTMLElement> | null;
  scene: typeof Lobby[];
}
