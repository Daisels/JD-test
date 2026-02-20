window.App = window.App || {};

App.Dashboard = {
  render: function() {
    var today = App.Utils.today();
    var habits = App.Store.getHabits();
    var completions = App.Store.getCompletions();
    var todayCompletions = completions[today] || {};
    var contacts = App.Store.getContacts();
    var tasks = App.Store.getTasks();

    // Calculate overall today's progress
    var todayHabits = habits.filter(function(h) {
      return h.area !== 'social' && h.area !== 'business' &&
             h.area !== 'life-tasks' && h.area !== 'work-tasks';
    });
    var completedCount = 0;
    for (var i = 0; i < todayHabits.length; i++) {
      if (todayCompletions[todayHabits[i].id] && todayCompletions[todayHabits[i].id].done) {
        completedCount++;
      }
    }
    var totalHabits = todayHabits.length;
    var pct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

    var html = '<div class="area-view">';

    // Today's progress header
    html += '<div class="card">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<div>' +
          '<h2 style="font-size:var(--font-size-2xl);font-weight:var(--font-weight-bold)">Today\'s Progress</h2>' +
          '<p class="text-sm text-secondary">' + App.Utils.formatDisplay(today) + '</p>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div style="font-size:var(--font-size-3xl);font-weight:var(--font-weight-bold)">' + pct + '%</div>' +
          '<div class="text-xs text-muted">' + completedCount + '/' + totalHabits + ' habits</div>' +
        '</div>' +
      '</div>' +
      '<div class="progress-bar" style="height:10px">' +
        '<div class="progress-bar-fill" style="width:' + pct + '%;background:var(--success)"></div>' +
      '</div>' +
    '</div>';

    // Area cards grid
    html += '<div class="dashboard-grid">';

    // Sports card
    html += this.renderAreaCard('sports', habits, todayCompletions, completions);

    // Meditation card
    html += this.renderAreaCard('meditation', habits, todayCompletions, completions);

    // Reading card
    html += this.renderAreaCard('reading', habits, todayCompletions, completions);

    // Social card
    html += this.renderSocialCard('social', contacts);

    // Business card
    html += this.renderSocialCard('business', contacts);

    // Life Tasks card
    html += this.renderTaskCard('life-tasks', tasks);

    // Work Tasks card
    html += this.renderTaskCard('work-tasks', tasks);

    html += '</div>';

    // Weekly chart
    html += '<div class="card">' +
      '<div class="card-header"><span class="card-title">This Week</span></div>' +
      '<div class="chart-container" style="height:200px">' +
        '<canvas id="dashboard-weekly-chart"></canvas>' +
      '</div>' +
    '</div>';

    html += '</div>';
    return html;
  },

  renderAreaCard: function(area, habits, todayCompletions, completions) {
    var areaInfo = App.Utils.areas[area];
    var areaHabits = habits.filter(function(h) { return h.area === area; });
    var done = 0;
    var bestStreak = 0;
    var currentStreak = 0;

    for (var i = 0; i < areaHabits.length; i++) {
      var h = areaHabits[i];
      if (todayCompletions[h.id] && todayCompletions[h.id].done) done++;
      var s = App.Utils.calculateStreak(h.id, completions);
      if (s > currentStreak) currentStreak = s;
      var bs = App.Utils.calculateBestStreak(h.id, completions);
      if (bs > bestStreak) bestStreak = bs;
    }

    return '<div class="card card-clickable area-card" data-area="' + area + '" data-action="goto" data-href="#' + area + '">' +
      '<div class="flex items-center gap-3">' +
        '<div class="area-card-icon">' + App.Utils.icon(areaInfo.icon) + '</div>' +
        '<div>' +
          '<div class="card-title">' + areaInfo.name + '</div>' +
          '<div class="text-xs text-muted">' + done + '/' + areaHabits.length + ' today</div>' +
        '</div>' +
      '</div>' +
      '<div class="area-card-stats">' +
        '<div class="area-card-stat">' +
          '<span class="area-card-stat-label">Streak</span>' +
          '<span class="area-card-stat-value">' + currentStreak + ' days</span>' +
        '</div>' +
        '<div class="area-card-stat">' +
          '<span class="area-card-stat-label">Best</span>' +
          '<span class="area-card-stat-value">' + bestStreak + ' days</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  renderSocialCard: function(area, contacts) {
    var areaInfo = App.Utils.areas[area];
    var areaContacts = contacts.filter(function(c) { return c.area === area && !c.archived; });
    var today = App.Utils.today();
    var overdue = 0;
    var dueSoon = 0;

    for (var i = 0; i < areaContacts.length; i++) {
      var c = areaContacts[i];
      if (c.lastContacted && c.targetFrequency) {
        var daysSince = App.Utils.daysBetween(c.lastContacted, today);
        if (daysSince > c.targetFrequency) {
          overdue++;
        } else if (daysSince > c.targetFrequency - 3) {
          dueSoon++;
        }
      } else if (!c.lastContacted) {
        overdue++;
      }
    }

    return '<div class="card card-clickable area-card" data-area="' + area + '" data-action="goto" data-href="#' + area + '">' +
      '<div class="flex items-center gap-3">' +
        '<div class="area-card-icon">' + App.Utils.icon(areaInfo.icon) + '</div>' +
        '<div>' +
          '<div class="card-title">' + areaInfo.name + '</div>' +
          '<div class="text-xs text-muted">' + areaContacts.length + ' contacts</div>' +
        '</div>' +
      '</div>' +
      '<div class="area-card-stats">' +
        (overdue > 0 ? '<div class="area-card-stat"><span class="area-card-stat-label text-danger">Overdue</span><span class="area-card-stat-value text-danger">' + overdue + '</span></div>' : '') +
        (dueSoon > 0 ? '<div class="area-card-stat"><span class="area-card-stat-label text-warning">Due soon</span><span class="area-card-stat-value text-warning">' + dueSoon + '</span></div>' : '') +
        (overdue === 0 && dueSoon === 0 ? '<div class="area-card-stat"><span class="area-card-stat-label text-success">All caught up</span></div>' : '') +
      '</div>' +
    '</div>';
  },

  renderTaskCard: function(area, tasks) {
    var areaInfo = App.Utils.areas[area];
    var areaTasks = tasks.filter(function(t) { return t.area === area; });
    var today = App.Utils.today();
    var active = areaTasks.filter(function(t) { return t.status !== 'done'; });
    var dueToday = active.filter(function(t) { return t.dueDate === today; });
    var overdue = active.filter(function(t) { return t.dueDate && t.dueDate < today; });

    return '<div class="card card-clickable area-card" data-area="' + area + '" data-action="goto" data-href="#' + area + '">' +
      '<div class="flex items-center gap-3">' +
        '<div class="area-card-icon">' + App.Utils.icon(areaInfo.icon) + '</div>' +
        '<div>' +
          '<div class="card-title">' + areaInfo.name + '</div>' +
          '<div class="text-xs text-muted">' + active.length + ' active</div>' +
        '</div>' +
      '</div>' +
      '<div class="area-card-stats">' +
        (dueToday.length > 0 ? '<div class="area-card-stat"><span class="area-card-stat-label">Due today</span><span class="area-card-stat-value">' + dueToday.length + '</span></div>' : '') +
        (overdue.length > 0 ? '<div class="area-card-stat"><span class="area-card-stat-label text-danger">Overdue</span><span class="area-card-stat-value text-danger">' + overdue.length + '</span></div>' : '') +
        (dueToday.length === 0 && overdue.length === 0 ? '<div class="area-card-stat"><span class="area-card-stat-label text-success">On track</span></div>' : '') +
      '</div>' +
    '</div>';
  },

  init: function() {
    // Click handlers for area cards
    document.querySelectorAll('[data-action="goto"]').forEach(function(el) {
      el.addEventListener('click', function() {
        App.Router.navigate(this.dataset.href);
      });
    });

    // Render weekly chart
    this.renderWeeklyChart();
  },

  renderWeeklyChart: function() {
    var settings = App.Store.getSettings();
    var weekDates = App.Utils.getWeekDates(App.Utils.today(), settings.weekStartsOn);
    var habits = App.Store.getHabits().filter(function(h) {
      return h.area !== 'social' && h.area !== 'business' &&
             h.area !== 'life-tasks' && h.area !== 'work-tasks';
    });
    var completions = App.Store.getCompletions();

    var labels = [];
    var values = [];

    for (var i = 0; i < weekDates.length; i++) {
      var date = weekDates[i];
      labels.push(App.Utils.formatDayName(date));
      if (habits.length === 0) {
        values.push(0);
      } else {
        var dayData = completions[date] || {};
        var dayDone = 0;
        for (var j = 0; j < habits.length; j++) {
          if (dayData[habits[j].id] && dayData[habits[j].id].done) dayDone++;
        }
        values.push(Math.round((dayDone / habits.length) * 100));
      }
    }

    App.Charts.weeklyBar('dashboard-weekly-chart', { labels: labels, values: values }, '#2F80ED');
  }
};
