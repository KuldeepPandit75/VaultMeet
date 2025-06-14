import { Scene, Tilemaps } from "phaser";
import { Socket } from "socket.io-client";

class Lobby extends Scene {
  // private map?: Tilemaps.Tilemap;
  // private tilesets: Tilemaps.Tileset[] = [];
  // private textObjects: Phaser.GameObjects.Text[] = [];
  // private mapLayers: Tilemaps.TilemapLayer[] = [];
  private player?: Phaser.Physics.Arcade.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private running: boolean = false;
  private socket?: Socket;
  private otherPlayers: { [key: string]: Phaser.Physics.Arcade.Sprite } = {};
  private distBwUnP: number = 0;
  private nearbyPlayers: string[] = [];
  private map?: Tilemaps.Tilemap;

  constructor() {
    super({ key: "Lobby" });
    this.running = false;
  }

  preload() {
    // Load the tilemap JSON
    this.load.tilemapTiledJSON("map", "/game/hackmeetSpawnSpace.json");

    this.load.spritesheet("player", "/game/tilesets/male.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Load all required tilesets
    const tilesetPaths = {
      Office_walls_floors_32x32: "/game/tilesets/Office_walls_floors_32x32.png",
      Room_Builder_Office_32x32: "/game/tilesets/Room_Builder_Office_32x32.png",
      Modern_Office_Black_Shadow_32x32:
        "/game/tilesets/Modern_Office_Black_Shadow_32x32.png",
      Office_interiors_shadowless_32x32:
        "/game/tilesets/Office_interiors_shadowless_32x32.png",
      Modern_Office_Shadowless_32x32:
        "/game/tilesets/Modern_Office_Shadowless_32x32.png",
    };

    // Load each tileset
    Object.entries(tilesetPaths).forEach(([key, path]) => {
      this.load.image(key, path);
    });

    // Add loading error handler
    this.load.on("loaderror", (file: { key: string; src: string }) => {
      console.error(`Error loading asset: ${file.key} from ${file.src}`);
    });

    // Emit ready when all assets are loaded
    this.load.on('complete', () => {
      if (this.socket) {
        console.log('All assets loaded, emitting ready');
        this.socket.emit('ready');
      }
    });
  }

  init(data: { socket: Socket }) {
    this.socket = data.socket;
    // Set up all socket event listeners first
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.socket?.on('currentPlayers', (players: { id: string; x: number; y: number }[]) => {
      console.log("Received existing players:", players);
      players.forEach((player) => {
        if (player.id !== this.socket?.id) {
          console.log("Creating sprite for existing player:", player.id);
          this.otherPlayers[player.id] = this.physics.add.sprite(player.x, player.y, 'player', 0);
          this.otherPlayers[player.id].setFrame(130);
          this.otherPlayers[player.id].setDepth(player.y);
        }
      });
    });

    this.socket?.on('playerJoined', (id: string) => {
      if (id !== this.socket?.id) {
        console.log("new player joined:", id);
        if (!this.otherPlayers[id]) {
          this.otherPlayers[id] = this.physics.add.sprite((this.map?.width || 0) * (this.map?.tileWidth || 0) / 2, (this.map?.height || 0) * (this.map?.tileHeight || 0) / 2 || 0, 'player', 0);
          this.otherPlayers[id].setFrame(130);
          this.otherPlayers[id].setDepth(this.otherPlayers[id].y);
        }
      }
    });

    this.socket?.on('playerMoved', (data: { id: string; x: number; y: number; dirX: number; dirY: number; isRunning: boolean }) => {
      if (this.socket?.id !== data.id && this.otherPlayers[data.id]) {
        this.otherPlayers[data.id].setPosition(data.x, data.y);
        if (data.dirX < 0) {
          this.otherPlayers[data.id].setScale(1, 1);
          this.otherPlayers[data.id].anims.play(data.isRunning ? "runR&L" : "walkR&L", true);
        }
        else if (data.dirX > 0) {
          this.otherPlayers[data.id].setScale(-1, 1);
          this.otherPlayers[data.id].anims.play(data.isRunning ? "runR&L" : "walkR&L", true);
        }
        else if (data.dirY < 0) {
          this.otherPlayers[data.id].anims.play(data.isRunning ? "runU" : "walkU", true);
        }
        else if (data.dirY > 0) {
          this.otherPlayers[data.id].anims.play(data.isRunning ? "runD" : "walkD", true);
        } else {
          this.otherPlayers[data.id].anims.stop();
          this.otherPlayers[data.id].setFrame(130);
        }
      }
    });

    this.socket?.on('playerDisconnected', (playerId: string) => {
      if (this.otherPlayers[playerId]) {
        this.otherPlayers[playerId].destroy();
        delete this.otherPlayers[playerId];
      }
    });

    this.socket?.on('joinedRoom', (data: { roomId: string; players: { id: string; x: number; y: number }[] }) => {
      console.log(`Joined room: ${data.roomId} with players:`, data.players);
    });

    this.socket?.on('leftRoom', (data: { roomId: string }) => {
      console.log(`Left room: ${data.roomId}`);
    });
  }

  create() {
    const map = this.make.tilemap({ key: "map" });

    this.map = map;

    const mapWidth = map.width * map.tileWidth;
    const mapHeight = map.height * map.tileHeight;

    console.log(mapWidth, mapHeight);

    const tileset = [
      map.addTilesetImage(
        "Office_walls_floors_32x32",
        "Office_walls_floors_32x32"
      ),
      map.addTilesetImage(
        "Room_Builder_Office_32x32",
        "Room_Builder_Office_32x32"
      ),
      map.addTilesetImage(
        "Modern_Office_Black_Shadow_32x32",
        "Modern_Office_Black_Shadow_32x32"
      ),
      map.addTilesetImage(
        "Office_interiors_shadowless_32x32",
        "Office_interiors_shadowless_32x32"
      ),
      map.addTilesetImage(
        "Modern_Office_Shadowless_32x32",
        "Modern_Office_Shadowless_32x32"
      ),
    ];

    const layers: { [key: string]: Tilemaps.TilemapLayer } = {};

    map.layers.forEach((layer) => {
      if (layer.name === "TableObj") {
        layers[layer.name] = map.createLayer(
          layer.name,
          tileset.filter((t) => t !== null) as Tilemaps.Tileset[],
          mapWidth - 520,
          0
        ) as Tilemaps.TilemapLayer;
      } else if (layer.name === "BelowTab") {
        layers[layer.name] = map.createLayer(
          layer.name,
          tileset.filter((t) => t !== null) as Tilemaps.Tileset[],
          mapWidth - 500,
          mapHeight - 480
        ) as Tilemaps.TilemapLayer;
      } else {
        layers[layer.name] = map.createLayer(
          layer.name,
          tileset.filter((t) => t !== null) as Tilemaps.Tileset[],
          0,
          0
        ) as Tilemaps.TilemapLayer;
      }
    });

    // Load text objects
    const textObjects = map.getObjectLayer("Text")?.objects;

    textObjects?.forEach((obj) => {
      const text = this.add
        .text(obj.x || 0, obj.y || 0, obj.text.text, {
          fontSize: `${obj.text.pixelsize || 12}px`,
          fontFamily: "pixel-font",
          fontStyle: "bold",
          color: obj.text.color || "#000000",
          wordWrap: { width: obj.width || 200 },
        })
        .setOrigin(-0.5, 0);

      // Apply rotation if present
      if (obj.rotation) {
        text.setRotation(Phaser.Math.DegToRad(obj.rotation));
      }
    });

    this.player = this.physics.add.sprite(
      mapWidth / 2,
      mapHeight / 2,
      "player"
    );
    this.player.setFrame(117);

    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.4);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.setBounds(0, 0, mapWidth + 50, mapHeight);

    // Initialize cursor keys
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Create player animations
    this.createAnimations();

    //Collider
    if (layers["Borders"]) {
      this.physics.add.collider(this.player, layers["Borders"]);
    }

    // Set up depth sorting
    this.events.on('update', () => {
      // Update player depth
      if (this.player) {
        this.player.setDepth(this.player.y);
      }

      // Update other players depth
      Object.values(this.otherPlayers).forEach(player => {
        player.setDepth(player.y);
      });
    });
  }

  private createAnimations() {
    // Walking animations
    this.anims.create({
      key: "walkR&L",
      frames: this.anims.generateFrameNumbers("player", {
        start: 117,
        end: 125,
      }),
      frameRate: 13,
      repeat: -1,
    });

    this.anims.create({
      key: "walkU",
      frames: this.anims.generateFrameNumbers("player", {
        start: 105,
        end: 112,
      }),
      frameRate: 13,
      repeat: -1,
    });

    this.anims.create({
      key: "walkD",
      frames: this.anims.generateFrameNumbers("player", {
        start: 130,
        end: 138,
      }),
      frameRate: 13,
      repeat: -1,
    });

    // Running animations
    this.anims.create({
      key: "runR&L",
      frames: this.anims.generateFrameNumbers("player", {
        start: 507,
        end: 514,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "runU",
      frames: this.anims.generateFrameNumbers("player", {
        start: 494,
        end: 501,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "runD",
      frames: this.anims.generateFrameNumbers("player", {
        start: 520,
        end: 527,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  update() {
    const speed = this.running ? 150 : 100;

    let dirX = 0;
    let dirY = 0;

    if (this.cursors?.shift.isDown) {
      this.running = true;
    } else {
      this.running = false;
    }

    if (this.cursors?.left.isDown) {
      dirX = -1;
    } else if (this.cursors?.right.isDown) {
      dirX = 1;
    } else {
      dirX = 0;
    }

    if (this.cursors?.up.isDown) {
      dirY = -1;
    } else if (this.cursors?.down.isDown) {
      dirY = 1;
    } else {
      dirY = 0;
    }

    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    const normalizedDirX = magnitude === 0 ? 0 : dirX / magnitude;
    const normalizedDirY = magnitude === 0 ? 0 : dirY / magnitude;

    // apply velocity using the vector
    this.player?.setVelocity(normalizedDirX * speed, normalizedDirY * speed);

    // Update depth based on Y position
    if (this.player) {
      this.player.setDepth(this.player.y);
    }

    if (dirX < 0) {
      this.player?.setScale(1, 1);
      this.player?.anims.play(this.running ? "runR&L" : "walkR&L", true);
    } else if (dirX > 0) {
      this.player?.setScale(-1, 1);
      this.player?.anims.play(this.running ? "runR&L" : "walkR&L", true);
    } else if (dirY < 0) {
      this.player?.anims.play(this.running ? "runU" : "walkU", true);
    } else if (dirY > 0) {
      this.player?.anims.play(this.running ? "runD" : "walkD", true);
    } else {
      this.player?.anims.stop();
      this.player?.setFrame(130);
    }

    // Handle nearby players
    const nearbyPlayers: string[] = [];
    Object.keys(this.otherPlayers as { [key: string]: Phaser.Physics.Arcade.Sprite }).forEach((otherPlayer: string) => {
      if (this.player && this.otherPlayers[otherPlayer]) {
        // Update other players' depth
        this.otherPlayers[otherPlayer].setDepth(this.otherPlayers[otherPlayer].y);

        this.distBwUnP = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.otherPlayers[otherPlayer].x,
          this.otherPlayers[otherPlayer].y
        );

        if (this.distBwUnP < 20) {
          nearbyPlayers.push(otherPlayer);
        }
      }
    });

    if (nearbyPlayers.length > 0 && this.socket) {
      const roomId = [this.socket.id, ...nearbyPlayers].sort().join('-');
      this.socket.emit('joinRoom', {
        roomId,
        playerIds: [this.socket.id, ...nearbyPlayers]
      });
    } else if (this.socket) {
      const user2Element = document.getElementById('user-2');
      if (user2Element) {
        user2Element.style.display = 'none';
      }

      this.socket.emit('leaveRoom', {
        playerId: this.socket.id
      });
    }

    if (this.socket && this.player) {
      this.socket.emit('playerMove', { 
        id: this.socket.id, 
        x: this.player.x, 
        y: this.player.y, 
        dirX, 
        dirY,
        isRunning: this.running
      });
    }
  }
}

export default Lobby;
