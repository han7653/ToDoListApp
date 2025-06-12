// 동기부여 문구 모음
const quotes = [
  "작은 실천이 큰 변화를 만든다.",
  "오늘의 노력이 내일의 성공을 만든다.",
  "멈추지 않는 한, 실패는 없다.",
  "나 자신이 최고의 프로젝트다."
];

// 모든 DOM 요소 명시적으로 할당
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const dateInput = document.getElementById('todo-date');
const prioritySelect = document.getElementById('todo-priority');
const list = document.getElementById('todo-list');
const exportBtn = document.getElementById('export-btn');
const quoteBox = document.getElementById('quote-box');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const modeAll = document.getElementById('mode-all');
const modeCalendar = document.getElementById('mode-calendar');
const calendarView = document.getElementById('calendar-view');

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let mode = 'all';

/**
 * 명언 랜덤 출력
 */
function randomQuote() {
  quoteBox.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * 데이터 저장 & 렌더링
 */
function updateAll() {
  save();
  render();
}

/**
 * localStorage 저장
 */
function save() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

/**
 * 완료율 계산
 */
function calculateProgress() {
  if (todos.length === 0) return "0%";
  const done = todos.filter(t => t.completed).length;
  return Math.round((done / todos.length) * 100) + "%";
}

/**
 * 프로그레스 바 업데이트
 */
function updateProgress() {
  const pct = calculateProgress();
  progressBar.style.width = pct;
  progressText.textContent = pct;
}

/**
 * 렌더링 함수
 */
function render() {
  list.innerHTML = "";
  calendarView.innerHTML = "";
  calendarView.style.display = "none";
  updateProgress();

  if (mode === 'calendar') {
    renderCalendar();
    return;
  }

  todos.forEach((todo, i) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.priority}`;

    const main = document.createElement('div');
    main.className = 'todo-main';

    const text = document.createElement('div');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.onclick = () => editTodo(i);

    const dateDiv = document.createElement('div');
    dateDiv.className = 'todo-date';
    dateDiv.textContent = todo.date ? new Date(todo.date).toLocaleDateString() : '';

    const dday = document.createElement('div');
    dday.className = 'todo-dday';
    dday.textContent = getDDay(todo.date);

    main.append(text, dateDiv, dday);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const completeBtn = createBtn('완료', 'complete-btn', todo.completed, () => {
      todo.completed = true;
      updateAll();
      randomQuote();
    });

    const incompleteBtn = createBtn('미완료', 'incomplete-btn', !todo.completed, () => {
      todo.completed = false;
      updateAll();
      randomQuote();
    });

    const deleteBtn = createBtn('삭제', 'delete-btn', false, () => {
      li.classList.add('removing');
      li.addEventListener('animationend', () => {
        todos.splice(i, 1);
        updateAll();
        randomQuote();
      });
    });

    actions.append(incompleteBtn, completeBtn, deleteBtn);

    li.append(main, actions);
    list.append(li);
  });
}

/**
 * 날짜 차이 계산 (D-day)
 */
function getDDay(dateStr) {
  if (!dateStr) return "";
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `D-${diff}` : (diff === 0 ? "D-Day" : "");
}

/**
 * 버튼 생성 도우미
 */
function createBtn(label, cls, active, handler) {
  const b = document.createElement('button');
  b.textContent = label;
  b.className = cls + (active ? ' active-btn' : '');
  b.onclick = () => { handler(); };
  return b;
}

/**
 * 수정 모달
 */
function editTodo(i) {
  const t = todos[i];
  const nt = prompt("할 일 수정", t.text);
  if (nt === null) return;
  const nd = prompt("마감일 (YYYY-MM-DD)", t.date || "");
  if (nd === null) return;
  const pr = prompt("중요도 (low,medium,high)", t.priority) || t.priority;

  t.text = nt;
  t.date = nd;
  if (['low', 'medium', 'high'].includes(pr)) t.priority = pr;

  updateAll();
  randomQuote();
}

/**
 * 캘린더 모드 렌더링
 */
function renderCalendar() {
  calendarView.style.display = 'block';
  const byDate = {};

  todos.forEach(t => {
    if (!t.date) return;
    byDate[t.date] = byDate[t.date] || [];
    byDate[t.date].push(t);
  });

  Object.keys(byDate).sort().forEach(d => {
    const hdr = document.createElement('h3');
    hdr.textContent = new Date(d).toLocaleDateString();

    const ul = document.createElement('ul');
    byDate[d].forEach(t => {
      const li = document.createElement('li');
      li.textContent = `${t.completed ? "✔️" : ""} [${t.priority}] ${t.text}`;
      ul.append(li);
    });

    calendarView.append(hdr, ul);
  });
}

/**
 * 폼 제출 처리
 */
form.onsubmit = e => {
  e.preventDefault();
  todos.push({
    text: input.value,
    date: dateInput.value,
    priority: prioritySelect.value,
    completed: false
  });
  updateAll();
  randomQuote();
  form.reset();
};

/**
 * 모드 전환 버튼
 */
modeAll.onclick = () => {
  mode = 'all';
  modeAll.classList.add('active');
  modeCalendar.classList.remove('active');
  render();
};

modeCalendar.onclick = () => {
  mode = 'calendar';
  modeCalendar.classList.add('active');
  modeAll.classList.remove('active');
  render();
};

/**
 * 백업 내보내기
 */
exportBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(todos)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `todos_${Date.now()}.json`;
  a.click();
};

// 초기 실행
randomQuote();
render();
