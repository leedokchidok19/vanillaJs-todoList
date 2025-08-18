const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class TodoApp {
  constructor() {
    this.window = null;
    this.dataFile = path.join(__dirname, 'todoData.json');
  }

  createWindow() {
    this.window = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      icon: path.join(__dirname, 'assets', 'icon.ico') // 아이콘 경로 (선택사항)
    });

    this.window.loadFile('index.html');
    
    // 개발 중에만 DevTools 열기
    if (process.env.NODE_ENV === 'development') {
      this.window.webContents.openDevTools();
    }
  }

  async saveData(data) {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('데이터 저장 오류:', error);
      return { success: false, error: error.message };
    }
  }

  async loadData() {
    try {
      const exists = await fs.access(this.dataFile).then(() => true).catch(() => false);
      if (!exists) return { todo: [], done: [] };
      
      const rawData = await fs.readFile(this.dataFile, 'utf-8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      return { todo: [], done: [] };
    }
  }

  async exportData(data) {
    try {
      const result = await dialog.showSaveDialog(this.window, {
        title: 'Todo 데이터 내보내기',
        defaultPath: `todo-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON 파일', extensions: ['json'] },
          { name: '모든 파일', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true, path: result.filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('데이터 내보내기 오류:', error);
      return { success: false, error: error.message };
    }
  }

  async importData() {
    try {
      const result = await dialog.showOpenDialog(this.window, {
        title: 'Todo 데이터 가져오기',
        filters: [
          { name: 'JSON 파일', extensions: ['json'] },
          { name: '모든 파일', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths?.[0]) {
        const rawData = await fs.readFile(result.filePaths[0], 'utf-8');
        const importedData = JSON.parse(rawData);
        
        // 데이터 유효성 검사
        if (!importedData.todo || !importedData.done) {
          throw new Error('잘못된 데이터 형식입니다.');
        }

        await this.saveData(importedData);
        return { success: true, data: importedData };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      return { success: false, error: error.message };
    }
  }

  setupIpcHandlers() {
    ipcMain.handle('save-data', async (event, data) => {
      return await this.saveData(data);
    });

    ipcMain.handle('load-data', async () => {
      return await this.loadData();
    });

    ipcMain.handle('export-data', async (event, data) => {
      return await this.exportData(data);
    });

    ipcMain.handle('import-data', async () => {
      return await this.importData();
    });
  }

  init() {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupIpcHandlers();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }
}

const todoApp = new TodoApp();
todoApp.init();