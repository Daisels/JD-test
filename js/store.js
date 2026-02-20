window.App = window.App || {};

App.Store = {
  KEYS: {
    settings: 'ht_settings',
    habits: 'ht_habits',
    completions: 'ht_completions',
    goals: 'ht_goals',
    contacts: 'ht_contacts',
    tasks: 'ht_tasks',
    reading: 'ht_reading'
  },

  SCHEMA_VERSION: 1,

  // Core operations
  get: function(key) {
    try {
      var data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Store.get error for key ' + key, e);
      return null;
    }
  },

  set: function(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Store.set error for key ' + key, e);
      if (e.name === 'QuotaExceededError') {
        alert('Storage is full. Please export and clear old data.');
      }
      return false;
    }
  },

  // Initialize default data if none exists
  init: function() {
    if (!this.get(this.KEYS.settings)) {
      this.set(this.KEYS.settings, {
        version: this.SCHEMA_VERSION,
        theme: 'light',
        weekStartsOn: 1,
        createdAt: App.Utils.today(),
        lastOpened: App.Utils.today()
      });
    }
    if (!this.get(this.KEYS.habits)) this.set(this.KEYS.habits, []);
    if (!this.get(this.KEYS.completions)) this.set(this.KEYS.completions, {});
    if (!this.get(this.KEYS.goals)) this.set(this.KEYS.goals, []);
    if (!this.get(this.KEYS.contacts)) this.set(this.KEYS.contacts, []);
    if (!this.get(this.KEYS.tasks)) this.set(this.KEYS.tasks, []);
    if (!this.get(this.KEYS.reading)) this.set(this.KEYS.reading, []);

    // Update last opened
    var settings = this.getSettings();
    settings.lastOpened = App.Utils.today();
    this.set(this.KEYS.settings, settings);
  },

  // Settings
  getSettings: function() {
    return this.get(this.KEYS.settings) || { theme: 'light', weekStartsOn: 1 };
  },

  saveSettings: function(settings) {
    return this.set(this.KEYS.settings, settings);
  },

  // Habits
  getHabits: function(area) {
    var habits = this.get(this.KEYS.habits) || [];
    if (area) {
      return habits.filter(function(h) { return h.area === area && !h.archived; });
    }
    return habits.filter(function(h) { return !h.archived; });
  },

  getAllHabits: function() {
    return this.get(this.KEYS.habits) || [];
  },

  addHabit: function(habit) {
    var habits = this.get(this.KEYS.habits) || [];
    habit.id = App.Utils.generateId('h');
    habit.createdAt = App.Utils.today();
    habit.archived = false;
    habits.push(habit);
    return this.set(this.KEYS.habits, habits) ? habit : null;
  },

  updateHabit: function(id, updates) {
    var habits = this.get(this.KEYS.habits) || [];
    for (var i = 0; i < habits.length; i++) {
      if (habits[i].id === id) {
        Object.assign(habits[i], updates);
        return this.set(this.KEYS.habits, habits);
      }
    }
    return false;
  },

  deleteHabit: function(id) {
    var habits = this.get(this.KEYS.habits) || [];
    habits = habits.filter(function(h) { return h.id !== id; });
    return this.set(this.KEYS.habits, habits);
  },

  // Completions
  getCompletions: function() {
    return this.get(this.KEYS.completions) || {};
  },

  getCompletionsForDate: function(dateStr) {
    var completions = this.getCompletions();
    return completions[dateStr] || {};
  },

  addCompletion: function(habitId, dateStr, data) {
    var completions = this.getCompletions();
    if (!completions[dateStr]) completions[dateStr] = {};
    completions[dateStr][habitId] = {
      done: data.done !== undefined ? data.done : true,
      value: data.value || null,
      note: data.note || '',
      meta: data.meta || null,
      timestamp: App.Utils.now()
    };
    return this.set(this.KEYS.completions, completions);
  },

  removeCompletion: function(habitId, dateStr) {
    var completions = this.getCompletions();
    if (completions[dateStr]) {
      delete completions[dateStr][habitId];
      if (Object.keys(completions[dateStr]).length === 0) {
        delete completions[dateStr];
      }
      return this.set(this.KEYS.completions, completions);
    }
    return true;
  },

  toggleCompletion: function(habitId, dateStr) {
    var completions = this.getCompletions();
    var dayData = completions[dateStr] || {};
    if (dayData[habitId] && dayData[habitId].done) {
      return this.removeCompletion(habitId, dateStr);
    } else {
      return this.addCompletion(habitId, dateStr, { done: true });
    }
  },

  // Goals
  getGoals: function(area) {
    var goals = this.get(this.KEYS.goals) || [];
    if (area) {
      return goals.filter(function(g) { return g.area === area; });
    }
    return goals;
  },

  addGoal: function(goal) {
    var goals = this.get(this.KEYS.goals) || [];
    goal.id = App.Utils.generateId('g');
    goal.createdAt = App.Utils.today();
    goals.push(goal);
    return this.set(this.KEYS.goals, goals) ? goal : null;
  },

  updateGoal: function(id, updates) {
    var goals = this.get(this.KEYS.goals) || [];
    for (var i = 0; i < goals.length; i++) {
      if (goals[i].id === id) {
        Object.assign(goals[i], updates);
        return this.set(this.KEYS.goals, goals);
      }
    }
    return false;
  },

  deleteGoal: function(id) {
    var goals = this.get(this.KEYS.goals) || [];
    goals = goals.filter(function(g) { return g.id !== id; });
    return this.set(this.KEYS.goals, goals);
  },

  // Contacts
  getContacts: function(area) {
    var contacts = this.get(this.KEYS.contacts) || [];
    if (area) {
      return contacts.filter(function(c) { return c.area === area && !c.archived; });
    }
    return contacts.filter(function(c) { return !c.archived; });
  },

  addContact: function(contact) {
    var contacts = this.get(this.KEYS.contacts) || [];
    contact.id = App.Utils.generateId('c');
    contact.createdAt = App.Utils.today();
    contact.archived = false;
    contact.interactions = contact.interactions || [];
    contacts.push(contact);
    return this.set(this.KEYS.contacts, contacts) ? contact : null;
  },

  updateContact: function(id, updates) {
    var contacts = this.get(this.KEYS.contacts) || [];
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id === id) {
        Object.assign(contacts[i], updates);
        return this.set(this.KEYS.contacts, contacts);
      }
    }
    return false;
  },

  deleteContact: function(id) {
    var contacts = this.get(this.KEYS.contacts) || [];
    contacts = contacts.filter(function(c) { return c.id !== id; });
    return this.set(this.KEYS.contacts, contacts);
  },

  addInteraction: function(contactId, interaction) {
    var contacts = this.get(this.KEYS.contacts) || [];
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id === contactId) {
        contacts[i].interactions = contacts[i].interactions || [];
        contacts[i].interactions.unshift(interaction);
        contacts[i].lastContacted = interaction.date;
        return this.set(this.KEYS.contacts, contacts);
      }
    }
    return false;
  },

  // Tasks
  getTasks: function(area) {
    var tasks = this.get(this.KEYS.tasks) || [];
    if (area) {
      return tasks.filter(function(t) { return t.area === area; });
    }
    return tasks;
  },

  addTask: function(task) {
    var tasks = this.get(this.KEYS.tasks) || [];
    task.id = App.Utils.generateId('t');
    task.createdAt = App.Utils.today();
    task.status = task.status || 'todo';
    task.completedAt = null;
    tasks.push(task);
    return this.set(this.KEYS.tasks, tasks) ? task : null;
  },

  updateTask: function(id, updates) {
    var tasks = this.get(this.KEYS.tasks) || [];
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        Object.assign(tasks[i], updates);
        if (updates.status === 'done' && !tasks[i].completedAt) {
          tasks[i].completedAt = App.Utils.today();
        }
        return this.set(this.KEYS.tasks, tasks);
      }
    }
    return false;
  },

  deleteTask: function(id) {
    var tasks = this.get(this.KEYS.tasks) || [];
    tasks = tasks.filter(function(t) { return t.id !== id; });
    return this.set(this.KEYS.tasks, tasks);
  },

  // Reading
  getReadingItems: function(status) {
    var items = this.get(this.KEYS.reading) || [];
    if (status) {
      return items.filter(function(r) { return r.status === status; });
    }
    return items;
  },

  addReadingItem: function(item) {
    var items = this.get(this.KEYS.reading) || [];
    item.id = App.Utils.generateId('r');
    item.createdAt = App.Utils.today();
    items.push(item);
    return this.set(this.KEYS.reading, items) ? item : null;
  },

  updateReadingItem: function(id, updates) {
    var items = this.get(this.KEYS.reading) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        Object.assign(items[i], updates);
        return this.set(this.KEYS.reading, items);
      }
    }
    return false;
  },

  deleteReadingItem: function(id) {
    var items = this.get(this.KEYS.reading) || [];
    items = items.filter(function(r) { return r.id !== id; });
    return this.set(this.KEYS.reading, items);
  },

  // Export / Import
  exportAll: function() {
    var data = {
      exportDate: App.Utils.now(),
      version: this.SCHEMA_VERSION
    };
    var self = this;
    Object.keys(this.KEYS).forEach(function(key) {
      data[key] = self.get(self.KEYS[key]);
    });
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'lifestyle-tracker-backup-' + App.Utils.today() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  importAll: function(jsonString) {
    try {
      var data = JSON.parse(jsonString);
      if (!data.version) {
        throw new Error('Invalid backup file: missing version');
      }
      var self = this;
      Object.keys(this.KEYS).forEach(function(key) {
        if (data[key] !== undefined) {
          self.set(self.KEYS[key], data[key]);
        }
      });
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      alert('Import failed: ' + e.message);
      return false;
    }
  },

  clearAll: function() {
    var self = this;
    Object.keys(this.KEYS).forEach(function(key) {
      localStorage.removeItem(self.KEYS[key]);
    });
    this.init();
  }
};
