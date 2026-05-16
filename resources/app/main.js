const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    title: "Social Hub",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  // Déguiser le navigateur en vrai Google Chrome pour éviter les boucles Captcha
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  session.defaultSession.setUserAgent(userAgent);
  
  // Intercept headers to completely bypass X-Frame-Options and CSP frame-ancestors
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    let headers = details.responseHeaders;
    if (headers) {
      if (headers['x-frame-options']) delete headers['x-frame-options'];
      if (headers['X-Frame-Options']) delete headers['X-Frame-Options'];
      
      const removeFrameAncestors = (str) => str.replace(/(?:^|\s)frame-ancestors[^;]+;?/gi, '');
      
      if (headers['content-security-policy']) {
         headers['content-security-policy'] = headers['content-security-policy'].map(removeFrameAncestors);
      }
      if (headers['Content-Security-Policy']) {
         headers['Content-Security-Policy'] = headers['Content-Security-Policy'].map(removeFrameAncestors);
      }
    }
    
    callback({ cancel: false, responseHeaders: headers });
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
