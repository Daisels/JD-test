window.App = window.App || {};

App.App = {
  init: function() {
    // Initialize store
    App.Store.init();

    // Apply theme
    var settings = App.Store.getSettings();
    if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Render nav
    this.renderNav();

    // Initialize router
    App.Router.init();

    // Global modal close on overlay click
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal-overlay')) {
        App.App.closeModal();
      }
    });

    // Global escape key to close modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        App.App.closeModal();
      }
    });
  },

  renderNav: function() {
    var today = App.Utils.today();
    var navTop = document.querySelector('.nav-top');
    var navTabs = document.querySelector('.nav-tabs');

    // Update date display
    var dateEl = document.querySelector('.nav-date');
    if (dateEl) {
      dateEl.textContent = App.Utils.formatDisplay(today);
    }

    // Render tabs
    var tabs = [
      { hash: '#dashboard', label: 'Dashboard', area: null, icon: 'dashboard' },
      { hash: '#sports', label: 'Sports', area: 'sports' },
      { hash: '#meditation', label: 'Meditation', area: 'meditation' },
      { hash: '#reading', label: 'Reading', area: 'reading' },
      { hash: '#social', label: 'Social', area: 'social' },
      { hash: '#business', label: 'Business', area: 'business' },
      { hash: '#life-tasks', label: 'Life Tasks', area: 'life-tasks' },
      { hash: '#work-tasks', label: 'Work Tasks', area: 'work-tasks' }
    ];

    var html = '';
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var areaAttr = tab.area ? ' data-area="' + tab.area + '"' : '';
      var dot = tab.area ? '<span class="nav-tab-dot"></span>' : '';
      html += '<a class="nav-tab" href="' + tab.hash + '"' + areaAttr + '>' + dot + tab.label + '</a>';
    }
    navTabs.innerHTML = html;
  },

  // Modal management
  showModal: function(title, bodyHtml, footerHtml) {
    // Remove existing modal
    this.closeModal();

    var html = '<div class="modal-overlay">' +
      '<div class="modal">' +
        '<div class="modal-header">' +
          '<h3 class="modal-title">' + App.Utils.escapeHtml(title) + '</h3>' +
          '<button class="modal-close" data-action="close-modal">&times;</button>' +
        '</div>' +
        '<div class="modal-body">' + bodyHtml + '</div>' +
        (footerHtml ? '<div class="modal-footer">' + footerHtml + '</div>' : '') +
      '</div>' +
    '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    var overlay = document.querySelector('.modal-overlay');
    // Trigger reflow for animation
    overlay.offsetHeight;
    overlay.classList.add('visible');

    // Close button
    overlay.querySelector('.modal-close').addEventListener('click', function() {
      App.App.closeModal();
    });

    return overlay;
  },

  closeModal: function() {
    var overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(function() {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 150);
    }
  },

  // Confirmation dialog
  confirm: function(message, onConfirm) {
    var bodyHtml = '<p>' + App.Utils.escapeHtml(message) + '</p>';
    var footerHtml = '<button class="btn" data-action="cancel-confirm">Cancel</button>' +
      '<button class="btn btn-danger" data-action="do-confirm">Confirm</button>';

    var overlay = this.showModal('Confirm', bodyHtml, footerHtml);

    overlay.querySelector('[data-action="cancel-confirm"]').addEventListener('click', function() {
      App.App.closeModal();
    });

    overlay.querySelector('[data-action="do-confirm"]').addEventListener('click', function() {
      App.App.closeModal();
      if (onConfirm) onConfirm();
    });
  },

  // Refresh current view
  refreshView: function() {
    if (App.Router.currentView) {
      App.Router.render(App.Router.currentView);
    }
  }
};

// Settings module
App.Settings = {
  render: function() {
    var settings = App.Store.getSettings();
    var isDark = settings.theme === 'dark';

    return '<div class="area-view">' +
      '<div class="area-header"><h2>Settings</h2></div>' +

      '<div class="card">' +
        '<div class="card-header"><span class="card-title">Appearance</span></div>' +
        '<div class="form-group">' +
          '<label class="form-label">Theme</label>' +
          '<div class="flex gap-3">' +
            '<button class="btn' + (!isDark ? ' btn-primary' : '') + '" data-action="set-theme" data-theme="light">Light</button>' +
            '<button class="btn' + (isDark ? ' btn-primary' : '') + '" data-action="set-theme" data-theme="dark">Dark</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-header"><span class="card-title">Week Starts On</span></div>' +
        '<div class="form-group">' +
          '<select class="form-select" data-action="set-week-start">' +
            '<option value="0"' + (settings.weekStartsOn === 0 ? ' selected' : '') + '>Sunday</option>' +
            '<option value="1"' + (settings.weekStartsOn === 1 ? ' selected' : '') + '>Monday</option>' +
          '</select>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-header"><span class="card-title">Data Management</span></div>' +
        '<div class="flex gap-3" style="flex-wrap:wrap">' +
          '<button class="btn" data-action="export-data">' + App.Utils.icon('download') + ' Export Data</button>' +
          '<label class="btn" style="cursor:pointer">' + App.Utils.icon('upload') + ' Import Data<input type="file" accept=".json" data-action="import-data" style="display:none"></label>' +
          '<button class="btn btn-danger" data-action="clear-data">' + App.Utils.icon('trash') + ' Clear All Data</button>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-header"><span class="card-title">About</span></div>' +
        '<p class="text-sm text-secondary">Lifestyle Tracker v1.0</p>' +
        '<p class="text-sm text-muted mt-2">Data stored locally in your browser. Export regularly to back up.</p>' +
      '</div>' +
    '</div>';
  },

  init: function() {
    var view = document.querySelector('.area-view');
    if (!view) return;

    view.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;

      var action = btn.dataset.action;

      if (action === 'set-theme') {
        var theme = btn.dataset.theme;
        var settings = App.Store.getSettings();
        settings.theme = theme;
        App.Store.saveSettings(settings);
        if (theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        App.App.refreshView();
      }

      if (action === 'export-data') {
        App.Store.exportAll();
      }

      if (action === 'clear-data') {
        App.App.confirm('This will permanently delete all your data. Are you sure?', function() {
          App.Store.clearAll();
          App.App.refreshView();
        });
      }
    });

    // Week start change
    var weekSelect = view.querySelector('[data-action="set-week-start"]');
    if (weekSelect) {
      weekSelect.addEventListener('change', function() {
        var settings = App.Store.getSettings();
        settings.weekStartsOn = parseInt(this.value);
        App.Store.saveSettings(settings);
      });
    }

    // Import file
    var importInput = view.querySelector('[data-action="import-data"]');
    if (importInput) {
      importInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          App.App.confirm('This will overwrite all current data. Continue?', function() {
            if (App.Store.importAll(ev.target.result)) {
              alert('Data imported successfully!');
              App.App.refreshView();
            }
          });
        };
        reader.readAsText(file);
      });
    }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', function() {
  App.App.init();
});
