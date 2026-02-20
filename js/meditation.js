window.App = window.App || {};

App.Meditation = {
  presetDurations: [5, 10, 15, 20, 30],
  sessionTypes: ['Silent', 'Guided', 'Breathwork', 'Body Scan'],

  render: function() {
    var today = App.Utils.today();
    var habits = App.Store.getHabits('meditation');
    var completions = App.Store.getCompletions();
    var todayCompletions = completions[today] || {};

    var html = '<div class="area-view area-meditation" data-area="meditation">';

    // Header
    html += '<div class="area-header">' +
      '<h2><span class="area-header-dot" style="background:var(--color-meditation)"></span> Meditation</h2>' +
      '<div class="flex gap-3">' +
        '<button class="btn btn-primary" data-action="log-session" style="background:var(--color-meditation);border-color:var(--color-meditation)">' + App.Utils.icon('plus') + ' Log Session</button>' +
        '<button class="btn" data-action="add-habit">' + App.Utils.icon('plus') + ' Add Habit</button>' +
      '</div>' +
    '</div>';

    // Stats - streak is the star metric
    var longestStreak = 0;
    var currentStreak = 0;
    var totalMinutes = 0;

    for (var i = 0; i < habits.length; i++) {
      var s = App.Utils.calculateStreak(habits[i].id, completions);
      if (s > currentStreak) currentStreak = s;
      var bs = App.Utils.calculateBestStreak(habits[i].id, completions);
      if (bs > longestStreak) longestStreak = bs;
    }

    // Calculate total lifetime minutes
    var allDates = Object.keys(completions);
    for (var d = 0; d < allDates.length; d++) {
      var dayData = completions[allDates[d]];
      for (var j = 0; j < habits.length; j++) {
        var entry = dayData[habits[j].id];
        if (entry && entry.done && entry.value) {
          totalMinutes += entry.value;
        }
      }
    }

    html += '<div class="stats-row">' +
      '<div class="stat-box" style="border:2px solid var(--color-meditation-light)">' +
        '<div class="streak"><span class="streak-fire">' + App.Utils.icon('fire') + '</span></div>' +
        '<div class="stat-value" style="color:var(--color-meditation);font-size:var(--font-size-3xl)">' + currentStreak + '</div>' +
        '<div class="stat-label">Day Streak</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + longestStreak + '</div>' +
        '<div class="stat-label">Best Streak</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + this.formatMinutes(totalMinutes) + '</div>' +
        '<div class="stat-label">Total Time</div>' +
      '</div>' +
    '</div>';

    // Today's habits
    html += '<div class="section">';
    html += '<div class="section-title">Today</div>';

    if (habits.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-text">Start your meditation practice. Add a habit to track daily sessions.</div></div>';
    } else {
      html += '<div class="list">';
      for (var k = 0; k < habits.length; k++) {
        var habit = habits[k];
        var isComplete = todayCompletions[habit.id] && todayCompletions[habit.id].done;
        var streak = App.Utils.calculateStreak(habit.id, completions);
        var completionData = todayCompletions[habit.id];
        var valueDisplay = '';
        if (completionData && completionData.value) {
          valueDisplay = completionData.value + ' min';
        }

        html += '<div class="habit-check' + (isComplete ? ' completed' : '') + '" data-action="toggle-habit" data-habit-id="' + habit.id + '" style="--accent-color:var(--color-meditation)">' +
          '<div class="habit-check-box">' + App.Utils.icon('check') + '</div>' +
          '<div class="habit-check-info">' +
            '<div class="habit-check-name">' + App.Utils.escapeHtml(habit.name) + '</div>' +
            '<div class="habit-check-meta">' +
              (habit.target ? habit.target.value + ' min goal' : '') +
              (valueDisplay ? ' &middot; ' + valueDisplay + ' logged' : '') +
            '</div>' +
          '</div>' +
          (streak > 0 ? '<div class="habit-check-streak">' + streak + 'd</div>' : '') +
        '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    // Charts
    html += '<div class="area-columns">' +
      '<div class="card">' +
        '<div class="card-header"><span class="card-title">Last 7 Days</span></div>' +
        '<div class="chart-container" style="height:200px">' +
          '<canvas id="meditation-weekly-chart"></canvas>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-header"><span class="card-title">30-Day Duration Trend</span></div>' +
        '<div class="chart-container" style="height:200px">' +
          '<canvas id="meditation-trend-chart"></canvas>' +
        '</div>' +
      '</div>' +
    '</div>';

    html += '</div>';
    return html;
  },

  formatMinutes: function(min) {
    if (min < 60) return min + 'm';
    var hours = Math.floor(min / 60);
    var mins = min % 60;
    return hours + 'h' + (mins > 0 ? ' ' + mins + 'm' : '');
  },

  init: function() {
    var self = this;
    var view = document.querySelector('.area-view');
    if (!view) return;

    view.addEventListener('click', function(e) {
      var target = e.target.closest('[data-action]');
      if (!target) return;

      var action = target.dataset.action;

      if (action === 'toggle-habit') {
        App.Store.toggleCompletion(target.dataset.habitId, App.Utils.today());
        App.App.refreshView();
      }

      if (action === 'log-session') {
        self.showLogSessionModal();
      }

      if (action === 'add-habit') {
        self.showAddHabitModal();
      }
    });

    this.renderCharts();
  },

  showLogSessionModal: function() {
    var habits = App.Store.getHabits('meditation');
    var habitOptions = '';
    for (var i = 0; i < habits.length; i++) {
      habitOptions += '<option value="' + habits[i].id + '">' + App.Utils.escapeHtml(habits[i].name) + '</option>';
    }

    var typeOptions = '';
    for (var j = 0; j < this.sessionTypes.length; j++) {
      typeOptions += '<option value="' + this.sessionTypes[j].toLowerCase() + '">' + this.sessionTypes[j] + '</option>';
    }

    var bodyHtml = '';
    if (habits.length > 0) {
      bodyHtml += '<div class="form-group">' +
        '<label class="form-label">Habit</label>' +
        '<select class="form-select" id="session-habit">' + habitOptions + '</select>' +
      '</div>';
    }

    bodyHtml += '<div class="form-group">' +
      '<label class="form-label">Duration (minutes)</label>' +
      '<div class="flex gap-2" style="flex-wrap:wrap">';

    for (var k = 0; k < this.presetDurations.length; k++) {
      var d = this.presetDurations[k];
      bodyHtml += '<button class="btn btn-sm preset-dur" data-dur="' + d + '">' + d + ' min</button>';
    }

    bodyHtml += '</div>' +
      '<input type="number" class="form-input mt-2" id="session-duration" value="10" min="1" placeholder="Custom duration">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Type</label>' +
      '<select class="form-select" id="session-type">' + typeOptions + '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Note (optional)</label>' +
      '<input type="text" class="form-input" id="session-note" placeholder="How was your session?">' +
    '</div>';

    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-session" style="background:var(--color-meditation);border-color:var(--color-meditation)">Save Session</button>';

    var overlay = App.App.showModal('Log Meditation Session', bodyHtml, footerHtml);

    // Preset duration buttons
    overlay.querySelectorAll('.preset-dur').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.getElementById('session-duration').value = this.dataset.dur;
        overlay.querySelectorAll('.preset-dur').forEach(function(b) { b.classList.remove('btn-primary'); });
        this.classList.add('btn-primary');
      });
    });

    overlay.querySelector('#save-session').addEventListener('click', function() {
      var habitSelect = document.getElementById('session-habit');
      var habitId = habitSelect ? habitSelect.value : null;
      var duration = parseInt(document.getElementById('session-duration').value) || 10;
      var type = document.getElementById('session-type').value;
      var note = document.getElementById('session-note').value;

      if (habitId) {
        App.Store.addCompletion(habitId, App.Utils.today(), {
          done: true,
          value: duration,
          note: note,
          meta: { type: type }
        });
      }

      App.App.closeModal();
      App.App.refreshView();
    });
  },

  showAddHabitModal: function() {
    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Habit Name</label>' +
      '<input type="text" class="form-input" id="habit-name" placeholder="e.g., Morning Meditation">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Daily Target (minutes)</label>' +
      '<input type="number" class="form-input" id="habit-target" value="10" min="1">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Frequency</label>' +
      '<select class="form-select" id="habit-frequency">' +
        '<option value="daily">Daily</option>' +
        '<option value="weekdays">Weekdays</option>' +
      '</select>' +
    '</div>';

    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-habit" style="background:var(--color-meditation);border-color:var(--color-meditation)">Add Habit</button>';

    var overlay = App.App.showModal('Add Meditation Habit', bodyHtml, footerHtml);

    overlay.querySelector('#save-habit').addEventListener('click', function() {
      var name = document.getElementById('habit-name').value.trim();
      if (!name) { alert('Please enter a habit name.'); return; }

      App.Store.addHabit({
        area: 'meditation',
        name: name,
        frequency: document.getElementById('habit-frequency').value,
        target: {
          value: parseInt(document.getElementById('habit-target').value) || 10,
          unit: 'minutes'
        }
      });

      App.App.closeModal();
      App.App.refreshView();
    });
  },

  renderCharts: function() {
    var habits = App.Store.getHabits('meditation');
    var completions = App.Store.getCompletions();

    // Weekly bar chart
    var last7 = App.Utils.getLastNDays(7);
    var labels = last7.map(function(d) { return App.Utils.formatDayName(d); });
    var values = last7.map(function(d) {
      var dayData = completions[d] || {};
      var done = 0;
      for (var i = 0; i < habits.length; i++) {
        if (dayData[habits[i].id] && dayData[habits[i].id].done) done++;
      }
      return habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
    });

    App.Charts.weeklyBar('meditation-weekly-chart', { labels: labels, values: values }, '#8B6FD0');

    // 30-day trend
    var last30 = App.Utils.getLastNDays(30);
    var trendLabels = last30.map(function(d, i) {
      return i % 5 === 0 ? App.Utils.formatShort(d) : '';
    });
    var trendValues = last30.map(function(d) {
      var dayData = completions[d] || {};
      var totalMin = 0;
      for (var i = 0; i < habits.length; i++) {
        var entry = dayData[habits[i].id];
        if (entry && entry.done && entry.value) {
          totalMin += entry.value;
        }
      }
      return totalMin;
    });

    App.Charts.trendLine('meditation-trend-chart', { labels: trendLabels, values: trendValues, unit: 'min' }, '#8B6FD0');
  }
};
