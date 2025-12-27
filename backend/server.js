/**
 * Server.js
 * ---
 * Server for serving random images from the server's filesystem to the frontend.
 */

// express: server
const express = require('express');
const https = require('https');
const http = require('http');

// config file
const defaultConfig = require('./config.json');

// path and filesystem needed to access server images
const path = require('path');
const fs = require('fs');

// cors
const cors = require('cors');

// chokidar allows us to add/remove from image directory without resetting the server
const chokidar = require('chokidar');

const ip = require('ip')




// init server
const app = express();
const PORT = process.env.SLIDESHOW_PORT || defaultConfig.port || 3001;
const FRONTEND_BUILD_PATH = process.env.FRONTEND_BUILD_PATH || 
    path.join(__dirname, '../frontend/dist');

let config = {
    imageDirectory: process.env.IMAGE_FOLDER || defaultConfig.image_folder,
}

app.use(cors());
app.use(express.json());

const localIP = ip.address();



if (!fs.existsSync(config.imageDirectory)){
    console.log(`ERROR: ${config.imageDirectory} not found`)
    return process.exit()
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
        .on('add', filepath => {
            console.log(`File ${filepath} added`);
            updateImageList();
        })
        .on('unlink', filepath => {
            console.log(`File ${filepath} removed`);
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



app.use('/images', express.static(config.imageDirectory));

app.use(express.static(FRONTEND_BUILD_PATH))

// API Endpoint: get random image


app.get('/api/random-image', (req,res) => {
    if(imageList.length == 0){
        return res.status(404).json({error: "No Images Found"});
    }
    const imageIndex = Math.floor(Math.random() * imageList.length)
    const randomImage = imageList[imageIndex];
    res.json({ 
        image: randomImage, 
        index: imageIndex,
    })
})
app.get('/api/index/:index', (req, res) => {
    const index = req.params.index
    const image = imageList[req.params.index]
    res.json({
        image: image,
        index: Number(index)
    })
})



async function initialize(){
    console.log("Building list of images")
    await updateImageList();
    console.log("Watching for changes to image folder")
    watchDirectory()
    console.log('Finished Initilization\n');
}

initialize().catch(console.error).then(() => {
    // if config contains https info
    if(defaultConfig.key) {
        http.createServer((req, res) => {
            res.writeHead(301, {Location: `https://${req.headers.host}${req.url}`});
            res.end();
        }).listen(80, '0.0.0.0');

        https.createServer({
            key: fs.readFileSync(defaultConfig.key),
            cert: fs.readFileSync(defaultConfig.certificate)
        }, app).listen(PORT, '0.0.0.0', () => {
            console.log(`Slideshow server running on http://localhost:${PORT}`)
            console.log(`Accessible on your network at: http://${localIP}:${PORT}`);
        });
    } else {

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Slideshow server running on http://localhost:${PORT}`)
            console.log(`Accessible on your network at: http://${localIP}:${PORT}`);
        });
    }

})

