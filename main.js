const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // 개발 모드에서만 DevTools
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// 데이터 파일 경로 결정
function getDataFilePath() {
if (process.defaultApp) {
    // 개발 모드: npm start 로 실행할 때
    return path.join(__dirname, 'todoData.json');
  } else {
    // 패키징된 exe 로 실행할 때
    return path.join(path.dirname(process.execPath), 'todoData.json');
  }
}

const dataFilePath = getDataFilePath();

// 데이터 저장
function saveData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('데이터 저장 성공:', dataFilePath);
    return { success: true };
  } catch (error) {
    console.error('데이터 저장 실패:', error);
    // 권한 문제로 실패하면 사용자 데이터 폴더에 저장 시도
    try {
      const fallbackPath = path.join(app.getPath('userData'), 'todoData.json');
      fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('대체 경로에 저장 성공:', fallbackPath);
      return { success: true, fallbackPath };
    } catch (fallbackError) {
      console.error('대체 경로 저장도 실패:', fallbackError);
      return { success: false, error: error.message };
    }
  }
}

// 데이터 로드
function loadData() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      console.log('데이터 파일이 없어서 기본값 반환');
      // 파일이 없으면 기본 데이터 생성
      const defaultData = { todo: [], done: [] };
      saveData(defaultData);
      return defaultData;
    }
    
    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    console.log('데이터 로드 성공:', dataFilePath);
    return JSON.parse(rawData);
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    return { todo: [], done: [] };
  }
}

// Export
async function exportData(data) {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Todo 데이터 내보내기',
      defaultPath: `todo-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON 파일', extensions: ['json'] },
        { name: '모든 파일', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error('Export 실패:', error);
    return { success: false, error: error.message };
  }
}

// Import
async function importData() {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Todo 데이터 가져오기',
      filters: [
        { name: 'JSON 파일', extensions: ['json'] },
        { name: '모든 파일', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths?.[0]) {
      const rawData = fs.readFileSync(result.filePaths[0], 'utf-8');
      const importedData = JSON.parse(rawData);
      
      // 데이터 유효성 검사
      if (!importedData.todo || !importedData.done) {
        throw new Error('잘못된 데이터 형식입니다.');
      }

      // 가져온 데이터를 저장
      const saveResult = saveData(importedData);
      if (saveResult.success) {
        return { success: true, data: importedData };
      } else {
        return { success: false, error: saveResult.error };
      }
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error('Import 실패:', error);
    return { success: false, error: error.message };
  }
}

// IPC 핸들러 설정
ipcMain.handle('save-data', (event, data) => {
  return saveData(data);
});

ipcMain.handle('load-data', () => {
  return loadData();
});

ipcMain.handle('export-data', (event, data) => {
  return exportData(data);
});

ipcMain.handle('import-data', () => {
  return importData();
});

// 앱 초기화
app.whenReady().then(() => {
  createWindow();
  
  // 데이터 파일 경로 출력 (디버깅용)
  console.log('앱 시작 - 데이터 파일 경로:', dataFilePath);
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});