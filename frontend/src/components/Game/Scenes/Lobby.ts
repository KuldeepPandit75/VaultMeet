import { Scene, Tilemaps } from "phaser";
import { Socket } from "socket.io-client";
import { PROXIMITY_RADIUS } from "@/data/game";
import useAuthStore from "@/Zustand_Store/AuthStore";

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
  private nearbyPlayers: string[] = [];
  private nextCheck: number = 0;
  private map?: Tilemaps.Tilemap;
  private playerNameText?: Phaser.GameObjects.Text;
  private otherPlayerNameTexts: { [key: string]: Phaser.GameObjects.Text } = {};
  private whiteboardArea: { x: number; y: number; width: number; height: number } = {
    x: 295,
    y: 149,
    width: 64, // 2 tiles * 32px
    height: 64  // 2 tiles * 32px
  };
  private isNearWhiteboard: boolean = false;
  private whiteboardPrompt?: Phaser.GameObjects.Text;
  private eventId?: string; // NEW: Event-specific identifier
  private computerArea: { x: number; y: number; width: number; height: number } | null = null;
  private isNearComputer: boolean = false;
  private computerPrompt?: Phaser.GameObjects.Text;
  private proximityCircle?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "Lobby" });
    this.running = false;
  }

  preload() {
    // Load the tilemap JSON
    this.load.tilemapTiledJSON("map", "/game/vaultmeetSpawnSpace.json");

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

    // Load each tileset as spritesheet for individual tile access
    Object.entries(tilesetPaths).forEach(([key, path]) => {
      this.load.spritesheet(key, path, {
        frameWidth: 32,
        frameHeight: 32,
      });
    });

    // Add loading error handler
    this.load.on("loaderror", (file: { key: string; src: string }) => {
      console.error(`Error loading asset: ${file.key} from ${file.src}`);
    });

    // Emit ready when all assets are loaded
    this.load.on("complete", () => {
      if (this.socket) {
        console.log("All assets loaded");
        // Don't emit ready immediately - wait for event space joining if needed
        if (!this.eventId) {
          console.log("Not in event space, emitting ready immediately");
          this.socket.emit("ready");
        } else {
          console.log("In event space, ready will be emitted after joining event space");
        }
      }
    });
  }

  init(data: { socket: Socket; userId?: string; eventId?: string }) {
    this.socket = data.socket;
    this.eventId = data.eventId; // NEW: Store eventId
    // Set up all socket event listeners first
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    // NEW: Handle event-specific space joining
    if (this.eventId && this.socket) {
      console.log(`Joining event space for event: ${this.eventId}`);
      this.socket.emit("joinEventSpace", {
        eventId: this.eventId,
        userId: useAuthStore.getState().user?._id
      });
    } else {
      console.log(`Not in event space, eventId: ${this.eventId}`);
    }

    // NEW: Handle event space joined event
    this.socket?.on("eventSpaceJoined", async (data: {
      eventId: string;
      roomId: string;
      existingPlayers: { id: string; x: number; y: number }[];
    }) => {
      console.log(`Joined event space for event ${data.eventId}`);
      console.log("Existing players in event:", data.existingPlayers);
      
      // Create sprites for existing players in this event
      for (const player of data.existingPlayers) {
        if (player.id !== this.socket?.id) {
          console.log(`Creating sprite for event player: ${player.id}`);
          this.createPlayerSprite(player.id, player.x, player.y);
        }
      }
      
      // Now emit ready to get any additional players that might have joined while we were loading
      console.log("Event space joined, now emitting ready");
      this.socket?.emit("ready");
    });

    // NEW: Handle new player joining event
    this.socket?.on("playerJoinedEvent", async (data: {
      eventId: string;
      playerId: string;
      userId: string;
    }) => {
      if (data.playerId !== this.socket?.id) {
        console.log(`New player joined event ${data.eventId}:`, data.playerId);
        console.log(`Creating sprite for new event player: ${data.playerId}`);
        this.createPlayerSprite(
          data.playerId,
          ((this.map?.width || 0) * (this.map?.tileWidth || 0)) / 2,
          ((this.map?.height || 0) * (this.map?.tileHeight || 0)) / 2
        );
      }
    });

    // NEW: Handle player leaving event
    this.socket?.on("playerLeftEvent", (data: {
      eventId: string;
      playerId: string;
    }) => {
      if (this.otherPlayers[data.playerId]) {
        this.otherPlayers[data.playerId].destroy();
        if (this.otherPlayerNameTexts[data.playerId]) {
          this.otherPlayerNameTexts[data.playerId].destroy();
          delete this.otherPlayerNameTexts[data.playerId];
        }
        delete this.otherPlayers[data.playerId];
      }
    });

    // MODIFIED: Only handle general space events if not in an event
    if (!this.eventId) {
      this.socket?.on(
        "currentPlayers",
        async (players: { id: string; x: number; y: number }[]) => {
          console.log("Received existing players in general space:", players);
          for (const player of players) {
            if (player.id !== this.socket?.id) {
              this.createPlayerSprite(player.id, player.x, player.y);
            }
          }
        }
      );

      this.socket?.on("playerJoined", async (id: string) => {
        if (id !== this.socket?.id) {
          console.log("new player joined general space:", id);
          this.createPlayerSprite(
            id,
            ((this.map?.width || 0) * (this.map?.tileWidth || 0)) / 2,
            ((this.map?.height || 0) * (this.map?.tileHeight || 0)) / 2
          );
        }
      });
    }

    // MODIFIED: Handle player movement for both general and event spaces
    this.socket?.on(
      "playerMoved",
      (data: {
        id: string;
        x: number;
        y: number;
        dirX: number;
        dirY: number;
        isRunning: boolean;
      }) => {
        // Only handle movement if we have a sprite for this player (meaning they're in our space)
        if (this.socket?.id !== data.id && this.otherPlayers[data.id]) {
          this.otherPlayers[data.id].setPosition(data.x, data.y);
          // Move the name text with the sprite
          if (this.otherPlayerNameTexts[data.id]) {
            this.otherPlayerNameTexts[data.id].setPosition(data.x, data.y + 40);
          }
          if (data.dirX < 0) {
            this.otherPlayers[data.id].setScale(0.9, 0.9);
            this.otherPlayers[data.id].setFlipX(false);
            this.otherPlayers[data.id].anims.play(
              data.isRunning ? "runR&L" : "walkR&L",
              true
            );
          } else if (data.dirX > 0) {
            this.otherPlayers[data.id].setScale(0.9, 0.9);
            this.otherPlayers[data.id].setFlipX(true);
            this.otherPlayers[data.id].anims.play(
              data.isRunning ? "runR&L" : "walkR&L",
              true
            );
          } else if (data.dirY < 0) {
            this.otherPlayers[data.id].anims.play(
              data.isRunning ? "runU" : "walkU",
              true
            );
          } else if (data.dirY > 0) {
            this.otherPlayers[data.id].anims.play(
              data.isRunning ? "runD" : "walkD",
              true
            );
          } else {
            this.otherPlayers[data.id].anims.play("idle", true);
          }
        }
      }
    );

    // MODIFIED: Handle player disconnection for both general and event spaces
    this.socket?.on("playerDisconnected", (playerId: string) => {
      if (this.otherPlayers[playerId]) {
        this.otherPlayers[playerId].destroy();
        if (this.otherPlayerNameTexts[playerId]) {
          this.otherPlayerNameTexts[playerId].destroy();
          delete this.otherPlayerNameTexts[playerId];
        }
        delete this.otherPlayers[playerId];
      }
    });

    this.socket?.on(
      "joinedRoom",
      (data: {
        roomId: string;
        players: { id: string; x: number; y: number }[];
      }) => {
        console.log(`Joined room: ${data.roomId} with players:`, data.players);
      }
    );

    this.socket?.on("leftRoom", (data: { roomId: string }) => {
      console.log(`Left room: ${data.roomId}`);
    });

    this.socket?.on("duplicateLogin", () => {
      alert(
        "You have been logged out because your account logged in from another device."
      );
      window.location.href = "/";
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

        // Set boundary layer opacity to 0 for collision detection without visual rendering
        if (layer.name === "Boundary") {
          layers[layer.name].setAlpha(0);
          // Set the boundary layer as collidable
          layers[layer.name].setCollisionByProperty({ collides: true });
        }
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

    // Whiteboard area is defined by the whiteboardArea property
    // No sprite loading needed - just detect proximity to the area

    // Computer area: parse from map object layer
    const computerObj = map.getObjectLayer("Computer")?.objects?.[0];
    if (computerObj) {
      this.computerArea = {
        x: computerObj.x ?? 0,
        y: computerObj.y ?? 0,
        width: computerObj.width ?? 32,
        height: computerObj.height ?? 32,
      };
    }

    this.player = this.physics.add.sprite(
      mapWidth / 2,
      mapHeight / 2,
      "player"
    );
    this.player.setScale(0.9);
    this.player.setFrame(117);

    // Add colliders for boundary and borders
    if (layers["Boundary"]) {
      this.physics.add.collider(this.player, layers["Boundary"]);
    }

    // Add player name text below the avatar
    const playerName = "You";
    this.playerNameText = this.add
      .text(this.player.x, this.player.y + 40, playerName, {
        fontSize: "10px",
        fontFamily: "pixel-font",
        color: "#222",
        backgroundColor: "#fff8",
        padding: { left: 4, right: 4, top: 1, bottom: 1 },
        align: "center",
      })
      .setOrigin(0.5, 0);
    this.playerNameText.setDepth(9999);

    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.6);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.setBounds(0, 0, mapWidth + 50, mapHeight);

    // Initialize cursor keys
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Add space key for whiteboard interaction
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey?.on('down', () => {
      if (this.isNearWhiteboard) {
        this.openWhiteboard();
      }
    });

    // Add C key for computer interaction
    const cKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    cKey?.on('down', () => {
      if (this.isNearComputer) {
        this.onComputerInteract();
      }
    });

    // Create player animations
    this.createAnimations();

    //Collider
    if (layers["Borders"]) {
      this.physics.add.collider(this.player, layers["Borders"]);
    }

    // Set up depth sorting
    this.events.on("update", () => {
      // Update player depth
      if (this.player) {
        this.player.setDepth(this.player.y);
      }

      // Update other players depth
      Object.values(this.otherPlayers).forEach((player) => {
        player.setDepth(player.y);
      });
    });

    // Create proximity circle
    this.createProximityCircle();

    // this.physics.world.createDebugGraphic();
    // layers["Boundary"].renderDebug(this.add.graphics(), {
    //   tileColor: null, // Color of non-colliding tiles
    //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200), // Color of colliding tiles
    //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });
  }

  // NEW: Helper method to create player sprites
  private async createPlayerSprite(playerId: string, x: number, y: number) {
    console.log(`Creating sprite for player ${playerId} at (${x}, ${y}). EventId: ${this.eventId}`);
    if (!this.otherPlayers[playerId]) {
      this.otherPlayers[playerId] = this.physics.add.sprite(x, y, "player", 0);
      this.otherPlayers[playerId].setScale(0.9);
      this.otherPlayers[playerId].setFrame(130);
      this.otherPlayers[playerId].setDepth(y);
      this.otherPlayers[playerId].setInteractive();

      // Fetch and display player name below avatar
      try {
        const user = await useAuthStore.getState().getUserBySocketId(playerId);
        const name = `${user.username}`
        this.otherPlayerNameTexts[playerId] = this.add
          .text(x, y + 40, name, {
            fontSize: "10px",
            fontFamily: "pixel-font",
            color: "#222",
            backgroundColor: "#fff8",
            padding: { left: 4, right: 4, top: 1, bottom: 1 },
            align: "center",
          })
          .setOrigin(0.5, 0);
        this.otherPlayerNameTexts[playerId].setDepth(9999);
      } catch {
        // fallback if fetch fails
        this.otherPlayerNameTexts[playerId] = this.add
          .text(x, y + 40, playerId, {
            fontSize: "10px",
            fontFamily: "pixel-font",
            color: "#222",
            backgroundColor: "#fff8",
            padding: { left: 4, right: 4, top: 1, bottom: 1 },
            align: "center",
          })
          .setOrigin(0.5, 0);
        this.otherPlayerNameTexts[playerId].setDepth(9999);
      }

      this.otherPlayers[playerId].on("pointerover", () => {
        if (this.nearbyPlayers.includes(playerId)) {
          this.otherPlayers[playerId].setTint(0xffff99);
          console.log("Hovering on players:", playerId);
        }
      });
      this.otherPlayers[playerId].on("pointerout", () => {
        this.otherPlayers[playerId].clearTint();
      });
      this.otherPlayers[playerId].on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (this.nearbyPlayers.includes(playerId)) {
          // Check if Ctrl key is pressed during click
          if (pointer.event.ctrlKey) {
            // Ctrl+click action - you can customize this action
            console.log(`Ctrl+clicked on player: ${playerId}`);
            this.handleCtrlClickOnPlayer(playerId);
          } else {
            // Regular click action
            useAuthStore.getState().setProfileBox(playerId);
          }
        }
      });
    }
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

    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("player", {
        start: 312,
        end: 313,
      }),
      frameRate: 4,
      repeat: -1,
    });
  }

  private openWhiteboard() {
    console.log("Opening whiteboard...");
    // Emit socket event to notify server about whiteboard interaction
    this.socket?.emit("whiteboardInteraction", {
      action: "open",
      playerId: this.socket.id
    });
    
    // Dispatch a custom event to notify the React component
    const whiteboardEvent = new CustomEvent('openWhiteboard', {
      detail: {
        playerId: this.socket?.id,
        action: 'open'
      }
    });
    window.dispatchEvent(whiteboardEvent);
  }

  private onComputerInteract() {
    console.log("Interacting with computer...");
    // Emit socket event or dispatch a custom event, similar to whiteboard
    this.socket?.emit("computerInteraction", {
      action: "open",
      playerId: this.socket.id
    });

    const computerEvent = new CustomEvent('openComputer', {
      detail: {
        playerId: this.socket?.id,
        action: 'open'
      }
    });
    window.dispatchEvent(computerEvent);
  }

  update(time: number) {
    const speed = this.running ? 250 : 200;

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
      this.player?.setScale(0.9, 0.9);
      this.player?.setFlipX(false);
      this.player?.anims.play(this.running ? "runR&L" : "walkR&L", true);
    } else if (dirX > 0) {
      this.player?.setScale(0.9, 0.9);
      this.player?.setFlipX(true);
      this.player?.anims.play(this.running ? "runR&L" : "walkR&L", true);
    } else if (dirY < 0) {
      this.player?.anims.play(this.running ? "runU" : "walkU", true);
    } else if (dirY > 0) {
      this.player?.anims.play(this.running ? "runD" : "walkD", true);
    } else {
      this.player?.anims.play("idle", true);
    }

    if (time >= this.nextCheck) {
      // Check for nearby players and update this.nearbyPlayers

      if (this.player && this.otherPlayers) {
        const playerX = this.player.x;
        const playerY = this.player.y;

        Object.entries(this.otherPlayers).forEach(([id, otherPlayer]) => {
          // Calculate distance between this.player and otherPlayer
          const dist = Phaser.Math.Distance.Between(
            playerX,
            playerY,
            otherPlayer.x,
            otherPlayer.y
          );
          if (dist <= PROXIMITY_RADIUS) {
            if (!this.nearbyPlayers.includes(id)) {
              this.nearbyPlayers.push(id);
            }
          } else {
            if (this.nearbyPlayers.includes(id)) {
              const index = this.nearbyPlayers.indexOf(id);
              if (index !== -1) {
                this.nearbyPlayers.splice(index, 1);
              }
              this.socket?.emit("gotAway", {
                otherId: id,
                nearbyPlayers: this.nearbyPlayers,
              });
            }
          }
        });
      }

      this.nextCheck = time + 300; // Check every 300ms (adjust as needed)
    }

    // Check whiteboard proximity
    if (this.player) {
      const playerX = this.player.x;
      const playerY = this.player.y;
      
      // Check if player is near the whiteboard area
      const WHITEBOARD_PROXIMITY_RADIUS = 50; // Adjust as needed
      const whiteboardCenterX = this.whiteboardArea.x + this.whiteboardArea.width / 2;
      const whiteboardCenterY = this.whiteboardArea.y + this.whiteboardArea.height / 2;
      
      const dist = Phaser.Math.Distance.Between(
        playerX,
        playerY,
        whiteboardCenterX,
        whiteboardCenterY
      );
      
      this.isNearWhiteboard = dist <= WHITEBOARD_PROXIMITY_RADIUS;

      // Show/hide interaction prompt
      if (this.isNearWhiteboard) {
        if (!this.whiteboardPrompt) {
          this.whiteboardPrompt = this.add.text(playerX, playerY - 60, "Press SPACE to use Whiteboard", {
            fontSize: "10px",
            fontFamily: "pixel-font",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { left: 8, right: 8, top: 4, bottom: 4 },
            align: "center",
          }).setOrigin(0.5, 0);
          this.whiteboardPrompt.setDepth(10000);
        }
        this.whiteboardPrompt.setPosition(playerX, playerY - 60);
        this.whiteboardPrompt.setVisible(true);
      } else if (this.whiteboardPrompt) {
        this.whiteboardPrompt.setVisible(false);
      }
    }

    // Check computer proximity
    if (this.player && this.computerArea) {
      const playerX = this.player.x;
      const playerY = this.player.y;

      const COMPUTER_PROXIMITY_RADIUS = 100; // Adjust as needed
      const computerCenterX = this.computerArea.x + this.computerArea.width / 2;
      const computerCenterY = this.computerArea.y + this.computerArea.height / 2;

      const dist = Phaser.Math.Distance.Between(
        playerX,
        playerY,
        computerCenterX,
        computerCenterY
      );

      this.isNearComputer = dist <= COMPUTER_PROXIMITY_RADIUS;

      // Show/hide interaction prompt
      if (this.isNearComputer) {
        if (!this.computerPrompt) {
          this.computerPrompt = this.add.text(playerX, playerY - 80, "Press C to use Computer", {
            fontSize: "10px",
            fontFamily: "pixel-font",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { left: 8, right: 8, top: 4, bottom: 4 },
            align: "center",
          }).setOrigin(0.5, 0);
          this.computerPrompt.setDepth(10000);
        }
        this.computerPrompt.setPosition(playerX, playerY - 80);
        this.computerPrompt.setVisible(true);
      } else if (this.computerPrompt) {
        this.computerPrompt.setVisible(false);
      }
    }

    if (this.socket && this.player) {
      this.socket.emit("playerMove", {
        id: this.socket.id,
        x: this.player.x,
        y: this.player.y,
        dirX,
        dirY,
        isRunning: this.running,
      });
    }

    // Move the player name text with the player
    if (this.player && this.playerNameText) {
      this.playerNameText.setPosition(this.player.x, this.player.y + 40);
    }

    // Update proximity circle position
    this.updateProximityCircle();
  }

  shutdown() {
    console.log('Shutting down Lobby scene...');
    
    // Clean up socket listeners
    if (this.socket) {
      this.socket.off("currentPlayers");
      this.socket.off("playerJoined");
      this.socket.off("playerJoinedEvent");
      this.socket.off("playerLeftEvent");
      this.socket.off("playerMoved");
      this.socket.off("eventSpaceJoined");
      this.socket.off("playerDisconnected");
    }

    // Clean up player sprites and text
    Object.values(this.otherPlayers).forEach(player => {
      if (player && player.destroy) {
        player.destroy();
      }
    });
    this.otherPlayers = {};

    Object.values(this.otherPlayerNameTexts).forEach(text => {
      if (text && text.destroy) {
        text.destroy();
      }
    });
    this.otherPlayerNameTexts = {};

    // Clean up main player and text
    if (this.player && this.player.destroy) {
      this.player.destroy();
    }
    if (this.playerNameText && this.playerNameText.destroy) {
      this.playerNameText.destroy();
    }

    // Clean up whiteboard prompt
    if (this.whiteboardPrompt && this.whiteboardPrompt.destroy) {
      this.whiteboardPrompt.destroy();
    }

    // Clean up computer prompt
    if (this.computerPrompt && this.computerPrompt.destroy) {
      this.computerPrompt.destroy();
    }

    // Clean up proximity circle
    if (this.proximityCircle && this.proximityCircle.destroy) {
      this.proximityCircle.destroy();
    }

    // Reset state
    this.nearbyPlayers = [];
    this.isNearWhiteboard = false;
    this.running = false;
    
    console.log('Lobby scene shutdown complete');
  }

  // Helper method to create proximity circle
  private createProximityCircle() {
    if (!this.player) return;
    
    this.proximityCircle = this.add.graphics();
    this.proximityCircle.setDepth(100); // Below player but above tiles
    
    // Draw the circle with a semi-transparent fill and border
    this.proximityCircle.lineStyle(2, 0x00ff00, 0.8); // Green border
    this.proximityCircle.fillStyle(0x00ff00, 0.1); // Light green fill
    this.proximityCircle.strokeCircle(this.player.x, this.player.y, PROXIMITY_RADIUS);
    this.proximityCircle.fillCircle(this.player.x, this.player.y, PROXIMITY_RADIUS);
  }

  // Helper method to update proximity circle position
  private updateProximityCircle() {
    if (this.proximityCircle && this.player) {
      this.proximityCircle.clear();
      this.proximityCircle.lineStyle(2, 0x00ff00, 0.8); // Green border
      this.proximityCircle.fillStyle(0x00ff00, 0.1); // Light green fill
      this.proximityCircle.strokeCircle(this.player.x, this.player.y, PROXIMITY_RADIUS);
      this.proximityCircle.fillCircle(this.player.x, this.player.y, PROXIMITY_RADIUS);
    }
  }

  // Handle Ctrl+click on player avatar
  private handleCtrlClickOnPlayer(playerId: string) {
    // You can customize this action based on your requirements
    // For example: open chat, send friend request, view detailed profile, etc.
    console.log(`Ctrl+click action triggered for player: ${playerId}`);
    
    // Example: Dispatch a custom event to notify React components
    const ctrlClickEvent = new CustomEvent('playerCtrlClick', {
      detail: {
        playerId: playerId,
        action: 'ctrlClick'
      }
    });
    window.dispatchEvent(ctrlClickEvent);
    
    // You can also emit a socket event if needed
    this.socket?.emit("startConversation", {
      targetSocketId: playerId,
    });
  }
}

export default Lobby;