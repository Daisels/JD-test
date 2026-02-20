window.App = window.App || {};

App.Business = {
  render: function() {
    var contacts = App.Store.getContacts('business');
    var today = App.Utils.today();

    // Sort by urgency
    contacts.sort(function(a, b) {
      var urgencyA = App.Social.getUrgency(a, today);
      var urgencyB = App.Social.getUrgency(b, today);
      return urgencyB - urgencyA;
    });

    // Separate follow-ups due
    var followUpsDue = contacts.filter(function(c) {
      return c.followUpDate && c.followUpDate <= today && c.followUpAction;
    });

    var overdue = contacts.filter(function(c) { return App.Social.getContactStatus(c, today) === 'overdue'; });
    var dueSoon = contacts.filter(function(c) { return App.Social.getContactStatus(c, today) === 'due-soon'; });
    var ok = contacts.filter(function(c) { return App.Social.getContactStatus(c, today) === 'ok'; });

    var html = '<div class="area-view" data-area="business">';

    // Header
    html += '<div class="area-header">' +
      '<h2><span class="area-header-dot" style="background:var(--color-business)"></span> Business Network</h2>' +
      '<button class="btn btn-primary" data-action="add-contact" style="background:var(--color-business);border-color:var(--color-business)">' + App.Utils.icon('plus') + ' Add Contact</button>' +
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
        '<div class="stat-value" style="color:var(--warning)">' + followUpsDue.length + '</div>' +
        '<div class="stat-label">Follow-ups Due</div>' +
      '</div>' +
    '</div>';

    // Follow-ups due section
    if (followUpsDue.length > 0) {
      html += '<div class="section"><div class="section-title">Follow-ups Due</div><div class="list">';
      for (var f = 0; f < followUpsDue.length; f++) {
        html += this.renderBusinessCard(followUpsDue[f], today, true);
      }
      html += '</div></div>';
    }

    // Contact list
    if (contacts.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-text">No business contacts yet. Add people from your professional network.</div></div>';
    } else {
      if (overdue.length > 0) {
        html += '<div class="section"><div class="section-title text-danger">Overdue</div><div class="list">';
        for (var i = 0; i < overdue.length; i++) {
          html += this.renderBusinessCard(overdue[i], today, false);
        }
        html += '</div></div>';
      }

      if (dueSoon.length > 0) {
        html += '<div class="section"><div class="section-title text-warning">Due Soon</div><div class="list">';
        for (var j = 0; j < dueSoon.length; j++) {
          html += this.renderBusinessCard(dueSoon[j], today, false);
        }
        html += '</div></div>';
      }

      if (ok.length > 0) {
        html += '<div class="section"><div class="section-title text-success">Up to Date</div><div class="list">';
        for (var k = 0; k < ok.length; k++) {
          html += this.renderBusinessCard(ok[k], today, false);
        }
        html += '</div></div>';
      }
    }

    html += '</div>';
    return html;
  },

  renderBusinessCard: function(contact, today, showFollowUp) {
    var status = App.Social.getContactStatus(contact, today);
    var daysSince = contact.lastContacted ? App.Utils.daysBetween(contact.lastContacted, today) : null;
    var initials = App.Social.getInitials(contact.name);

    var followUpHtml = '';
    if (showFollowUp && contact.followUpAction) {
      followUpHtml = '<div class="text-xs" style="color:var(--warning);margin-top:var(--sp-1)">' +
        'Follow-up: ' + App.Utils.escapeHtml(contact.followUpAction) + '</div>';
    }

    return '<div class="contact-card" data-action="view-contact" data-contact-id="' + contact.id + '">' +
      '<div class="contact-status contact-' + status + '"></div>' +
      '<div class="contact-avatar">' + initials + '</div>' +
      '<div class="contact-info">' +
        '<div class="contact-name">' + App.Utils.escapeHtml(contact.name) + '</div>' +
        '<div class="contact-relationship">' +
          App.Utils.escapeHtml(contact.relationship || '') +
          (contact.company ? ' at ' + App.Utils.escapeHtml(contact.company) : '') +
        '</div>' +
        '<div class="contact-last-contact">' +
          (daysSince !== null ? daysSince + ' days ago' : 'Never contacted') +
          (contact.targetFrequency ? ' &middot; Target: every ' + contact.targetFrequency + 'd' : '') +
        '</div>' +
        followUpHtml +
      '</div>' +
      '<button class="btn btn-sm" data-action="log-interaction" data-contact-id="' + contact.id + '">Log</button>' +
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

      if (action === 'add-contact') {
        self.showAddContactModal();
      }

      if (action === 'log-interaction') {
        e.stopPropagation();
        App.Social.showLogInteractionModal(target.dataset.contactId);
      }

      if (action === 'view-contact') {
        self.showViewContactModal(target.dataset.contactId);
      }
    });
  },

  showAddContactModal: function() {
    var bodyHtml = '<div class="form-group">' +
      '<label class="form-label">Name</label>' +
      '<input type="text" class="form-input" id="contact-name" placeholder="Full name">' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label class="form-label">Role / Title</label>' +
        '<input type="text" class="form-input" id="contact-relationship" placeholder="e.g., VP Sales">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Company</label>' +
        '<input type="text" class="form-input" id="contact-company" placeholder="Company name">' +
      '</div>' +
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
      '<input type="number" class="form-input" id="contact-frequency" value="30" min="1">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Context</label>' +
      '<input type="text" class="form-input" id="contact-context" placeholder="e.g., Met at conference X">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Follow-up Action</label>' +
      '<input type="text" class="form-input" id="contact-followup" placeholder="e.g., Send proposal">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Follow-up Date</label>' +
      '<input type="date" class="form-input" id="contact-followup-date">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Notes</label>' +
      '<textarea class="form-textarea" id="contact-notes" placeholder="Additional notes..."></textarea>' +
    '</div>';

    var footerHtml = '<button class="btn" data-action="close-modal">Cancel</button>' +
      '<button class="btn btn-primary" id="save-contact" style="background:var(--color-business);border-color:var(--color-business)">Add Contact</button>';

    var overlay = App.App.showModal('Add Business Contact', bodyHtml, footerHtml);

    overlay.querySelector('#save-contact').addEventListener('click', function() {
      var name = document.getElementById('contact-name').value.trim();
      if (!name) { alert('Please enter a name.'); return; }

      App.Store.addContact({
        area: 'business',
        name: name,
        relationship: document.getElementById('contact-relationship').value.trim(),
        company: document.getElementById('contact-company').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: document.getElementById('contact-phone').value.trim(),
        targetFrequency: parseInt(document.getElementById('contact-frequency').value) || 30,
        lastContacted: null,
        context: document.getElementById('contact-context').value.trim(),
        followUpAction: document.getElementById('contact-followup').value.trim(),
        followUpDate: document.getElementById('contact-followup-date').value || null,
        notes: document.getElementById('contact-notes').value.trim(),
        tags: []
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
      '<div class="contact-avatar" style="width:48px;height:48px;font-size:var(--font-size-base)">' + App.Social.getInitials(contact.name) + '</div>' +
      '<div>' +
        '<div class="font-semibold">' + App.Utils.escapeHtml(contact.name) + '</div>' +
        '<div class="text-sm text-muted">' +
          App.Utils.escapeHtml(contact.relationship || '') +
          (contact.company ? ' at ' + App.Utils.escapeHtml(contact.company) : '') +
        '</div>' +
      '</div>' +
    '</div>' +
    (contact.email ? '<p class="text-sm">' + App.Utils.escapeHtml(contact.email) + '</p>' : '') +
    (contact.phone ? '<p class="text-sm">' + App.Utils.escapeHtml(contact.phone) + '</p>' : '') +
    (contact.context ? '<p class="text-sm text-secondary mt-2">' + App.Utils.escapeHtml(contact.context) + '</p>' : '') +
    (contact.notes ? '<p class="text-sm text-secondary">' + App.Utils.escapeHtml(contact.notes) + '</p>' : '') +
    (contact.followUpAction ? '<div class="card mt-4" style="background:var(--color-business-light);border-color:var(--color-business)">' +
      '<div class="text-sm font-semibold">Follow-up: ' + App.Utils.escapeHtml(contact.followUpAction) + '</div>' +
      (contact.followUpDate ? '<div class="text-xs text-muted">Due: ' + App.Utils.formatDisplay(contact.followUpDate) + '</div>' : '') +
    '</div>' : '') +
    '<div class="section-title mt-4">Interaction History</div>' +
    interactionHtml;

    var footerHtml = '<button class="btn btn-danger btn-sm" id="delete-contact">' + App.Utils.icon('trash') + '</button>' +
      '<div class="flex-1"></div>' +
      '<button class="btn" data-action="close-modal">Close</button>' +
      '<button class="btn btn-primary" id="log-from-view" data-contact-id="' + contactId + '" style="background:var(--color-business);border-color:var(--color-business)">Log Interaction</button>';

    var overlay = App.App.showModal(contact.name, bodyHtml, footerHtml);

    overlay.querySelector('#log-from-view').addEventListener('click', function() {
      App.App.closeModal();
      setTimeout(function() {
        App.Social.showLogInteractionModal(contactId);
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
