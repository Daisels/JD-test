window.App = window.App || {};

App.Sports = {
  workoutTypes: ['Running', 'Gym', 'Cycling', 'Swimming', 'Yoga', 'Walking', 'HIIT', 'Other'],
  intensityLevels: ['Light', 'Moderate', 'Hard'],

  render: function() {
    var today = App.Utils.today();
    var habits = App.Store.getHabits('sports');
    var completions = App.Store.getCompletions();
    var todayCompletions = completions[today] || {};

    var html = '<div class="area-view" data-area="sports">';

    // Header
    html += '<div class="area-header">' +
      '<h2><span class="area-header-dot" style="background:var(--color-sports)"></span> Sports & Fitness</h2>' +
      '<div class="flex gap-3">' +
        '<button class="btn btn-primary" data-action="log-workout">' + App.Utils.icon('plus') + ' Log Workout</button>' +
        '<button class="btn" data-action="add-habit">' + App.Utils.icon('plus') + ' Add Habit</button>' +
      '</div>' +
    '</div>';

    // Stats
    var totalStreak = 0;
    var bestStreak = 0;
    for (var i = 0; i < habits.length; i++) {
      var s = App.Utils.calculateStreak(habits[i].id, completions);
      if (s > totalStreak) totalStreak = s;
      var bs = App.Utils.calculateBestStreak(habits[i].id, completions);
      if (bs > bestStreak) bestStreak = bs;
    }

    // Count this week's completions
    var settings = App.Store.getSettings();
    var weekDates = App.Utils.getWeekDates(today, settings.weekStartsOn);
    var weekSessions = 0;
    for (var d = 0; d < weekDates.length; d++) {
      var dayData = completions[weekDates[d]] || {};
      for (var j = 0; j < habits.length; j++) {
        if (dayData[habits[j].id] && dayData[habits[j].id].done) weekSessions++;
      }
    }

    html += '<div class="stats-row">' +
      '<div class="stat-box">' +
        '<div class="streak"><span class="streak-fire">' + App.Utils.icon('fire') + '</span></div>' +
        '<div class="stat-value" style="color:var(--color-sports)">' + totalStreak + '</div>' +
        '<div class="stat-label">Current Streak</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + bestStreak + '</div>' +
        '<div class="stat-label">Best Streak</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + weekSessions + '</div>' +
        '<div class="stat-label">This Week</div>' +
      '</div>' +
    '</div>';

    // Today's habits
    html += '<div class="section">';
    html += '<div class="section-title">Today\'s Habits</div>';

    if (habits.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-text">No habits yet. Add a habit or log a workout to get started.</div></div>';
    } else {
      html += '<div class="list">';
      for (var k = 0; k < habits.length; k++) {
        var habit = habits[k];
        var isComplete = todayCompletions[habit.id] && todayCompletions[habit.id].done;
        var streak = App.Utils.calculateStreak(habit.id, completions);
        var completionData = todayCompletions[habit.id];
        var valueDisplay = '';
        if (completionData && completionData.value) {
          valueDisplay = completionData.value + (habit.target && habit.target.unit ? ' ' + habit.target.unit : ' min');
        }

        html += '<div class="habit-check' + (isComplete ? ' completed' : '') + '" data-action="toggle-habit" data-habit-id="' + habit.id + '" style="--accent-color:var(--color-sports)">' +
          '<div class="habit-check-box">' + App.Utils.icon('check') + '</div>' +
          '<div class="habit-check-info">' +
            '<div class="habit-check-name">' + App.Utils.escapeHtml(habit.name) + '</div>' +
            '<div class="habit-check-meta">' +
              (habit.target ? habit.target.value + ' ' + (habit.target.unit || 'min') + ' goal' : '') +
              (valueDisplay ? ' &middot; ' + valueDisplay + ' logged' : '') +
            '</div>' +
          '</div>' +
          (streak > 0 ? '<div class="habit-check-streak">' + streak + 'd</div>' : '') +
        '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    // Chart section
    html += '<div class="area-columns">' +
      '<div class="card">' +
        '<div class="card-header"><span class="card-title">Last 7 Days</span></div>' +
        '<div class="chart-container" style="height:200px">' +
          '<canvas id="sports-weekly-chart"></canvas>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-header"><span class="card-title">30-Day Trend</span></div>' +
        '<div class="chart-container" style="height:200px">' +
          '<canvas id="sports-trend-chart"></canvas>' +
        '</div>' +
      '</div>' +
    '</div>';

    html += '</div>';
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

      if (action === 'toggle-habit') {
        var habitId = target.dataset.habitId;
        App.Store.toggleCompletion(habitId, App.Utils.today());
        App.App.refreshView();
      }

      if (action === 'log-workout') {
        self.showLogWorkoutModal();
      }

      if (action === 'add-habit') {
        self.showAddHabitModal();
      }
    });

    this.renderCharts();
  },

  showLogWorkoutModal: function() {
    var habits = App.Store.getHabits('sports');
    var habitOptions = '';
    for (var i = 0; i < habits.length; i++) {
      habitOptions += '<option value="' + habits[i].id + '">' + App.Utils.escapeHtml(habits[i].name) + '</option>';
    }

    var typeOptions = '';
    for (var j = 0; j < this.workoutTypes.length; j++) {
      typeOptions += '<option value="' + this.workoutTypes[j].toLowerCase() + '">' + this.workoutTypes[j] + '</option>';
    }

    var intensityOptions = '';
    for (var k = 0; k < this.intensityLevels.length; k++) {
      intensityOptions += '<option value="' + this.intensityLevels[k].toLowerCase() + '">' + this.intensityLevels[k] + '</option>';
    }

    var bodyHtml = '';
    if (habits.length > 0) {
      bodyHtml += '<div class="form-group">' +
        '<label class="form-label">Habit</label>' +
        '<select class="form-select" id="workout-habit">' + habitOptions + '</select>' +
      '</div>';
    }

    bodyHtml += '<div class="form-group">' +
        '<label class="form-label">Type</label>' +
        '<select class="form-select" id="workout-type">' + typeOptions + '</select>' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label">Duration (min)</label>' +
          '<input type="number" class="form-input" id="workout-duration" value="30" min="1">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Intensity</label>' +
          '<select class="form-select" id="workout-intensity">' + intensityOptions + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Note (optional)</label>' +
        '<input type="text" class="form-input" id="workout-note" placeholder="How did it go?">' +
      '</div>';

    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-workout">Save Workout</button>';

    var overlay = App.App.showModal('Log Workout', bodyHtml, footerHtml);

    overlay.querySelector('#save-workout').addEventListener('click', function() {
      var habitSelect = document.getElementById('workout-habit');
      var habitId = habitSelect ? habitSelect.value : null;
      var type = document.getElementById('workout-type').value;
      var duration = parseInt(document.getElementById('workout-duration').value) || 30;
      var intensity = document.getElementById('workout-intensity').value;
      var note = document.getElementById('workout-note').value;

      if (habitId) {
        App.Store.addCompletion(habitId, App.Utils.today(), {
          done: true,
          value: duration,
          note: note,
          meta: { type: type, intensity: intensity }
        });
      }

      App.App.closeModal();
      App.App.refreshView();
    });
  },

  showAddHabitModal: function() {
    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Habit Name</label>' +
      '<input type="text" class="form-input" id="habit-name" placeholder="e.g., Morning Run">' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label class="form-label">Target</label>' +
        '<input type="number" class="form-input" id="habit-target" value="30" min="1">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Unit</label>' +
        '<select class="form-select" id="habit-unit">' +
          '<option value="minutes">Minutes</option>' +
          '<option value="sessions">Sessions</option>' +
          '<option value="km">Kilometers</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Frequency</label>' +
      '<select class="form-select" id="habit-frequency">' +
        '<option value="daily">Daily</option>' +
        '<option value="weekdays">Weekdays</option>' +
        '<option value="weekly">Weekly</option>' +
      '</select>' +
    '</div>';

    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-habit">Add Habit</button>';

    var overlay = App.App.showModal('Add Sports Habit', bodyHtml, footerHtml);

    overlay.querySelector('#save-habit').addEventListener('click', function() {
      var name = document.getElementById('habit-name').value.trim();
      if (!name) { alert('Please enter a habit name.'); return; }

      App.Store.addHabit({
        area: 'sports',
        name: name,
        frequency: document.getElementById('habit-frequency').value,
        target: {
          value: parseInt(document.getElementById('habit-target').value) || 30,
          unit: document.getElementById('habit-unit').value
        }
      });

      App.App.closeModal();
      App.App.refreshView();
    });
  },

  renderCharts: function() {
    var habits = App.Store.getHabits('sports');
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

    App.Charts.weeklyBar('sports-weekly-chart', { labels: labels, values: values }, '#E85D3A');

    // 30-day trend line (total minutes per day)
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

    App.Charts.trendLine('sports-trend-chart', { labels: trendLabels, values: trendValues, unit: 'min' }, '#E85D3A');
  }
};
