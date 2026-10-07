const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('unfugNative',{
  platform:'linux',
  onOpenFile(cb){ipcRenderer.on('open-file',(_e,f)=>cb(f));ipcRenderer.send('renderer-ready')}
});
