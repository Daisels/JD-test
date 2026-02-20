window.App = window.App || {};

App.WorkTasks = {
  currentView: 'list', // 'list' or 'project'

  render: function() {
    var tasks = App.Store.getTasks('work-tasks');
    var today = App.Utils.today();

    var active = tasks.filter(function(t) { return t.status !== 'done'; });
    var done = tasks.filter(function(t) { return t.status === 'done'; });

    // Sort active tasks
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

    done.sort(function(a, b) { return (b.completedAt || '').localeCompare(a.completedAt || ''); });

    var html = '<div class="area-view" data-area="work-tasks">';

    // Header
    html += '<div class="area-header">' +
      '<h2><span class="area-header-dot" style="background:var(--color-work-tasks)"></span> Work Tasks</h2>' +
      '<button class="btn btn-primary" data-action="add-task" style="background:var(--color-work-tasks);border-color:var(--color-work-tasks)">' + App.Utils.icon('plus') + ' Add Task</button>' +
    '</div>';

    // Stats
    var overdue = active.filter(function(t) { return t.dueDate && t.dueDate < today; });
    var dueToday = active.filter(function(t) { return t.dueDate === today; });

    // Get unique projects
    var projects = {};
    for (var p = 0; p < tasks.length; p++) {
      var proj = tasks[p].project || 'Unassigned';
      if (!projects[proj]) projects[proj] = { active: 0, done: 0 };
      if (tasks[p].status === 'done') {
        projects[proj].done++;
      } else {
        projects[proj].active++;
      }
    }
    var projectCount = Object.keys(projects).length;

    html += '<div class="stats-row">' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + active.length + '</div>' +
        '<div class="stat-label">Active</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value" style="color:var(--color-work-tasks)">' + dueToday.length + '</div>' +
        '<div class="stat-label">Due Today</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value" style="color:var(--danger)">' + overdue.length + '</div>' +
        '<div class="stat-label">Overdue</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + projectCount + '</div>' +
        '<div class="stat-label">Projects</div>' +
      '</div>' +
    '</div>';

    // View toggle and filters
    html += '<div class="flex items-center justify-between">' +
      '<div class="area-tabs" style="border:none;margin:0">' +
        '<button class="area-tab active" data-filter="all">All</button>' +
        '<button class="area-tab" data-filter="todo">To Do</button>' +
        '<button class="area-tab" data-filter="in-progress">In Progress</button>' +
        '<button class="area-tab" data-filter="done">Done</button>' +
      '</div>' +
      '<div class="flex gap-2">' +
        '<button class="btn btn-sm' + (this.currentView === 'list' ? ' btn-primary' : '') + '" data-action="view-list">List</button>' +
        '<button class="btn btn-sm' + (this.currentView === 'project' ? ' btn-primary' : '') + '" data-action="view-project">By Project</button>' +
      '</div>' +
    '</div>';

    if (tasks.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-text">No work tasks yet. Add your first task.</div></div>';
    } else if (this.currentView === 'project') {
      // Group by project
      html += this.renderByProject(active, done, today);
    } else {
      // Flat list
      html += '<div class="list" id="task-list">';
      for (var i = 0; i < active.length; i++) {
        html += App.LifeTasks.renderTaskItem(active[i], today);
      }
      if (done.length > 0) {
        for (var j = 0; j < Math.min(done.length, 10); j++) {
          html += App.LifeTasks.renderTaskItem(done[j], today);
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

  renderByProject: function(active, done, today) {
    var allTasks = active.concat(done);
    var groups = {};

    for (var i = 0; i < allTasks.length; i++) {
      var proj = allTasks[i].project || 'Unassigned';
      if (!groups[proj]) groups[proj] = [];
      groups[proj].push(allTasks[i]);
    }

    var html = '';
    var projectNames = Object.keys(groups).sort(function(a, b) {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });

    for (var j = 0; j < projectNames.length; j++) {
      var name = projectNames[j];
      var tasks = groups[name];
      var activeCount = tasks.filter(function(t) { return t.status !== 'done'; }).length;

      html += '<div class="section">' +
        '<div class="flex items-center justify-between">' +
          '<div class="section-title">' + App.Utils.escapeHtml(name) + '</div>' +
          '<span class="badge badge-info">' + activeCount + ' active</span>' +
        '</div>' +
        '<div class="list">';

      for (var k = 0; k < tasks.length; k++) {
        html += App.LifeTasks.renderTaskItem(tasks[k], today);
      }

      html += '</div></div>';
    }

    return html;
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
        App.LifeTasks.showAddTaskModal('work-tasks');
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
        App.LifeTasks.showEditTaskModal(target.dataset.taskId, 'work-tasks');
      }

      if (action === 'delete-task') {
        e.stopPropagation();
        App.App.confirm('Delete this task?', function() {
          App.Store.deleteTask(target.dataset.taskId);
          App.App.refreshView();
        });
      }

      if (action === 'view-list') {
        self.currentView = 'list';
        App.App.refreshView();
      }

      if (action === 'view-project') {
        self.currentView = 'project';
        App.App.refreshView();
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
  }
};
