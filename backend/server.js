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

// cors
const cors = require('cors');

// for getting the server's IP
const { networkInterfaces } = require('os');

// chokidar allows us to add/remove from image directory without reseting the server?
const chokidar = require('chokidar');

// init server
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const nets = networkInterfaces();
const localIP = nets['Wi-Fi'][1]['address'];

const results = Object.create(null);

// Storing interval on backend maybe is not needed. If we want to use a simple image retrieval API we could handle 
// timing and intervals on the frontend side...
let config = {
    imageDirectory: path.join(__dirname, 'sample-images'),
    interval: 60000 // Default 60 seconds.
}

if (!fs.existsSync(config.imageDirectory)){
    console.log(`ERROR: ${config.imageDirectory} not found`)
    process.exit()
}

let imageList = [];
let watcher = null;

async function updateImageList() {
    try {
        imageList = await getImageFilesRecursive(config.imageDirectory);
        console.log(`Image list updated, containing ${imageList.length} images`)
    } catch (err) {
        console.error("Error updating image list ",err);
    }
}

function watchDirectory() {
    if (watcher) {
        watcher.close()
    }
    watcher = chokidar.watch(config.imageDirectory, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
    });
    watcher
        .on('add', path => {
            console.log(`File ${path} added`);
            updateImageList();
        })
        .on('unlink', path => {
            console.log(`File ${path} removed`);
            updateImageList()
        })
}


async function getImageFilesRecursive(dir) {
    const extensions  = ['.jpg', '.png', '.jpeg', '.gif', '.bmp', '.webp'];
    let results = [];

    try {
        const items = await fs.promises.readdir(dir, {withFileTypes: true});

        for (const item of items){
            const fullPath = path.join(dir, item.name);

            if(item.isDirectory()) {
                const subResults = await getImageFilesRecursive(fullPath);
                results = results.concat(subResults);
            } else if (item.isFile()){
                const ext = path.extname(item.name).toLowerCase();
                if (extensions.includes(ext)){
                    const relativePath = path.relative(config.imageDirectory, fullPath);
                    results.push(relativePath);
                }
            }
        }

    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }

    return results;
}


// API Endpoint: get random image

app.get('/api/random-image', (req,res) => {
    if(imageList.length == 0){
        return res.status(404).json({error: "No Images Found"});
    }
    const randomImage = imageList[Math.floor(Math.random() * imageList.length)];
    res.json({ image: randomImage })
})

app.use('/images', express.static(config.imageDirectory));



async function initialize(){
    console.log("Building list of images")
    await updateImageList();
    console.log("Watching for changes to image folder")
    watchDirectory()
    console.log('Finished Initilization\n');
}

initialize().catch(console.error).then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Slideshow server running on http://localhost:${PORT}`)
        console.log(`Accessible on your network at: http://${localIP}:${PORT}`);
    })
})

