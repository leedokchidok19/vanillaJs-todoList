const { ipcRenderer } = require('electron');

const todoList = document.getElementById("todo_list");
const doneList = document.getElementById("done_list");
const btnRegister = document.querySelector(".btn_register");
const btnMoveDone = document.getElementById("btn_done");
const btnMoveTodo = document.getElementById("btn_todo");
const btnExport = document.querySelector(".btn_export");
const btnImport = document.querySelector(".btn_import");

let editingLi = null;

function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  document.getElementById("todo_date").value = `${yyyy}-${mm}-${dd}`;
}

function createTodoItem(date, txt, order) {
  const li = document.createElement("li");
  li.dataset.order = order;
  li.innerHTML = `
    <input type="checkbox" id="todo${order}">
    <div class="todo_info">
      <label for="todo${order}">
        <span>${date}</span>
        <p>${txt}</p>
      </label>
    </div>
    <div class="todo_actions">
      <button class="btn btn_edit">✏️</button>
      <button class="btn btn_delete">🗑️</button>
    </div>
  `;
  return li;
}

function extractDataFromList(list) {
  return Array.from(list.querySelectorAll("li")).map((li) => ({
    order: parseInt(li.dataset.order),
    date: li.querySelector("span").textContent,
    text: li.querySelector("p").textContent,
  }));
}

async function persist() {
  const data = {
    todo: extractDataFromList(todoList),
    done: extractDataFromList(doneList),
  };
  
  try {
    const result = await ipcRenderer.invoke('save-data', data);
    if (!result.success) {
      console.error('데이터 저장 실패:', result.error);
    }
  } catch (error) {
    console.error('데이터 저장 오류:', error);
  }
}

async function handleRegisterOrUpdate() {
  const date = document.getElementById("todo_date").value;
  const txt = document.getElementById("todo_txt").value.trim();
  if (!date || !txt) return alert("내용을 입력하세요.");

  if (editingLi) {
    editingLi.querySelector("span").textContent = date;
    editingLi.querySelector("p").textContent = txt;
    editingLi = null;
    btnRegister.textContent = "등록";
    btnRegister.classList.remove('editing');
  } else {
    const order = Date.now(); // 고유한 ID 사용
    const li = createTodoItem(date, txt, order);
    todoList.appendChild(li);
  }

  document.getElementById("todo_txt").value = "";
  await persist();
}

async function moveToDone() {
  const checkedItems = document.querySelectorAll('#todo_list li input[type="checkbox"]:checked');
  checkedItems.forEach((cb) => {
    const li = cb.closest("li");
    const clone = li.cloneNode(true);
    const doneCb = clone.querySelector("input[type=checkbox]");
    doneCb.checked = true;
    doneCb.disabled = true;
    // 완료 목록에서는 수정/삭제 버튼 숨기기
    clone.querySelector('.todo_actions').style.display = 'none';
    doneList.appendChild(clone);
    li.remove();
  });
  await persist();
}

async function moveToTodo() {
  const checkedItems = document.querySelectorAll('#done_list li input[type="checkbox"]:checked');
  checkedItems.forEach((cb) => {
    const li = cb.closest("li");
    const clone = li.cloneNode(true);
    const todoCb = clone.querySelector("input[type=checkbox]");
    todoCb.checked = false;
    todoCb.disabled = false;
    // 작업 목록에서는 수정/삭제 버튼 다시 보이기
    clone.querySelector('.todo_actions').style.display = 'flex';
    todoList.appendChild(clone);
    li.remove();
  });
  await persist();
}

async function exportData() {
  try {
    const data = {
      todo: extractDataFromList(todoList),
      done: extractDataFromList(doneList),
    };
    
    const result = await ipcRenderer.invoke('export-data', data);
    
    if (result.success && !result.canceled) {
      alert(`데이터가 성공적으로 내보내졌습니다.\n경로: ${result.path}`);
    } else if (result.error) {
      alert(`내보내기 실패: ${result.error}`);
    }
  } catch (error) {
    console.error('Export 오류:', error);
    alert('데이터 내보내기 중 오류가 발생했습니다.');
  }
}

async function importData() {
  try {
    const result = await ipcRenderer.invoke('import-data');

    if (result.success && result.data) {
      // 기존 목록 초기화
      todoList.innerHTML = '';
      doneList.innerHTML = '';

      // 새 데이터로 목록 생성
      result.data.todo.forEach((item) => {
        todoList.appendChild(createTodoItem(item.date, item.text, item.order));
      });

      result.data.done.forEach((item) => {
        const li = createTodoItem(item.date, item.text, item.order);
        const checkbox = li.querySelector("input");
        checkbox.checked = true;
        checkbox.disabled = true;
        li.querySelector('.todo_actions').style.display = 'none';
        doneList.appendChild(li);
      });

      alert('데이터가 성공적으로 가져와졌습니다.');
    } else if (result.error) {
      alert(`가져오기 실패: ${result.error}`);
    }
  } catch (error) {
    console.error('Import 오류:', error);
    alert('데이터 가져오기 중 오류가 발생했습니다.');
  }
}

// 이벤트 리스너
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn_edit")) {
    const li = e.target.closest("li");
    const date = li.querySelector("span").textContent;
    const txt = li.querySelector("p").textContent;
    document.getElementById("todo_date").value = date;
    document.getElementById("todo_txt").value = txt;
    editingLi = li;
    btnRegister.textContent = "수정 완료";
    btnRegister.classList.add('editing');
    document.getElementById("todo_txt").focus();
  }

  if (e.target.classList.contains("btn_delete")) {
    if (confirm('정말 삭제하시겠습니까?')) {
      const li = e.target.closest("li");
      li.remove();
      await persist();
    }
  }
});

// 키보드 단축키
document.getElementById("todo_txt").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleRegisterOrUpdate();
  }
  
  if (e.key === "Escape" && editingLi) {
    editingLi = null;
    btnRegister.textContent = "등록";
    btnRegister.classList.remove('editing');
    document.getElementById("todo_txt").value = "";
  }
});

// 버튼 이벤트
btnRegister.addEventListener("click", handleRegisterOrUpdate);
btnMoveDone.addEventListener("click", moveToDone);
btnMoveTodo.addEventListener("click", moveToTodo);
btnExport.addEventListener("click", exportData);
btnImport.addEventListener("click", importData);

// 초기화
async function init() {
  setTodayDate();
  
  try {
    const data = await ipcRenderer.invoke('load-data');
    
    data.todo.forEach((item) => {
      todoList.appendChild(createTodoItem(item.date, item.text, item.order));
    });
    
    data.done.forEach((item) => {
      const li = createTodoItem(item.date, item.text, item.order);
      const checkbox = li.querySelector("input");
      checkbox.checked = true;
      checkbox.disabled = true;
      li.querySelector('.todo_actions').style.display = 'none';
      doneList.appendChild(li);
    });
  } catch (error) {
    console.error('초기 데이터 로드 실패:', error);
  }
}

init();