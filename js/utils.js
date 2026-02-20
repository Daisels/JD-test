window.App = window.App || {};

App.Utils = {
  // Date helpers
  today: function() {
    return new Date().toISOString().split('T')[0];
  },

  now: function() {
    return new Date().toISOString();
  },

  formatDisplay: function(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  },

  formatShort: function(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate();
  },

  formatDayName: function(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return days[d.getDay()];
  },

  daysBetween: function(dateStr1, dateStr2) {
    var d1 = new Date(dateStr1 + 'T00:00:00');
    var d2 = new Date(dateStr2 + 'T00:00:00');
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  },

  addDays: function(dateStr, n) {
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  },

  getWeekDates: function(dateStr, weekStartsOn) {
    weekStartsOn = weekStartsOn || 1; // Monday default
    var d = new Date(dateStr + 'T00:00:00');
    var day = d.getDay();
    var diff = (day - weekStartsOn + 7) % 7;
    var start = this.addDays(dateStr, -diff);
    var dates = [];
    for (var i = 0; i < 7; i++) {
      dates.push(this.addDays(start, i));
    }
    return dates;
  },

  getDayOfWeek: function(dateStr) {
    return new Date(dateStr + 'T00:00:00').getDay();
  },

  getMonthDates: function(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var year = d.getFullYear();
    var month = d.getMonth();
    var first = new Date(year, month, 1);
    var last = new Date(year, month + 1, 0);
    var dates = [];
    for (var i = 1; i <= last.getDate(); i++) {
      var dd = new Date(year, month, i);
      dates.push(dd.toISOString().split('T')[0]);
    }
    return dates;
  },

  getLastNDays: function(n) {
    var dates = [];
    var today = this.today();
    for (var i = n - 1; i >= 0; i--) {
      dates.push(this.addDays(today, -i));
    }
    return dates;
  },

  isToday: function(dateStr) {
    return dateStr === this.today();
  },

  isPast: function(dateStr) {
    return dateStr < this.today();
  },

  // ID generation
  generateId: function(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  // Streak calculation
  calculateStreak: function(habitId, completions) {
    var today = this.today();
    var streak = 0;
    var date = today;

    // Check if today is complete; if not, start from yesterday
    var todayData = completions[today];
    if (!todayData || !todayData[habitId] || !todayData[habitId].done) {
      date = this.addDays(today, -1);
    }

    while (true) {
      var dayData = completions[date];
      if (dayData && dayData[habitId] && dayData[habitId].done) {
        streak++;
        date = this.addDays(date, -1);
      } else {
        break;
      }
    }
    return streak;
  },

  calculateBestStreak: function(habitId, completions) {
    var dates = Object.keys(completions).sort();
    if (dates.length === 0) return 0;

    var best = 0;
    var current = 0;
    var expectedDate = dates[0];

    for (var i = 0; i < dates.length; i++) {
      var date = dates[i];
      var dayData = completions[date];
      if (dayData && dayData[habitId] && dayData[habitId].done) {
        if (date === expectedDate) {
          current++;
        } else {
          current = 1;
        }
        if (current > best) best = current;
        expectedDate = this.addDays(date, 1);
      } else {
        current = 0;
        expectedDate = this.addDays(date, 1);
      }
    }
    return best;
  },

  // Completion rate for a habit over last N days
  completionRate: function(habitId, completions, days) {
    var dates = this.getLastNDays(days);
    var completed = 0;
    for (var i = 0; i < dates.length; i++) {
      var dayData = completions[dates[i]];
      if (dayData && dayData[habitId] && dayData[habitId].done) {
        completed++;
      }
    }
    return days > 0 ? completed / days : 0;
  },

  // Escape HTML for safe rendering
  escapeHtml: function(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // SVG icons (inline, no external dependency)
  icons: {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    sports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="12" y1="2" x2="12" y2="2"/></svg>',
    meditation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    reading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    business: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    lifeTasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    workTasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.87 0-7-3.13-7-7 0-2.38 1.19-4.47 3-5.74C8 10.26 8 10.13 8 10c0-2.21 1.79-4 4-4 .34 0 .67.04 1 .12C11.4 4.56 10.47 3 10.47 3S14 4.34 16 8c.72 1.31 1 2.62 1 4 0 .13 0 .26-.01.39C18.81 13.53 20 15.62 20 18c0 3.87-3.13 5-8 5zm0-18s-3 2.5-3 6c0 1.1.9 2 2 2s2-.9 2-2c0-1.5-.5-3-1-4 1 1.5 2 3.5 2 6 0 2.76-2.24 5-5 5s-5-2.24-5-5c0-2 1.12-3.74 2.76-4.62C5.28 9.6 5 10.78 5 12c0 3.87 3.13 7 7 7s7-3.13 7-7c0-3-1.5-5.5-3-7-.5 1-1.5 2-2 2z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
  },

  // Area metadata
  areas: {
    sports: { name: 'Sports', icon: 'sports', color: 'var(--color-sports)' },
    meditation: { name: 'Meditation', icon: 'meditation', color: 'var(--color-meditation)' },
    reading: { name: 'Reading', icon: 'reading', color: 'var(--color-reading)' },
    social: { name: 'Social', icon: 'social', color: 'var(--color-social)' },
    business: { name: 'Business', icon: 'business', color: 'var(--color-business)' },
    'life-tasks': { name: 'Life Tasks', icon: 'lifeTasks', color: 'var(--color-life-tasks)' },
    'work-tasks': { name: 'Work Tasks', icon: 'workTasks', color: 'var(--color-work-tasks)' }
  },

  // Render an icon
  icon: function(name, className) {
    var svg = this.icons[name] || '';
    if (className) {
      svg = svg.replace('<svg', '<svg class="' + className + '"');
    }
    return svg;
  }
};
