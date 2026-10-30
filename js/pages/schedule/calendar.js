// Schedule > calendar: the next 12 months, starting with the current month.
// Tapping a day opens that day's board.
App.schedule = App.schedule || {};

App.schedule.renderCalendar = function (container) {
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS_TO_SHOW = 12;

  const today = new Date();
  const todayKey = App.schedule.dateKey(today);
  let html = '';

  for (let i = 0; i < MONTHS_TO_SHOW; i++) {
    const firstDay = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = firstDay.getFullYear();
    const month = firstDay.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    html += `<section class="cal-month" id="month-${App.schedule.dateKey(firstDay).slice(0, 7)}">`;
    html += `<h2>${monthName}</h2>`;
    html += '<div class="cal-grid">';

    // Weekday names
    for (const name of WEEKDAYS) {
      html += `<div class="cal-weekday">${name}</div>`;
    }

    // Empty cells before day 1, so day 1 sits under its weekday
    for (let e = 0; e < firstDay.getDay(); e++) {
      html += '<div></div>';
    }

    // The days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = App.schedule.dateKey(date);
      const isToday = key === todayKey;
      html +=
        `<a class="cal-day${isToday ? ' today' : ''}" href="#schedule-${key}"` +
        ` aria-label="${App.schedule.formatLongDate(date)}"${isToday ? ' aria-current="date"' : ''}>` +
        `<span>${day}</span></a>`;
    }

    html += '</div></section>';
  }

  container.innerHTML = html;

  // Coming back from a day's board: scroll to that day's month
  const last = App.schedule.lastOpenedDay;
  const lastMonth = last && document.getElementById('month-' + last.slice(0, 7));
  if (lastMonth) {
    lastMonth.scrollIntoView({ block: 'start' });
  }
  App.schedule.lastOpenedDay = null;
};
