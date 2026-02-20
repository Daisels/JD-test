window.App = window.App || {};

App.Reading = {
  render: function() {
    var today = App.Utils.today();
    var habits = App.Store.getHabits('reading');
    var completions = App.Store.getCompletions();
    var todayCompletions = completions[today] || {};
    var books = App.Store.getReadingItems();

    var currentlyReading = books.filter(function(b) { return b.status === 'reading'; });
    var toRead = books.filter(function(b) { return b.status === 'to-read'; });
    var finished = books.filter(function(b) { return b.status === 'finished'; });

    var html = '<div class="area-view" data-area="reading">';

    // Header
    html += '<div class="area-header">' +
      '<h2><span class="area-header-dot" style="background:var(--color-reading)"></span> Reading</h2>' +
      '<div class="flex gap-3">' +
        '<button class="btn btn-primary" data-action="add-book" style="background:var(--color-reading);border-color:var(--color-reading)">' + App.Utils.icon('plus') + ' Add Book</button>' +
        '<button class="btn" data-action="add-habit">' + App.Utils.icon('plus') + ' Add Habit</button>' +
      '</div>' +
    '</div>';

    // Stats
    var currentStreak = 0;
    var bestStreak = 0;
    for (var i = 0; i < habits.length; i++) {
      var s = App.Utils.calculateStreak(habits[i].id, completions);
      if (s > currentStreak) currentStreak = s;
      var bs = App.Utils.calculateBestStreak(habits[i].id, completions);
      if (bs > bestStreak) bestStreak = bs;
    }

    html += '<div class="stats-row">' +
      '<div class="stat-box">' +
        '<div class="streak"><span class="streak-fire">' + App.Utils.icon('fire') + '</span></div>' +
        '<div class="stat-value" style="color:var(--color-reading)">' + currentStreak + '</div>' +
        '<div class="stat-label">Reading Streak</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + finished.length + '</div>' +
        '<div class="stat-label">Books Finished</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + currentlyReading.length + '</div>' +
        '<div class="stat-label">Currently Reading</div>' +
      '</div>' +
    '</div>';

    // Today's habits
    if (habits.length > 0) {
      html += '<div class="section">';
      html += '<div class="section-title">Today\'s Reading</div>';
      html += '<div class="list">';
      for (var k = 0; k < habits.length; k++) {
        var habit = habits[k];
        var isComplete = todayCompletions[habit.id] && todayCompletions[habit.id].done;
        var streak = App.Utils.calculateStreak(habit.id, completions);
        var completionData = todayCompletions[habit.id];
        var valueDisplay = '';
        if (completionData && completionData.value) {
          valueDisplay = completionData.value + (habit.target && habit.target.unit ? ' ' + habit.target.unit : ' pages');
        }

        html += '<div class="habit-check' + (isComplete ? ' completed' : '') + '" data-action="toggle-habit" data-habit-id="' + habit.id + '" style="--accent-color:var(--color-reading)">' +
          '<div class="habit-check-box">' + App.Utils.icon('check') + '</div>' +
          '<div class="habit-check-info">' +
            '<div class="habit-check-name">' + App.Utils.escapeHtml(habit.name) + '</div>' +
            '<div class="habit-check-meta">' +
              (habit.target ? habit.target.value + ' ' + (habit.target.unit || 'pages') + ' goal' : '') +
              (valueDisplay ? ' &middot; ' + valueDisplay + ' logged' : '') +
            '</div>' +
          '</div>' +
          (streak > 0 ? '<div class="habit-check-streak">' + streak + 'd</div>' : '') +
        '</div>';
      }
      html += '</div></div>';
    }

    // Currently Reading
    html += '<div class="section">';
    html += '<div class="section-title">Currently Reading</div>';
    if (currentlyReading.length === 0) {
      html += '<div class="empty-state" style="padding:var(--sp-6)"><div class="empty-state-text">No books in progress. Add a book to get started.</div></div>';
    } else {
      html += '<div class="list">';
      for (var m = 0; m < currentlyReading.length; m++) {
        html += this.renderBookItem(currentlyReading[m]);
      }
      html += '</div>';
    }
    html += '</div>';

    // To Read
    if (toRead.length > 0) {
      html += '<div class="section">';
      html += '<div class="section-title">To Read (' + toRead.length + ')</div>';
      html += '<div class="list">';
      for (var n = 0; n < toRead.length; n++) {
        html += this.renderBookItem(toRead[n]);
      }
      html += '</div></div>';
    }

    // Finished
    if (finished.length > 0) {
      html += '<div class="section">';
      html += '<div class="section-title">Finished (' + finished.length + ')</div>';
      html += '<div class="list">';
      for (var p = 0; p < finished.length; p++) {
        html += this.renderBookItem(finished[p]);
      }
      html += '</div></div>';
    }

    // Charts
    html += '<div class="card">' +
      '<div class="card-header"><span class="card-title">Last 7 Days</span></div>' +
      '<div class="chart-container" style="height:200px">' +
        '<canvas id="reading-weekly-chart"></canvas>' +
      '</div>' +
    '</div>';

    html += '</div>';
    return html;
  },

  renderBookItem: function(book) {
    var pct = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
    var stars = '';
    if (book.status === 'finished' && book.rating) {
      stars = '<div class="stars">';
      for (var s = 1; s <= 5; s++) {
        stars += '<span class="star' + (s <= book.rating ? ' filled' : '') + '">&#9733;</span>';
      }
      stars += '</div>';
    }

    return '<div class="book-item" data-action="edit-book" data-book-id="' + book.id + '">' +
      '<div class="book-cover">' + App.Utils.icon('reading') + '</div>' +
      '<div class="book-info">' +
        '<div class="book-title">' + App.Utils.escapeHtml(book.title) + '</div>' +
        '<div class="book-author">' + App.Utils.escapeHtml(book.author || '') +
          (book.type === 'article' ? ' &middot; Article' : '') +
        '</div>' +
        (book.status === 'reading' ? '<div class="book-progress">' +
          '<div class="book-progress-text">' + book.currentPage + '/' + book.totalPages + ' pages (' + pct + '%)</div>' +
          '<div class="progress-bar"><div class="progress-bar-fill" style="width:' + pct + '%;background:var(--color-reading)"></div></div>' +
        '</div>' : '') +
        stars +
      '</div>' +
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

      if (action === 'toggle-habit') {
        App.Store.toggleCompletion(target.dataset.habitId, App.Utils.today());
        App.App.refreshView();
      }

      if (action === 'add-book') {
        self.showAddBookModal();
      }

      if (action === 'add-habit') {
        self.showAddHabitModal();
      }

      if (action === 'edit-book') {
        self.showEditBookModal(target.dataset.bookId);
      }
    });

    this.renderCharts();
  },

  showAddBookModal: function() {
    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Title</label>' +
      '<input type="text" class="form-input" id="book-title" placeholder="Book title">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Author</label>' +
      '<input type="text" class="form-input" id="book-author" placeholder="Author name">' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label class="form-label">Type</label>' +
        '<select class="form-select" id="book-type">' +
          '<option value="book">Book</option>' +
          '<option value="article">Article</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Total Pages</label>' +
        '<input type="number" class="form-input" id="book-pages" value="300" min="1">' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Status</label>' +
      '<select class="form-select" id="book-status">' +
        '<option value="to-read">To Read</option>' +
        '<option value="reading">Currently Reading</option>' +
        '<option value="finished">Finished</option>' +
      '</select>' +
    '</div>';

    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-book" style="background:var(--color-reading);border-color:var(--color-reading)">Add Book</button>';

    var overlay = App.App.showModal('Add Book', bodyHtml, footerHtml);

    overlay.querySelector('#save-book').addEventListener('click', function() {
      var title = document.getElementById('book-title').value.trim();
      if (!title) { alert('Please enter a title.'); return; }

      App.Store.addReadingItem({
        title: title,
        author: document.getElementById('book-author').value.trim(),
        type: document.getElementById('book-type').value,
        totalPages: parseInt(document.getElementById('book-pages').value) || 300,
        currentPage: 0,
        status: document.getElementById('book-status').value,
        startDate: null,
        finishDate: null,
        rating: null,
        notes: ''
      });

      App.App.closeModal();
      App.App.refreshView();
    });
  },

  showEditBookModal: function(bookId) {
    var books = App.Store.getReadingItems();
    var book = null;
    for (var i = 0; i < books.length; i++) {
      if (books[i].id === bookId) { book = books[i]; break; }
    }
    if (!book) return;

    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Title</label>' +
      '<input type="text" class="form-input" id="book-title" value="' + App.Utils.escapeHtml(book.title) + '">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Author</label>' +
      '<input type="text" class="form-input" id="book-author" value="' + App.Utils.escapeHtml(book.author || '') + '">' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label class="form-label">Current Page</label>' +
        '<input type="number" class="form-input" id="book-current" value="' + (book.currentPage || 0) + '" min="0">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Total Pages</label>' +
        '<input type="number" class="form-input" id="book-pages" value="' + (book.totalPages || 300) + '" min="1">' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Status</label>' +
      '<select class="form-select" id="book-status">' +
        '<option value="to-read"' + (book.status === 'to-read' ? ' selected' : '') + '>To Read</option>' +
        '<option value="reading"' + (book.status === 'reading' ? ' selected' : '') + '>Currently Reading</option>' +
        '<option value="finished"' + (book.status === 'finished' ? ' selected' : '') + '>Finished</option>' +
      '</select>' +
    '</div>' +
    (book.status === 'finished' ? '<div class="form-group">' +
      '<label class="form-label">Rating</label>' +
      '<select class="form-select" id="book-rating">' +
        '<option value="">No rating</option>' +
        '<option value="1"' + (book.rating === 1 ? ' selected' : '') + '>1 star</option>' +
        '<option value="2"' + (book.rating === 2 ? ' selected' : '') + '>2 stars</option>' +
        '<option value="3"' + (book.rating === 3 ? ' selected' : '') + '>3 stars</option>' +
        '<option value="4"' + (book.rating === 4 ? ' selected' : '') + '>4 stars</option>' +
        '<option value="5"' + (book.rating === 5 ? ' selected' : '') + '>5 stars</option>' +
      '</select>' +
    '</div>' : '');

    var footerHtml = '<button class="btn btn-danger" id="delete-book">' + App.Utils.icon('trash') + ' Delete</button>' +
      '<div class="flex-1"></div>' +
      '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-book" style="background:var(--color-reading);border-color:var(--color-reading)">Save</button>';

    var overlay = App.App.showModal('Edit Book', bodyHtml, footerHtml);

    overlay.querySelector('#save-book').addEventListener('click', function() {
      var status = document.getElementById('book-status').value;
      var ratingEl = document.getElementById('book-rating');
      var updates = {
        title: document.getElementById('book-title').value.trim(),
        author: document.getElementById('book-author').value.trim(),
        currentPage: parseInt(document.getElementById('book-current').value) || 0,
        totalPages: parseInt(document.getElementById('book-pages').value) || 300,
        status: status,
        rating: ratingEl ? (parseInt(ratingEl.value) || null) : book.rating
      };

      if (status === 'reading' && !book.startDate) {
        updates.startDate = App.Utils.today();
      }
      if (status === 'finished' && !book.finishDate) {
        updates.finishDate = App.Utils.today();
      }

      App.Store.updateReadingItem(bookId, updates);
      App.App.closeModal();
      App.App.refreshView();
    });

    overlay.querySelector('#delete-book').addEventListener('click', function() {
      App.App.confirm('Delete this book?', function() {
        App.Store.deleteReadingItem(bookId);
        App.App.closeModal();
        App.App.refreshView();
      });
    });
  },

  showAddHabitModal: function() {
    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Habit Name</label>' +
      '<input type="text" class="form-input" id="habit-name" placeholder="e.g., Daily Reading">' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label class="form-label">Target</label>' +
        '<input type="number" class="form-input" id="habit-target" value="30" min="1">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Unit</label>' +
        '<select class="form-select" id="habit-unit">' +
          '<option value="pages">Pages</option>' +
          '<option value="minutes">Minutes</option>' +
        '</select>' +
      '</div>' +
    '</div>';

    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-habit" style="background:var(--color-reading);border-color:var(--color-reading)">Add Habit</button>';

    var overlay = App.App.showModal('Add Reading Habit', bodyHtml, footerHtml);

    overlay.querySelector('#save-habit').addEventListener('click', function() {
      var name = document.getElementById('habit-name').value.trim();
      if (!name) { alert('Please enter a habit name.'); return; }

      App.Store.addHabit({
        area: 'reading',
        name: name,
        frequency: 'daily',
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
    var habits = App.Store.getHabits('reading');
    var completions = App.Store.getCompletions();

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

    App.Charts.weeklyBar('reading-weekly-chart', { labels: labels, values: values }, '#2D9CDB');
  }
};
