// Unfug – Desktop-Hülle (Electron). Lädt die Web-App lokal, ohne Browser-Leisten.
const {app,BrowserWindow,Menu,ipcMain,shell,nativeTheme}=require('electron');
const path=require('path'),fs=require('fs');

app.setName('Unfug');
app.setDesktopName('unfug.desktop');           // KDE/Wayland: richtiges Icon in der Taskleiste
const WEB=path.join(__dirname,'web');
let win=null,pendingFiles=[];

function filesFromArgv(argv){
  return argv.slice(1).filter(a=>!a.startsWith('-')&&/\.unfug$/i.test(a)&&fs.existsSync(a)).map(a=>path.resolve(a));
}
function sendFile(p){
  try{
    const data=fs.readFileSync(p);
    win.webContents.send('open-file',{name:path.basename(p),data:data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)});
  }catch(e){console.error(e)}
}

if(!app.requestSingleInstanceLock()){app.quit()}
else{
  app.on('second-instance',(_e,argv)=>{
    if(!win)return;
    if(win.isMinimized())win.restore();win.focus();
    filesFromArgv(argv).forEach(sendFile);
  });
  pendingFiles=filesFromArgv(process.argv);

  app.whenReady().then(()=>{
    Menu.setApplicationMenu(null);
    nativeTheme.themeSource='system';
    win=new BrowserWindow({
      width:1400,height:900,minWidth:480,minHeight:400,show:false,
      title:'Unfug',icon:path.join(WEB,'icon-512.png'),backgroundColor:'#ffffff',autoHideMenuBar:true,
      webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:false}
    });
    win.once('ready-to-show',()=>{win.maximize();win.show()});
    win.loadFile(path.join(WEB,'index.html'));
    ipcMain.on('renderer-ready',()=>{pendingFiles.forEach(sendFile);pendingFiles=[]});

    // F11 = Vollbild, Strg+Umschalt+I = Entwicklerwerkzeuge, Strg+Q = Beenden
    win.webContents.on('before-input-event',(e,i)=>{
      if(i.type!=='keyDown')return;
      if(i.key==='F11'){win.setFullScreen(!win.isFullScreen());e.preventDefault()}
      else if(i.control&&i.shift&&i.key.toLowerCase()==='i'){win.webContents.toggleDevTools();e.preventDefault()}
      else if(i.control&&i.key.toLowerCase()==='q'){app.quit();e.preventDefault()}
    });
    // Externe Links im normalen Browser öffnen, nie im App-Fenster
    win.webContents.setWindowOpenHandler(({url})=>{if(/^https?:/.test(url))shell.openExternal(url);return {action:'deny'}});
    win.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('file:')){e.preventDefault();if(/^https?:/.test(url))shell.openExternal(url)}});
    // Downloads (PNG / .unfug) zeigen den normalen KDE-Speichern-Dialog
    win.webContents.session.on('will-download',(_e,item)=>{
      const ext=path.extname(item.getFilename()).slice(1)||'*';
      item.setSaveDialogOptions({title:'Speichern',defaultPath:path.join(app.getPath(ext==='png'?'pictures':'documents'),item.getFilename()),
        filters:[{name:ext==='png'?'PNG-Bild':'Unfug-Projekt',extensions:[ext]}]});
    });
  });
  app.on('window-all-closed',()=>app.quit());
}
