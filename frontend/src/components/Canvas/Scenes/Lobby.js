import Phaser from 'phaser'
import { getSocket } from '../../../features/socket.js';
import store from '../../../app/store.js'
import { setRecMsgRedux } from '../../../features/slice.js';

class Lobby extends Phaser.Scene {
    constructor() {
        super({ key: 'Lobby' });
        this.socket = null;
        this.otherPlayers = {};
    }

    preload() {
        this.load.tilemapTiledJSON('map', '/vaultmeetMap.json');
        this.load.spritesheet('player', 'meta/player.png', {
            frameWidth: 32,
            frameWidth: 32
        });
        this.load.image('grassMid', 'meta/Grass_1_Middle.png');
        this.load.image('grass', 'meta/Grass_Tiles_1.png');
        this.load.image('bigTree', 'meta/Big_Fruit_Tree.png');
        this.load.image('medTree', 'meta/Medium_Fruit_Tree.png');
        this.load.image('oakTree', 'meta/Oak_Tree.png');
        this.load.image('bridge', 'meta/Bridge_Stone_Horizontal.png');
        this.load.image('collider', 'meta/Collider.png');
        this.load.image('flowers', 'meta/Flowers.png');
        this.load.image('house', 'meta/House_2_1.png');
        this.load.image('cliff', 'meta/Stone_Cliff_1_Tile.png');
        this.load.image('water', 'meta/Water_Tile_1.png');
        this.load.image('waterfall', 'meta/Waterfall_1.png');
        this.load.image('well', 'meta/Well.png');
    }

    initializeSocket = () => {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = getSocket();

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        this.socket.on('currentPlayers', (players) => {
            console.log("Received existing players:", players);
            players.forEach(player => {
                if (player.id !== this.socket.id && !this.otherPlayers[player.id]) {
                    this.otherPlayers[player.id] = this.physics.add.sprite(player.x, player.y, 'player', 0);
                }
            });
        });

        this.socket.on('playerJoined', (id) => {
            if (id !== this.socket.id) {
                console.log("new player joined:", id);
                if (!this.otherPlayers[id]) {
                    this.otherPlayers[id] = this.physics.add.sprite(300, 300, 'player', 0);
                }
            }
        });

        this.socket.on('playerMoved', (data) => {
            if (this.socket.id !== data.id && this.otherPlayers[data.id]) {
                this.otherPlayers[data.id].setPosition(data.x, data.y);
            }
        });

        this.socket.on('playerDisconnected', (playerId) => {
            if (this.otherPlayers[playerId]) {
                this.otherPlayers[playerId].destroy();
                delete this.otherPlayers[playerId];
            }
        });

        this.socket.on('joinedRoom', (roomId) => {
            console.log(`Joined room: ${roomId}`);
        });

        this.socket.on('leftRoom', (roomId) => {
            console.log(`Left room: ${roomId}`);
        });

        this.socket.on('receiveMessage',(data)=>{
            store.dispatch(setRecMsgRedux({ message: data.message, senderId: data.senderId, timestamp: Date.now()  }));
        })
    }

    create() {

        this.initializeSocket();

        const map = this.make.tilemap({ key: 'map' })

        const tileset = [
            map.addTilesetImage('Water_Tile_1', 'water'),
            map.addTilesetImage('Grass_Tiles_1', 'grass'),
            map.addTilesetImage('Grass_1_Middle', 'grassMid'),
            map.addTilesetImage('Waterfall_1', 'waterfall'),
            map.addTilesetImage('Stone_Cliff_1_Tile', 'cliff'),
            map.addTilesetImage('Bridge_Stone_Horizontal', 'bridge'),
            map.addTilesetImage('Big_Fruit_Tree', 'bigTree'),
            map.addTilesetImage('Medium_Fruit_Tree', 'medTree'),
            map.addTilesetImage('Oak_Tree', 'oakTree'),
            map.addTilesetImage('House_2_1', 'house'),
            map.addTilesetImage('Flowers', 'flowers'),
            map.addTilesetImage('Well', 'well'),
            map.addTilesetImage('Collider (1)', 'collider'),
        ]

        const layers = {};
        map.layers.forEach((layer) => {
            if (layer.name === 'Collider') {
                layers[layer.name] = map.createLayer(layer.name, tileset, 16, 0);
                layers[layer.name].setCollisionByExclusion([-1]);
                layers[layer.name].setAlpha(0); 
            } else {

                layers[layer.name] = map.createLayer(layer.name, tileset, 0, 0);
            }
        });

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;

        this.player = this.physics.add.sprite(mapWidth / 3.5, mapHeight / 2, 'player', 0);
        this.player.setOrigin(0.5, 0.5);
        this.player.setCollideWorldBounds(true);

        if (layers['Collider']) {
            this.physics.add.collider(this.player, layers['Collider']);
        }

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(2.5);

        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

        // setting up movement
        this.cursors = this.input.keyboard.createCursorKeys();

        // creating animations

        this.anims.create({
            key: 'walkR&L',
            frames: this.anims.generateFrameNumbers('player', { start: 32, end: 37 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'walkU',
            frames: this.anims.generateFrameNumbers('player', { start: 40, end: 45 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'walkD',
            frames: this.anims.generateFrameNumbers('player', { start: 24, end: 29 }),
            frameRate: 20,
            repeat: -1
        });

    }

    update() {
        const speed = 150;

        let dirX = 0;
        let dirY = 0;

        if (this.cursors.left.isDown) {
            dirX = -1;
        } else if (this.cursors.right.isDown) {
            dirX = 1;
        }

        if (this.cursors.up.isDown) {
            dirY = -1;
        } else if (this.cursors.down.isDown) {
            dirY = 1;
        }

        const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedDirX = magnitude === 0 ? 0 : dirX / magnitude;
        const normalizedDirY = magnitude === 0 ? 0 : dirY / magnitude;

        // apply velocity using the vector
        this.player.setVelocity(normalizedDirX * speed, normalizedDirY * speed);

        if (dirX < 0) {
            this.player.setScale(-1, 1);
            this.player.anims.play("walkR&L", true);
        } else if (dirX > 0) {
            this.player.setScale(1, 1);
            this.player.anims.play("walkR&L", true);
        } else if (dirY < 0) {
            this.player.anims.play("walkU", true);
        } else if (dirY > 0) {
            this.player.anims.play("walkD", true);
        } else {
            this.player.anims.stop();
        }

        const nearbyPlayers = [];
        Object.keys(this.otherPlayers).forEach(otherPlayer => {
            this.distBwUnP = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                this.otherPlayers[otherPlayer].x,
                this.otherPlayers[otherPlayer].y
            );

            if (this.distBwUnP < 20) {
                nearbyPlayers.push(otherPlayer);
            }
        });

        if (nearbyPlayers.length > 0) {
            const roomId = [this.socket.id, ...nearbyPlayers].sort().join('-');
            this.socket.emit('joinRoom', { 
                roomId, 
                playerIds: [this.socket.id, ...nearbyPlayers]
            });
        } else {
            this.socket.emit('leaveRoom', { 
                playerId: this.socket.id 
            });
        }

        this.socket.emit('playerMove', { id: this.socket.id, x: this.player.x, y: this.player.y });
    }
}

export default Lobby
