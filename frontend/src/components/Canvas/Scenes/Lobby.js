import Phaser from 'phaser'
import io from 'socket.io-client'

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

    initializeSocket() {
        if (this.socket) {
            // Clean up existing socket if it exists
            this.socket.disconnect();
        }

        this.socket = io('http://localhost:2020', {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        // Handle connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        // Handle list of current players when joining
        this.socket.on('currentPlayers', (players) => {
            console.log("Received existing players:", players);
            players.forEach(player => {
                if (player.id !== this.socket.id && !this.otherPlayers[player.id]) {
                    this.otherPlayers[player.id] = this.physics.add.sprite(player.x, player.y, 'player', 0);
                }
            });
        });

        // Handle new player connections
        this.socket.on('playerJoined', (id) => {
            if (id !== this.socket.id) {
                console.log("new player joined:", id);
                if (!this.otherPlayers[id]) {
                    this.otherPlayers[id] = this.physics.add.sprite(300, 300, 'player', 0);
                }
            }
        });

        // Handle player movements
        this.socket.on('playerMoved', (data) => {
            if (this.socket.id !== data.id && this.otherPlayers[data.id]) {
                this.otherPlayers[data.id].setPosition(data.x, data.y);
            }
        });

        // Handle player disconnections
        this.socket.on('playerDisconnected', (playerId) => {
            if (this.otherPlayers[playerId]) {
                this.otherPlayers[playerId].destroy();
                delete this.otherPlayers[playerId];
            }
        });
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

        // Add all layers
        const layers = {};
        map.layers.forEach((layer) => {
            if (layer.name === 'Collider') {
                layers[layer.name] = map.createLayer(layer.name, tileset, 16, 0);
                layers[layer.name].setCollisionByExclusion([-1]);
                layers[layer.name].setAlpha(0); // Make the collider invisible
            } else {

                layers[layer.name] = map.createLayer(layer.name, tileset, 0, 0);
            }
        });

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;

        this.player = this.physics.add.sprite(mapWidth / 3.5, mapHeight / 2, 'player', 0);
        this.player.setOrigin(0.5, 0.5);
        this.player.setCollideWorldBounds(true);

        // Add collision between player and collider layer after player is created
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

        // create and normalize the direction vector

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

        Object.values(this.otherPlayers).forEach(otherPlayer=>{

            this.distBwUnP = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                otherPlayer.x,
                otherPlayer.y
            )

            if(this.distBwUnP<20){
                
            }
        })



        this.socket.emit('playerMove', { id: this.socket.id, x: this.player.x, y: this.player.y });


    }

    shutdown() {
        // Clean up socket connection
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        // Clean up other players
        Object.values(this.otherPlayers).forEach(player => {
            player.destroy();
        });
        this.otherPlayers = {};

        // Clean up the player
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
    }
}

export default Lobby