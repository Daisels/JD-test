window.App = window.App || {};

App.LifeTasks = {
  currentFilter: 'all',

  render: function() {
    var tasks = App.Store.getTasks('life-tasks');
    var today = App.Utils.today();

    var active = tasks.filter(function(t) { return t.status !== 'done'; });
    var done = tasks.filter(function(t) { return t.status === 'done'; });

    // Sort active: overdue first, then by due date, then by priority
    var priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    active.sort(function(a, b) {
      var aOverdue = a.dueDate && a.dueDate < today ? -1 : 0;
      var bOverdue = b.dueDate && b.dueDate < today ? -1 : 0;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    // Sort done: most recent first
    done.sort(function(a, b) { return (b.completedAt || '').localeCompare(a.completedAt || ''); });

    var html = '<div class="area-view" data-area="life-tasks">';

    // Header
    html += '<div class="area-header">' +
      '<h2><span class="area-header-dot" style="background:var(--color-life-tasks)"></span> Life Tasks</h2>' +
      '<button class="btn btn-primary" data-action="add-task" style="background:var(--color-life-tasks);border-color:var(--color-life-tasks)">' + App.Utils.icon('plus') + ' Add Task</button>' +
    '</div>';

    // Stats
    var overdue = active.filter(function(t) { return t.dueDate && t.dueDate < today; });
    var dueToday = active.filter(function(t) { return t.dueDate === today; });

    html += '<div class="stats-row">' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + active.length + '</div>' +
        '<div class="stat-label">Active</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value" style="color:var(--color-life-tasks)">' + dueToday.length + '</div>' +
        '<div class="stat-label">Due Today</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value" style="color:var(--danger)">' + overdue.length + '</div>' +
        '<div class="stat-label">Overdue</div>' +
      '</div>' +
    '</div>';

    // Filter tabs
    html += '<div class="area-tabs">' +
      '<button class="area-tab active" data-filter="all">All</button>' +
      '<button class="area-tab" data-filter="todo">To Do</button>' +
      '<button class="area-tab" data-filter="in-progress">In Progress</button>' +
      '<button class="area-tab" data-filter="done">Done</button>' +
    '</div>';

    // Active tasks
    if (active.length === 0 && done.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-text">No tasks yet. Add your first task to get organized.</div></div>';
    } else {
      html += '<div class="list" id="task-list">';
      for (var i = 0; i < active.length; i++) {
        html += this.renderTaskItem(active[i], today);
      }

      // Done tasks (collapsible)
      if (done.length > 0) {
        for (var j = 0; j < Math.min(done.length, 10); j++) {
          html += this.renderTaskItem(done[j], today);
        }
        if (done.length > 10) {
          html += '<div class="text-sm text-muted" style="text-align:center;padding:var(--sp-3)">+ ' + (done.length - 10) + ' more completed tasks</div>';
        }
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  renderTaskItem: function(task, today) {
    var isDone = task.status === 'done';
    var isOverdue = !isDone && task.dueDate && task.dueDate < today;

    return '<div class="task-item' + (isDone ? ' task-done' : '') + '" data-task-id="' + task.id + '" data-status="' + task.status + '">' +
      '<div class="task-checkbox" data-action="toggle-task" data-task-id="' + task.id + '"></div>' +
      '<div class="priority-dot priority-' + (task.priority || 'medium') + '"></div>' +
      '<div class="task-content" data-action="edit-task" data-task-id="' + task.id + '">' +
        '<div class="task-title">' + App.Utils.escapeHtml(task.title) + '</div>' +
        '<div class="task-meta">' +
          (task.dueDate ? '<span class="task-due' + (isOverdue ? ' overdue' : '') + '">' +
            (isOverdue ? 'Overdue: ' : 'Due: ') + App.Utils.formatShort(task.dueDate) +
          '</span>' : '') +
          '<span class="badge badge-' + (task.priority === 'urgent' || task.priority === 'high' ? 'danger' : 'info') + '">' + (task.priority || 'medium') + '</span>' +
          (task.status === 'in-progress' ? '<span class="badge badge-info">In Progress</span>' : '') +
        '</div>' +
      '</div>' +
      '<button class="btn btn-sm btn-icon" data-action="delete-task" data-task-id="' + task.id + '">' + App.Utils.icon('trash') + '</button>' +
    '</div>';
  },

  init: function() {
    var self = this;
    var view = document.querySelector('.area-view');
    if (!view) return;

    view.addEventListener('click', function(e) {
      var target = e.target.closest('[data-action]');
      if (!target) return;

      var action = target.dataset.action;

      if (action === 'add-task') {
        self.showAddTaskModal('life-tasks');
      }

      if (action === 'toggle-task') {
        e.stopPropagation();
        var taskId = target.dataset.taskId;
        var tasks = App.Store.getTasks();
        var task = tasks.find(function(t) { return t.id === taskId; });
        if (task) {
          var newStatus = task.status === 'done' ? 'todo' : 'done';
          App.Store.updateTask(taskId, { status: newStatus });
          App.App.refreshView();
        }
      }

      if (action === 'edit-task') {
        self.showEditTaskModal(target.dataset.taskId, 'life-tasks');
      }

      if (action === 'delete-task') {
        e.stopPropagation();
        App.App.confirm('Delete this task?', function() {
          App.Store.deleteTask(target.dataset.taskId);
          App.App.refreshView();
        });
      }
    });

    // Filter tabs
    view.querySelectorAll('[data-filter]').forEach(function(tab) {
      tab.addEventListener('click', function() {
        view.querySelectorAll('.area-tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        var filter = this.dataset.filter;
        var items = view.querySelectorAll('.task-item');
        items.forEach(function(item) {
          if (filter === 'all') {
            item.style.display = '';
          } else {
            item.style.display = item.dataset.status === filter ? '' : 'none';
          }
        });
      });
    });
  },

  showAddTaskModal: function(area) {
    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Title</label>' +
      '<input type="text" class="form-input" id="task-title" placeholder="What needs to be done?">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Description (optional)</label>' +
      '<textarea class="form-textarea" id="task-description" placeholder="More details..."></textarea>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label class="form-label">Priority</label>' +
        '<select class="form-select" id="task-priority">' +
          '<option value="low">Low</option>' +
          '<option value="medium" selected>Medium</option>' +
          '<option value="high">High</option>' +
          '<option value="urgent">Urgent</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Due Date</label>' +
        '<input type="date" class="form-input" id="task-due">' +
      '</div>' +
    '</div>' +
    (area === 'work-tasks' ? '<div class="form-group">' +
      '<label class="form-label">Project</label>' +
      '<input type="text" class="form-input" id="task-project" placeholder="Project name">' +
    '</div>' : '');

    var accentColor = area === 'work-tasks' ? 'var(--color-work-tasks)' : 'var(--color-life-tasks)';
    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-task" style="background:' + accentColor + ';border-color:' + accentColor + '">Add Task</button>';

    var overlay = App.App.showModal('Add Task', bodyHtml, footerHtml);

    overlay.querySelector('#save-task').addEventListener('click', function() {
      var title = document.getElementById('task-title').value.trim();
      if (!title) { alert('Please enter a task title.'); return; }

      var task = {
        area: area,
        title: title,
        description: document.getElementById('task-description').value.trim(),
        priority: document.getElementById('task-priority').value,
        dueDate: document.getElementById('task-due').value || null,
        tags: []
      };

      var projectEl = document.getElementById('task-project');
      if (projectEl) {
        task.project = projectEl.value.trim() || null;
      }

      App.Store.addTask(task);
      App.App.closeModal();
      App.App.refreshView();
    });
  },

  showEditTaskModal: function(taskId, area) {
    var tasks = App.Store.getTasks();
    var task = null;
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) { task = tasks[i]; break; }
    }
    if (!task) return;

    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Title</label>' +
      '<input type="text" class="form-input" id="task-title" value="' + App.Utils.escapeHtml(task.title) + '">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Description</label>' +
      '<textarea class="form-textarea" id="task-description">' + App.Utils.escapeHtml(task.description || '') + '</textarea>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label class="form-label">Status</label>' +
        '<select class="form-select" id="task-status">' +
          '<option value="todo"' + (task.status === 'todo' ? ' selected' : '') + '>To Do</option>' +
          '<option value="in-progress"' + (task.status === 'in-progress' ? ' selected' : '') + '>In Progress</option>' +
          '<option value="done"' + (task.status === 'done' ? ' selected' : '') + '>Done</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Priority</label>' +
        '<select class="form-select" id="task-priority">' +
          '<option value="low"' + (task.priority === 'low' ? ' selected' : '') + '>Low</option>' +
          '<option value="medium"' + (task.priority === 'medium' ? ' selected' : '') + '>Medium</option>' +
          '<option value="high"' + (task.priority === 'high' ? ' selected' : '') + '>High</option>' +
          '<option value="urgent"' + (task.priority === 'urgent' ? ' selected' : '') + '>Urgent</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Due Date</label>' +
      '<input type="date" class="form-input" id="task-due" value="' + (task.dueDate || '') + '">' +
    '</div>' +
    (task.project !== undefined ? '<div class="form-group">' +
      '<label class="form-label">Project</label>' +
      '<input type="text" class="form-input" id="task-project" value="' + App.Utils.escapeHtml(task.project || '') + '">' +
    '</div>' : '');

    var accentColor = area === 'work-tasks' ? 'var(--color-work-tasks)' : 'var(--color-life-tasks)';
    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-task" style="background:' + accentColor + ';border-color:' + accentColor + '">Save</button>';

    var overlay = App.App.showModal('Edit Task', bodyHtml, footerHtml);

    overlay.querySelector('#save-task').addEventListener('click', function() {
      var updates = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim(),
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        dueDate: document.getElementById('task-due').value || null
      };

      var projectEl = document.getElementById('task-project');
      if (projectEl) {
        updates.project = projectEl.value.trim() || null;
      }

      App.Store.updateTask(taskId, updates);
      App.App.closeModal();
      App.App.refreshView();
    });
  }
};
