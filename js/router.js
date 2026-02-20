window.App = window.App || {};

App.Router = {
  routes: {
    '': 'dashboard',
    '#dashboard': 'dashboard',
    '#sports': 'sports',
    '#meditation': 'meditation',
    '#reading': 'reading',
    '#social': 'social',
    '#business': 'business',
    '#life-tasks': 'lifeTasks',
    '#work-tasks': 'workTasks',
    '#settings': 'settings'
  },

  viewMap: {
    dashboard: 'Dashboard',
    sports: 'Sports',
    meditation: 'Meditation',
    reading: 'Reading',
    social: 'Social',
    business: 'Business',
    lifeTasks: 'LifeTasks',
    workTasks: 'WorkTasks',
    settings: 'Settings'
  },

  currentView: null,

  init: function() {
    var self = this;
    window.addEventListener('hashchange', function() { self.route(); });
    this.route();
  },

  route: function() {
    var hash = window.location.hash || '';
    var viewName = this.routes[hash] || 'dashboard';
    this.render(viewName);
    this.updateActiveTab(hash || '#dashboard');
  },

  render: function(viewName) {
    var container = document.getElementById('main-content');
    var moduleName = this.viewMap[viewName];

    if (!moduleName || !App[moduleName]) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">View not found</div></div>';
      return;
    }

    this.currentView = viewName;

    // Fade out, swap, fade in
    container.classList.add('fade-out');
    setTimeout(function() {
      container.innerHTML = App[moduleName].render();
      if (App[moduleName].init) {
        App[moduleName].init();
      }
      container.classList.remove('fade-out');
    }, 150);
  },

  updateActiveTab: function(hash) {
    var tabs = document.querySelectorAll('.nav-tab');
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      if (tab.getAttribute('href') === hash) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    }
  },

  navigate: function(hash) {
    window.location.hash = hash;
  }
};
