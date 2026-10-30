// Schedule page.
// #schedule             -> the calendar (calendar.js)
// #schedule-2026-10-29  -> the board for that day (day-board.js)
App.schedule = App.schedule || {};

App.registerPage('/schedule', function (container, detail) {
  if (!detail) {
    App.schedule.renderCalendar(container);
    return;
  }
  if (!App.schedule.parseDateKey(detail)) {
    // Not a real date: go back to the calendar
    window.location.replace('#schedule');
    return;
  }
  App.schedule.lastOpenedDay = detail;
  return App.schedule.renderDayBoard(container, detail);
});

// ----- Date helpers shared by the calendar and the day board -----

// Date -> '2026-10-29'
App.schedule.dateKey = function (date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
};

// '2026-10-29' -> Date, or null if it isn't a real date
App.schedule.parseDateKey = function (key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return App.schedule.dateKey(date) === key ? date : null;
};

// Date -> 'Thursday, 29 October 2026'
App.schedule.formatLongDate = function (date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};
