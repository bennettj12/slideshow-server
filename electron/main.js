const { app, BrowserWindow, dialog, ipcMain, Tray, Menu, shell } = require('electron');
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

let mainWindow;
let tray;
let backendProcess;
let config = {
    imageFolder: null,
    port: 3001
}

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 640,
        height: 480,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../icon.png'),
        show: false
    })

    mainWindow.loadFile('ui/index.html');

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    })

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    })
}


function createTray() {
    const iconPath = path.join(__dirname, '../icon.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Configuration',
            click: () => {
                mainWindow.show()
            }
        },
        {
            label: "Change Image Folder",
            click: () => {
                selectImageFolder();
            }
        },
        { type: 'separator'},
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                if(backendProcess){
                    backendProcess.kill()
                }
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Art Slideshow')
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        mainWindow.show();
    })

}


function startBackend() {
    if (backendProcess){
        backendProcess.kill()
    }

    if(!config.imageFolder){
        console.error("No image folder selected");
        return;
    }

    backendProcess = spawn('node', ['backend/server.js'], {
        env: {
            ...process.env,
            IMAGE_FOLDER: config.imageFolder,
            PORT: config.port
        },
        cwd: path.join(__dirname, '..')
    })


    // logging
    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    })

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`)
    })

    backendProcess.on('close', () => {
        console.log(`Backend process exited`)
    })
}

function showError(title, content){
    dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: title,
        content, content,
    })
}
function getStatus(){
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let addresses = [];
    for(const interface in interfaces) {
        for(const iface of interfaces[interface]){
            if(iface.family === 'IPv4' && !iface.internale) {
                addresses.push(iface.address);
            }
        }
    }
    const output = {
        localServer: `http://localhost:${config.port}`,
        networkServer: `http://${addresses[0]}:${config.port}`,
        webServer: `http://${addresses[2]}:${config.port}`
    }
    return JSON.stringify(output);
}

function selectImageFolder() {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select folder with Images'
    }).then(result => {
        if(!result.canceled && result.filePaths.length > 0) {
            // non empty
            const path = result.filePaths[0]

            fs.readdir(path, (err, files) => {
                if(err) {
                    showError("Error reading folder", err.message);
                    return;
                }   
            })

            config.imageFolder = path;
            //restart backend with new path.
            startBackend();

            mainWindow.webContents.send('folder-selected', path);



        }
    }).catch(err => {
        console.error(`error selecting folder:`, err);
    })
}

ipcMain.handle('select-folder', async () => {
    selectImageFolder();
})
ipcMain.handle('get-config', async () => {
    return config;
})
ipcMain.handle('get-status', async () => {
    return getStatus();
})

app.whenReady().then(() => {
    createTray();
    createWindow();
    startBackend();

    app.on('activate', () => {
        if(BrowserWindow.getAllWindows.length === 0) {
            createWindow();
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('before-quit', () => {
    app.isQuitting = true;
    if (backendProcess) {
        backendProcess.kill();
    }
})
