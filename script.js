"use strict";

class TodoList {
  constructor() {
    this.newTaskInput = document.querySelector(".add-new-task-group input");
    this.newTaskbtn = document.querySelector(".add-new-task-group button");
    this.tasksRow = document.querySelector(".tasks-row");
    this.deleteSelectedBtn = document.querySelector(".delete-selected");

    this.deleteSelectedBtn.addEventListener("click", this.deleteSelected);

    this.newTaskInput.addEventListener("keydown", (event) => {
      if (event.keyCode === 13) {
        this.addNewTask();
      }
    });

    document.addEventListener('keydown', this.handleDocumentKeyDown);

    this.newTaskbtn.addEventListener("click", this.addNewTask);
    this.initTasks();
  }

  selectedTasks = new Set();
  editingTask = null;
  editingTaskOriginalTitle = '';

  getTasks() {
    const jsonStr = localStorage.getItem("tasks");
    if (!jsonStr) {
      return [];
    }
    const tasksArr = JSON.parse(jsonStr);
    return tasksArr;
  }

  saveTasks(tasks) {
    const jsonStr = JSON.stringify(tasks);
    localStorage.setItem("tasks", jsonStr);
  }

  initTasks() {
    const tasks = this.getTasks();

    let tasksHtml = "";
    tasks.forEach((task) => {
      const template = this.getTaskTemplate(task);
      tasksHtml += template;
    });
    this.tasksRow.innerHTML += tasksHtml;
  }

  getTaskTemplate(task) {
    const isTaskActive = task.status === "active";

    const template = ` 
    <div data-id="${task.id}" class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-3">
    <div class="card mb-3 ${isTaskActive ? "" : "completed-task"}" >
      <div class="card-body">
        <div class="form-check mb-2">
          <input class="form-check-input" type="checkbox" onclick="todoList.selectTask('${task.id}')"/>
        </div>
       <div class="title-container"> <h5 class="card-title task-title">${task.title}</h5></div>
        <p class="card-text">Status: ${task.status}</p>
        <p class="card-text">Created At: ${task.createdAt}</p>
        <p class="card-text ${isTaskActive ? "d-none" : ''}">Completed At: ${task.completedAt}</p>
        <div class="justify-content-end d-flex">
          <button class="btn btn-success ${isTaskActive ? "" : "d-none"}" onclick="todoList.changeTaskStatus('${task.id}', 'done')">Done</button>
          <button class="btn btn-primary ${isTaskActive ? 'd-none' : ''}" onclick="todoList.changeTaskStatus('${task.id}', 'active')">Restore</button>
          <button class="btn btn-warning ms-1" onclick="todoList.editTask('${task.id}')">Edit</button>
          <button class="btn btn-danger ms-1" onclick="todoList.deleteTask('${task.id}')">Delete</button>
        </div>
      </div>
    </div>
  </div>
    `;
    return template;
  }

  addNewTask = () => {
    const value = this.newTaskInput.value.trim();
    if (!value) {
      return;
    }

    const newTask = {
      id: this.getUniqueId(),
      title: value,
      status: "active",
      createdAt: new Date().toLocaleString(),
    };

    const template = this.getTaskTemplate(newTask);
    this.tasksRow.innerHTML += template;
    this.newTaskInput.value = "";

    const tasks = this.getTasks();
    tasks.push(newTask);
    this.saveTasks(tasks);
  };

  getUniqueId() {
    return (
      Math.random().toString(16).slice(2) + new Date().getTime().toString(16)
    );
  }

  deleteTaskFromHtml = (taskId) => {
    const task = document.querySelector(`[data-id="${taskId}"]`);
    task.remove();
  };

  deleteTask = (taskId) => {
    if (this.editingTask) {
      return;
    }
    this.deleteTaskFromHtml(taskId);
    const tasks = this.getTasks();
    const newTasks = tasks.filter((t) => t.id !== taskId);
    this.saveTasks(newTasks);
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
    }
  };

  deleteSelected = () => {
    if (!this.selectedTasks.size || this.editingTask) {
      return;
    }
    let tasks = this.getTasks();

    this.selectedTasks.forEach((taskId) => {
      this.deleteTaskFromHtml(taskId);
      tasks = tasks.filter((t) => t.id !== taskId);
    });

    this.saveTasks(tasks);
    this.selectedTasks.clear();
  };

  selectTask = (taskId) => {
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
    } else {
      this.selectedTasks.add(taskId);
    }
  };

  changeTaskStatus = (taskId, taskStatus) => {
    if (this.editingTask) {
      return;
    }
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    task.status = taskStatus;
    if (taskStatus === "done") {
      task.completedAt = new Date().toLocaleString();
    }
    this.saveTasks(tasks);

    const oldTaskNode = document.querySelector(`[data-id="${taskId}"]`);
    const taskTemplate = this.getTaskTemplate(task);
    const parser = new DOMParser();
    const newTaskNode = parser.parseFromString(taskTemplate, "text/html").querySelector('div');
    oldTaskNode.replaceWith(newTaskNode);
  };

  editTask = (taskId) => {
    if (this.editingTask) {
      return;
    }
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    this.editingTask = taskId;
    const titleContainer = document.querySelector(`[data-id="${taskId}"] .title-container`);
    const oldTitle = titleContainer.innerHTML;
    this.editingTaskOriginalTitle = oldTitle;

    const editTemplate = `
         <div class="input-group">
            <input
              type="text"
              class="form-control"
              value="${task.title}"
              onkeydown="todoList.handleTaskSave(event)"
            />
            <button onclick="todoList.saveTaskEditing()" class="btn btn-success" type="button" title="Save">&#x2713;</button>
            <button onclick="todoList.cancelTaskEditing()" class="btn btn-warning" type="button" title="Cancel" >&#x2715;</button>
          </div>`;
    titleContainer.innerHTML = editTemplate;
  };

  cancelTaskEditing = () => {
    const titleContainer = document.querySelector(`[data-id="${this.editingTask}"] .title-container`);
    titleContainer.innerHTML = this.editingTaskOriginalTitle;
    this.editingTaskOriginalTitle = '';
    this.editingTask = null;
  };

  saveTaskEditing = () => {
    const titleContainer = document.querySelector(`[data-id="${this.editingTask}"] .title-container`);
    const taskInput = titleContainer.querySelector('input');

    const parser = new DOMParser();
    const editedTaskTitle = parser.parseFromString(this.editingTaskOriginalTitle, "text/html").querySelector('h5');
    editedTaskTitle.innerText = taskInput.value;
    taskInput.replaceWith(editedTaskTitle);
    titleContainer.innerHTML = '';
    titleContainer.appendChild(editedTaskTitle);


    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === this.editingTask);
    task.title = taskInput.value;
    this.saveTasks(tasks);
    this.editingTaskOriginalTitle = '';
    this.editingTask = null;
  };

  handleTaskSave = (event) => {
    if (event.keyCode === 13) {
      this.saveTaskEditing();
    }

  };

  handleDocumentKeyDown = (event) => {
    if (!this.editingTask) {
      return;
    }

    if (event.keyCode === 27) {
      this.cancelTaskEditing();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.keyCode === 83) {
      event.preventDefault();
      this.saveTaskEditing();
    }
  };


}

const todoList = new TodoList();