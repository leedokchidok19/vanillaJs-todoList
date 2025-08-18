# Todo App - EXE 빌드 가이드

## 🚀 프로젝트 설정

### 1. 프로젝트 폴더 생성 및 이동
```bash
# 새 폴더 생성
mkdir todo-app
cd todo-app

# 또는 기존 폴더가 있다면
cd C:\pathToYour\todo-app
```

### 2. 파일들 복사
위에 제공된 파일들을 프로젝트 폴더에 저장:
- `main.js`
- `app.js` 
- `index.html`
- `style.css`
- `package.json`

### 3. 의존성 설치
```bash
npm install
```

### 2. 개발 모드 실행
```bash
npm start
# 또는
npm run dev  # DevTools 포함
```

## 📦 EXE 파일 빌드 및 배포

### 방법 1: 인스톤러 생성 (권장)
```bash
npm run build-win
```
결과: `dist/todo-app Setup 1.0.0.exe` → **이 파일 하나만 공유하면 됨**

### 방법 2: 포터블 버전
```bash
npm run pack
```
결과: `dist/todo-app-win32-x64/` 폴더 → **전체 폴더를 ZIP으로 압축해서 공유**

## 🎯 배포 방법 비교

| 방법 | 공유할 파일 | 장점 | 단점 |
|------|-------------|------|------|
| **인스톨러** | `Setup.exe` 하나 | 간편한 설치, 바탕화면 바로가기 | 설치 과정 필요 |
| **포터블** | 폴더 전체 압축 | 설치 불필요, 즉시 실행 | 파일 크기 큼 |

### 인스톨러 버전 만들기 (권장)
```bash
# 깔끔한 빌드
npm run clean
npm run build-win
```

생성된 `dist/todo-app Setup 1.0.0.exe` 파일 하나만 공유하면 됩니다!

## 📁 프로젝트 구조
```
todo-app/
├── main.js           # Electron 메인 프로세스
├── app.js            # 렌더러 프로세스 (UI 로직)
├── index.html        # UI 구조
├── style.css         # 스타일링
├── package.json      # 프로젝트 설정
├── todoData.json     # 자동 생성되는 데이터 파일
└── dist/             # 빌드 결과물
```

## 🔧 주요 개선사항

### 버그 수정
- ✅ IPC 통신을 Promise 기반 `invoke/handle`로 변경
- ✅ 데이터 저장/로드 시 에러 처리 추가
- ✅ 파일 경로 및 인코딩 문제 해결
- ✅ 메모리 누수 방지를 위한 이벤트 리스너 정리

### 기능 향상
- ✅ ES6+ 문법으로 리팩토링 (Class, async/await, 화살표 함수)
- ✅ 모듈화된 코드 구조
- ✅ 키보드 단축키 지원 (Enter, ESC)
- ✅ 사용자 경험 개선 (