/**
 * Server.js
 * ---
 * Our API/server for serving random images from the server's filesystem to the frontend.
 */

// express: server
const express = require('express');

// path and filesystem needed to access server images
const path = require('path');
const fs = require('fs');

// cors needed?
const cors = require('cors');

// chokidar allows us to add/remove from image directory without reseting the server?
const chokidar = require('chokidar');

// init server
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


// Storing interval on backend maybe is not needed. If we want to use a simple image retrieval API we could handle 
// timing and intervals on the frontend side...
let config = {
    imageDirectory: path.join(__dirname, 'sample-images'),
    interval: 60000 // Default 60 seconds.
}

let imageList = [];
let watcher = null;

function updateImageList() {
    //fs.readdir()
}

console.log(config.imageDirectory)