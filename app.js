const { ipcRenderer } = require('electron');

class TodoManager {
  constructor() {
    this.editingLi = null;
    this.todoList = document.getElementById('todo_list');
    this.doneList = document.getElementById('done_list');
    this.todoDate = document.getElementById('todo_date');
    this.todoText = document.getElementById('todo_txt');
    this.registerBtn = document.querySelector('.btn_register');
    
    this.init();
  }

  init() {
    this.setTodayDate();
    this.bindEvents();
    this.loadData();
  }

  setTodayDate() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    this.todoDate.value = dateString;
  }

  createTodoItem(date, text, id) {
    const li = document.createElement('li');
    li.dataset.id = id;
    li.innerHTML = `
      <input type="checkbox" id="todo${id}">
      <div class="todo_info">
        <label for="todo${id}">
          <span class="date">${date}</span>
          <p class="text">${text}</p>
        </label>
      </div>
      <div class="todo_actions">
        <button class="btn btn_edit" title="수정">✏️</button>
        <button class="btn btn_delete" title="삭제">🗑️</button>
      </div>
    `;
    return li;
  }

  async handleRegisterOrUpdate() {
    const date = this.todoDate.value;
    const text = this.todoText.value.trim();
    
    if (!date || !text) {
      alert("날짜와 내용을 모두 입력해주세요.");
      return;
    }

    if (this.editingLi) {
      this.updateExistingItem(this.editingLi, date, text);
      this.resetEditMode();
    } else {
      this.addNewItem(date, text);
    }

    this.todoText.value = '';
    await this.saveData();
  }

  updateExistingItem(li, date, text) {
    li.querySelector('.date').textContent = date;
    li.querySelector('.text').textContent = text;
  }

  addNewItem(date, text) {
    const id = Date.now().toString();
    const li = this.createTodoItem(date, text, id);
    this.todoList.appendChild(li);
  }

  resetEditMode() {
    this.editingLi = null;
    this.registerBtn.textContent = "등록";
    this.registerBtn.classList.remove('editing');
  }

  async moveToDone() {
    const checkedItems = this.todoList.querySelectorAll('input:checked');
    
    checkedItems.forEach(checkbox => {
      const li = checkbox.closest('li');
      const clone = li.cloneNode(true);
      const cloneCheckbox = clone.querySelector('input');
      
      cloneCheckbox.checked = true;
      cloneCheckbox.disabled = true;
      
      // 수정/삭제 버튼 제거
      clone.querySelector('.todo_actions').style.display = 'none';
      
      this.doneList.appendChild(clone);
      li.remove();
    });

    await this.saveData();
  }

  async moveToTodo() {
    const checkedItems = this.doneList.querySelectorAll('input:checked');
    
    checkedItems.forEach(checkbox => {
      const li = checkbox.closest('li');
      const clone = li.cloneNode(true);
      const cloneCheckbox = clone.querySelector('input');
      
      cloneCheckbox.checked = false;
      cloneCheckbox.disabled = false;
      
      // 수정/삭제 버튼 다시 표시
      clone.querySelector('.todo_actions').style.display = 'flex';
      
      this.todoList.appendChild(clone);
      li.remove();
    });

    await this.saveData();
  }

  extractDataFromList(listElement) {
    return Array.from(listElement.children).map(li => ({
      id: li.dataset.id,
      date: li.querySelector('.date').textContent,
      text: li.querySelector('.text').textContent
    }));
  }

  async saveData() {
    try {
      const todoData = this.extractDataFromList(this.todoList);
      const doneData = this.extractDataFromList(this.doneList);
      
      const result = await ipcRenderer.invoke('save-data', {
        todo: todoData,
        done: doneData
      });

      if (!result.success) {
        console.error('데이터 저장 실패:', result.error);
      }
    } catch (error) {
      console.error('데이터 저장 오류:', error);
    }
  }

  async loadData() {
    try {
      const data = await ipcRenderer.invoke('load-data');
      
      this.todoList.innerHTML = '';
      this.doneList.innerHTML = '';

      data.todo.forEach(item => {
        const li = this.createTodoItem(item.date, item.text, item.id);
        this.todoList.appendChild(li);
      });

      data.done.forEach(item => {
        const li = this.createTodoItem(item.date, item.text, item.id);
        const checkbox = li.querySelector('input');
        checkbox.checked = true;
        checkbox.disabled = true;
        li.querySelector('.todo_actions').style.display = 'none';
        this.doneList.appendChild(li);
      });
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  }

  async exportData() {
    try {
      const todoData = this.extractDataFromList(this.todoList);
      const doneData = this.extractDataFromList(this.doneList);
      
      const result = await ipcRenderer.invoke('export-data', {
        todo: todoData,
        done: doneData
      });

      if (result.success && !result.canceled) {
        alert(`데이터가 성공적으로 내보내졌습니다.\n경로: ${result.path}`);
      } else if (result.error) {
        alert(`내보내기 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('데이터 내보내기 오류:', error);
      alert('데이터 내보내기 중 오류가 발생했습니다.');
    }
  }

  async importData() {
    try {
      const result = await ipcRenderer.invoke('import-data');

      if (result.success && result.data) {
        this.todoList.innerHTML = '';
        this.doneList.innerHTML = '';

        result.data.todo.forEach(item => {
          const li = this.createTodoItem(item.date, item.text, item.id);
          this.todoList.appendChild(li);
        });

        result.data.done.forEach(item => {
          const li = this.createTodoItem(item.date, item.text, item.id);
          const checkbox = li.querySelector('input');
          checkbox.checked = true;
          checkbox.disabled = true;
          li.querySelector('.todo_actions').style.display = 'none';
          this.doneList.appendChild(li);
        });

        alert('데이터가 성공적으로 가져와졌습니다.');
      } else if (result.error) {
        alert(`가져오기 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      alert('데이터 가져오기 중 오류가 발생했습니다.');
    }
  }

  handleEdit(li) {
    this.todoDate.value = li.querySelector('.date').textContent;
    this.todoText.value = li.querySelector('.text').textContent;
    this.editingLi = li;
    this.registerBtn.textContent = "수정 완료";
    this.registerBtn.classList.add('editing');
    this.todoText.focus();
  }

  async handleDelete(li) {
    if (confirm('정말 삭제하시겠습니까?')) {
      li.remove();
      await this.saveData();
    }
  }

  bindEvents() {
    // 등록/수정 버튼
    this.registerBtn.addEventListener('click', () => this.handleRegisterOrUpdate());

    // Enter 키로 등록
    this.todoText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleRegisterOrUpdate();
      }
    });

    // 완료/되돌리기 버튼
    document.getElementById('btn_done').addEventListener('click', () => this.moveToDone());
    document.getElementById('btn_todo').addEventListener('click', () => this.moveToTodo());

    // 내보내기/가져오기 버튼
    document.querySelector('.btn_export').addEventListener('click', () => this.exportData());
    document.querySelector('.btn_import').addEventListener('click', () => this.importData());

    // 이벤트 위임으로 수정/삭제 버튼 처리
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn_edit')) {
        const li = e.target.closest('li');
        this.handleEdit(li);
      }

      if (e.target.classList.contains('btn_delete')) {
        const li = e.target.closest('li');
        this.handleDelete(li);
      }
    });

    // ESC 키로 수정 모드 취소
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.editingLi) {
        this.resetEditMode();
        this.todoText.value = '';
      }
    });
  }
}

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
  new TodoManager();
});