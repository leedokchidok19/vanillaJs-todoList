function setTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('todo_date').value = `${yyyy}-${mm}-${dd}`;
}

function handleAddTodo() {
    const date = document.getElementById('todo_date').value;
    const text = document.getElementById('todo_txt').value.trim();
    if (!text) {
        alert('작업 내용을 입력해주세요.');
        return;
    }
    createTodoElement(date, text);
    document.getElementById('todo_txt').value = '';
}

function createTodoElement(date, text) {
    const todoList = document.getElementById('todo_list');
    const index = todoList.querySelectorAll('li').length + 1;
    const li = document.createElement('li');
    li.dataset.order = index;
    li.innerHTML = `
        <input type="checkbox" id="todo${index}">
        <div class="todo_info">
            <label for="todo${index}">
                <span>${date}</span>
                <p>${text}</p>
            </label>
        </div>
        <div class="todo_actions">
            <button class="btn">U</button>
            <button class="btn btn-delete">X</button>
        </div>
    `;
    todoList.appendChild(li);
}

function moveToDone() {
    const checkedItems = document.querySelectorAll('#todo_list li input[type="checkbox"]:checked');
    checkedItems.forEach(cb => {
        const li = cb.closest('li');
        const clone = li.cloneNode(true);
        const checkbox = clone.querySelector('input[type="checkbox"]');
        checkbox.checked = true;
        checkbox.readOnly = true;
        document.getElementById('done_list').appendChild(clone);
        li.remove();
    });
}

// 완료목록 클릭 시 선택 토글
document.querySelector('#done_list').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li) {
        li.classList.toggle('selected');
    }
});

function moveToTodo() {
    const selectedItems = document.querySelectorAll('#done_list li.selected');

    selectedItems.forEach(li => {
        const clone = li.cloneNode(true);

        // 이동 시 체크박스 해제 + 수정 가능
        const todoCheckbox = clone.querySelector('input[type="checkbox"]');
        todoCheckbox.checked = false;
        todoCheckbox.removeAttribute('readonly');

        // 새 위치로 이동
        document.querySelector('#todo_list').appendChild(clone);

        // 원래 위치에서 삭제
        li.remove();
    });
/* 전체이동
    const checkedItems = document.querySelectorAll('#done_list li input[type="checkbox"]:checked');
    checkedItems.forEach(cb => {
        const li = cb.closest('li');
        const clone = li.cloneNode(true);
        const checkbox = clone.querySelector('input[type="checkbox"]');
        checkbox.checked = false;
        checkbox.readOnly = false;
        if (!clone.querySelector('.todo_actions .btn:nth-child(1)')) {
            const updateBtn = document.createElement('button');
            updateBtn.classList.add('btn');
            updateBtn.textContent = 'U';
            clone.querySelector('.todo_actions').prepend(updateBtn);
        }
        document.getElementById('todo_list').appendChild(clone);
        li.remove();
    });
*/
    sortTodoByOrder();
}

function sortTodoByOrder() {
    const todoList = document.getElementById('todo_list');
    const items = Array.from(todoList.querySelectorAll('li'));
    items.sort((a, b) => parseInt(b.dataset.order) - parseInt(a.dataset.order));
    items.forEach(item => todoList.appendChild(item));
}

document.querySelector('.btn_register').addEventListener('click', handleAddTodo);
document.getElementById('btn_done').addEventListener('click', moveToDone);
document.getElementById('btn_todo').addEventListener('click', moveToTodo);

// 삭제 버튼 클릭 이벤트 위임
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-delete')) {
        const li = e.target.closest('li');
        if (li) li.remove();
    }
});


setTodayDate();
