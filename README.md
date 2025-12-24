# Slideshow Server

Electron app which allows you to select a folder on your pc. Once done, it hosts a webserver which delivers a front-end app which can show a slideshow of the images in that folder. The app can then be hidden to the tray. Since it self-hosts a webserver, the slideshow app can be accessed from any device's web browser on your network.

The web client allows for some customization such as custom interval times and a toggle-able timers.
The client is also capable of pausing, viewing previous images, and skipping, and supports keyboard and common remote control/media codes.
(Arrow keys and space for general controls or play/pause).

Useful for:

- Creating digital picture frames/art gallery without any cloud services
- Croquis/timed art practice

Usage:

1. Open the app
2. Press 'select folder' and navigate to a folder with images, confirm by pressing 'select folder' in the navigator.
3. Visit the address shown in the app on any device on your network.

Can also be ran without electron:

1. Pull the repository and `npm i`.
2. Create `config.json` in the `backend` folder.
3. Build frontend with `npm run build-frontend`.
4. Use `npm run backend` to start the server.
