window.App = window.App || {};

App.Charts = {
  instances: {},

  // Destroy existing chart on a canvas before creating a new one
  destroy: function(canvasId) {
    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
      delete this.instances[canvasId];
    }
  },

  // Weekly bar chart: 7 bars showing completion percentage per day
  weeklyBar: function(canvasId, data, color) {
    this.destroy(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    color = color || '#2F80ED';
    var ctx = canvas.getContext('2d');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: color + '40',
          borderColor: color,
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.parsed.y + '%';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) { return value + '%'; },
              font: { size: 11 }
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  },

  // Trend line chart: show values over time
  trendLine: function(canvasId, data, color) {
    this.destroy(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    color = color || '#2F80ED';
    var ctx = canvas.getContext('2d');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          borderColor: color,
          backgroundColor: color + '20',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: color,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.parsed.y + (data.unit ? ' ' + data.unit : '');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  },

  // Doughnut chart: category breakdown
  doughnut: function(canvasId, data) {
    this.destroy(canvasId);
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var ctx = canvas.getContext('2d');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: data.colors || [
            '#E85D3A', '#8B6FD0', '#2D9CDB', '#F2994A',
            '#27AE60', '#EB5757', '#2F80ED'
          ],
          borderWidth: 2,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11 }, padding: 12 }
          }
        }
      }
    });
  }
};
