window.App = window.App || {};

App.Social = {
  interactionTypes: ['Call', 'Message', 'Meeting', 'Email', 'Social'],

  render: function() {
    var contacts = App.Store.getContacts('social');
    var today = App.Utils.today();

    // Sort by urgency: overdue first, then due soon, then ok
    contacts.sort(function(a, b) {
      var urgencyA = App.Social.getUrgency(a, today);
      var urgencyB = App.Social.getUrgency(b, today);
      return urgencyB - urgencyA;
    });

    var overdue = contacts.filter(function(c) { return App.Social.getContactStatus(c, today) === 'overdue'; });
    var dueSoon = contacts.filter(function(c) { return App.Social.getContactStatus(c, today) === 'due-soon'; });
    var ok = contacts.filter(function(c) { return App.Social.getContactStatus(c, today) === 'ok'; });

    var html = '<div class="area-view" data-area="social">';

    // Header
    html += '<div class="area-header">' +
      '<h2><span class="area-header-dot" style="background:var(--color-social)"></span> Social Network</h2>' +
      '<button class="btn btn-primary" data-action="add-contact" style="background:var(--color-social);border-color:var(--color-social)">' + App.Utils.icon('plus') + ' Add Contact</button>' +
    '</div>';

    // Stats
    html += '<div class="stats-row">' +
      '<div class="stat-box">' +
        '<div class="stat-value">' + contacts.length + '</div>' +
        '<div class="stat-label">Total Contacts</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value" style="color:var(--danger)">' + overdue.length + '</div>' +
        '<div class="stat-label">Overdue</div>' +
      '</div>' +
      '<div class="stat-box">' +
        '<div class="stat-value" style="color:var(--warning)">' + dueSoon.length + '</div>' +
        '<div class="stat-label">Due Soon</div>' +
      '</div>' +
    '</div>';

    // Contact list
    if (contacts.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-text">No contacts yet. Add people you want to keep in touch with.</div></div>';
    } else {
      if (overdue.length > 0) {
        html += '<div class="section"><div class="section-title text-danger">Overdue</div><div class="list">';
        for (var i = 0; i < overdue.length; i++) {
          html += this.renderContactCard(overdue[i], today);
        }
        html += '</div></div>';
      }

      if (dueSoon.length > 0) {
        html += '<div class="section"><div class="section-title text-warning">Due Soon</div><div class="list">';
        for (var j = 0; j < dueSoon.length; j++) {
          html += this.renderContactCard(dueSoon[j], today);
        }
        html += '</div></div>';
      }

      if (ok.length > 0) {
        html += '<div class="section"><div class="section-title text-success">Up to Date</div><div class="list">';
        for (var k = 0; k < ok.length; k++) {
          html += this.renderContactCard(ok[k], today);
        }
        html += '</div></div>';
      }
    }

    html += '</div>';
    return html;
  },

  renderContactCard: function(contact, today) {
    var status = this.getContactStatus(contact, today);
    var daysSince = contact.lastContacted ? App.Utils.daysBetween(contact.lastContacted, today) : null;
    var initials = this.getInitials(contact.name);

    return '<div class="contact-card" data-action="view-contact" data-contact-id="' + contact.id + '">' +
      '<div class="contact-status contact-' + status + '"></div>' +
      '<div class="contact-avatar">' + initials + '</div>' +
      '<div class="contact-info">' +
        '<div class="contact-name">' + App.Utils.escapeHtml(contact.name) + '</div>' +
        '<div class="contact-relationship">' + App.Utils.escapeHtml(contact.relationship || '') + '</div>' +
        '<div class="contact-last-contact">' +
          (daysSince !== null ? daysSince + ' days ago' : 'Never contacted') +
          (contact.targetFrequency ? ' &middot; Target: every ' + contact.targetFrequency + 'd' : '') +
        '</div>' +
      '</div>' +
      '<button class="btn btn-sm" data-action="log-interaction" data-contact-id="' + contact.id + '">Log</button>' +
    '</div>';
  },

  getInitials: function(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  },

  getContactStatus: function(contact, today) {
    if (!contact.lastContacted) return 'overdue';
    if (!contact.targetFrequency) return 'ok';
    var daysSince = App.Utils.daysBetween(contact.lastContacted, today);
    if (daysSince > contact.targetFrequency) return 'overdue';
    if (daysSince > contact.targetFrequency - 3) return 'due-soon';
    return 'ok';
  },

  getUrgency: function(contact, today) {
    if (!contact.lastContacted) return 999;
    if (!contact.targetFrequency) return -1;
    var daysSince = App.Utils.daysBetween(contact.lastContacted, today);
    return daysSince - contact.targetFrequency;
  },

  init: function() {
    var self = this;
    var view = document.querySelector('.area-view');
    if (!view) return;

    view.addEventListener('click', function(e) {
      var target = e.target.closest('[data-action]');
      if (!target) return;

      var action = target.dataset.action;

      if (action === 'add-contact') {
        self.showAddContactModal('social');
      }

      if (action === 'log-interaction') {
        e.stopPropagation();
        self.showLogInteractionModal(target.dataset.contactId);
      }

      if (action === 'view-contact') {
        self.showViewContactModal(target.dataset.contactId);
      }
    });
  },

  showAddContactModal: function(area) {
    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Name</label>' +
      '<input type="text" class="form-input" id="contact-name" placeholder="Full name">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Relationship</label>' +
      '<input type="text" class="form-input" id="contact-relationship" placeholder="e.g., Friend, Family, Colleague">' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label class="form-label">Email</label>' +
        '<input type="email" class="form-input" id="contact-email" placeholder="email@example.com">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Phone</label>' +
        '<input type="tel" class="form-input" id="contact-phone" placeholder="+1...">' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Contact every (days)</label>' +
      '<input type="number" class="form-input" id="contact-frequency" value="14" min="1" placeholder="e.g., 14">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Notes</label>' +
      '<textarea class="form-textarea" id="contact-notes" placeholder="Any notes about this person..."></textarea>' +
    '</div>';

    var accentColor = area === 'business' ? 'var(--color-business)' : 'var(--color-social)';
    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-contact" style="background:' + accentColor + ';border-color:' + accentColor + '">Add Contact</button>';

    var overlay = App.App.showModal('Add Contact', bodyHtml, footerHtml);

    overlay.querySelector('#save-contact').addEventListener('click', function() {
      var name = document.getElementById('contact-name').value.trim();
      if (!name) { alert('Please enter a name.'); return; }

      App.Store.addContact({
        area: area,
        name: name,
        relationship: document.getElementById('contact-relationship').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: document.getElementById('contact-phone').value.trim(),
        targetFrequency: parseInt(document.getElementById('contact-frequency').value) || 14,
        lastContacted: null,
        notes: document.getElementById('contact-notes').value.trim(),
        tags: []
      });

      App.App.closeModal();
      App.App.refreshView();
    });
  },

  showLogInteractionModal: function(contactId) {
    var contacts = App.Store.getContacts();
    var contact = null;
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id === contactId) { contact = contacts[i]; break; }
    }
    if (!contact) return;

    var typeOptions = '';
    for (var j = 0; j < this.interactionTypes.length; j++) {
      typeOptions += '<option value="' + this.interactionTypes[j].toLowerCase() + '">' + this.interactionTypes[j] + '</option>';
    }

    var bodyHtml = '<p class="text-sm text-secondary">Logging interaction with <strong>' + App.Utils.escapeHtml(contact.name) + '</strong></p>' +
    '<div class="form-group">' +
      '<label class="form-label">Type</label>' +
      '<select class="form-select" id="interaction-type">' + typeOptions + '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Date</label>' +
      '<input type="date" class="form-input" id="interaction-date" value="' + App.Utils.today() + '">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Note (optional)</label>' +
      '<input type="text" class="form-input" id="interaction-note" placeholder="What did you talk about?">' +
    '</div>';

    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-interaction">Log Interaction</button>';

    var overlay = App.App.showModal('Log Interaction', bodyHtml, footerHtml);

    overlay.querySelector('#save-interaction').addEventListener('click', function() {
      App.Store.addInteraction(contactId, {
        date: document.getElementById('interaction-date').value,
        type: document.getElementById('interaction-type').value,
        note: document.getElementById('interaction-note').value.trim()
      });

      App.App.closeModal();
      App.App.refreshView();
    });
  },

  showViewContactModal: function(contactId) {
    var contacts = App.Store.getContacts();
    var contact = null;
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id === contactId) { contact = contacts[i]; break; }
    }
    if (!contact) return;

    var interactions = contact.interactions || [];
    var interactionHtml = '';
    if (interactions.length === 0) {
      interactionHtml = '<p class="text-sm text-muted">No interactions logged yet.</p>';
    } else {
      interactionHtml = '<div class="list">';
      for (var j = 0; j < Math.min(interactions.length, 10); j++) {
        var inter = interactions[j];
        interactionHtml += '<div class="list-item">' +
          '<div class="flex-1">' +
            '<div class="text-sm font-semibold">' + App.Utils.escapeHtml(inter.type || 'Contact') + '</div>' +
            (inter.note ? '<div class="text-xs text-muted">' + App.Utils.escapeHtml(inter.note) + '</div>' : '') +
          '</div>' +
          '<div class="text-xs text-muted">' + App.Utils.formatShort(inter.date) + '</div>' +
        '</div>';
      }
      interactionHtml += '</div>';
    }

    var bodyHtml = '<div class="flex items-center gap-3 mb-4">' +
      '<div class="contact-avatar" style="width:48px;height:48px;font-size:var(--font-size-base)">' + this.getInitials(contact.name) + '</div>' +
      '<div>' +
        '<div class="font-semibold">' + App.Utils.escapeHtml(contact.name) + '</div>' +
        '<div class="text-sm text-muted">' + App.Utils.escapeHtml(contact.relationship || '') + '</div>' +
      '</div>' +
    '</div>' +
    (contact.email ? '<p class="text-sm">' + App.Utils.escapeHtml(contact.email) + '</p>' : '') +
    (contact.phone ? '<p class="text-sm">' + App.Utils.escapeHtml(contact.phone) + '</p>' : '') +
    (contact.notes ? '<p class="text-sm text-secondary mt-2">' + App.Utils.escapeHtml(contact.notes) + '</p>' : '') +
    '<div class="section-title mt-4">Interaction History</div>' +
    interactionHtml;

    var footerHtml = '<button class="btn btn-danger btn-sm" id="delete-contact">' + App.Utils.icon('trash') + '</button>' +
      '<div class="flex-1"></div>' +
      '<button class="btn" data-action="close-modal">Close</button>' +
      '<button class="btn btn-primary" id="log-from-view" data-contact-id="' + contactId + '">Log Interaction</button>';

    var self = this;
    var overlay = App.App.showModal(contact.name, bodyHtml, footerHtml);

    overlay.querySelector('#log-from-view').addEventListener('click', function() {
      App.App.closeModal();
      setTimeout(function() {
        self.showLogInteractionModal(contactId);
      }, 200);
    });

    overlay.querySelector('#delete-contact').addEventListener('click', function() {
      App.App.confirm('Delete this contact and all interaction history?', function() {
        App.Store.deleteContact(contactId);
        App.App.closeModal();
        App.App.refreshView();
      });
    });
  }
};
