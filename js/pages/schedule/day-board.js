// Schedule > day board: one day shown as hours from 00:00 to 23:00,
// like a phone calendar. Tap an hour to add a plan there (time + what
// you'll do). Each plan has a checkbox for when it's done, and Delete.
// On today's board a line shows the current time.
// Saved under 'schedule/<date>' as { items: [{ id, time, text, done }] }.
App.schedule = App.schedule || {};

App.schedule.renderDayBoard = function (container, dateKey) {
  const date = App.schedule.parseDateKey(dateKey);
  const isToday = dateKey === App.schedule.dateKey(new Date());
  const savePath = 'schedule/' + dateKey;
  const FIRST_HOUR_IF_EMPTY = 8; // other days open at 08:00 when nothing is planned

  let items = [];
  let loaded = false;
  let draft = null; // the open Add form: { hour, time, text }

  const monthName = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' });

  container.innerHTML = `
    <div class="board-header">
      <a href="#schedule" class="board-back">&larr; Back to calendar</a>
      <h2 class="day-title" aria-label="${App.schedule.formatLongDate(date)}">
        <span>${monthName}</span>
        <span class="day-pill${isToday ? ' today' : ''}">
          <span class="day-weekday">${weekday}</span>
          <span class="day-number">${date.getDate()}</span>
        </span>
      </h2>
    </div>
    <p class="board-error" role="alert" hidden></p>
    <p class="board-note">Loading&hellip;</p>
    <div class="timeline" hidden></div>`;

  const header = container.querySelector('.board-header');
  const note = container.querySelector('.board-note');
  const errorBox = container.querySelector('.board-error');
  const timeline = container.querySelector('.timeline');

  // ----- Helpers -----

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function hourOf(item) {
    return parseInt(item.time.slice(0, 2), 10);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ----- Drawing -----

  // All 24 hours: label on the left, a box on the right
  function showTimeline() {
    timeline.innerHTML = '';

    for (let hour = 0; hour < 24; hour++) {
      const row = el('div', 'hour');
      row.id = 'hour-' + hour;

      const slot = el('div', 'hour-slot');

      // Plans in this hour, earliest first
      const plans = items
        .filter(function (item) { return hourOf(item) === hour; })
        .sort(function (a, b) { return a.time.localeCompare(b.time); });
      if (plans.length) {
        const list = el('ul', 'hour-plans');
        plans.forEach(function (item) { list.appendChild(planRow(item)); });
        slot.appendChild(list);
      }

      if (draft && draft.hour === hour) {
        slot.appendChild(addForm());
      } else {
        // The empty part of the box: tap it to add a plan at this hour
        const addButton = el('button', 'hour-add');
        addButton.type = 'button';
        addButton.setAttribute('aria-label', 'Add a plan at ' + pad(hour) + ':00');
        addButton.addEventListener('click', function () {
          draft = { hour: hour, time: pad(hour) + ':00', text: '' };
          showTimeline();
          const textInput = document.getElementById('plan-text');
          if (textInput) textInput.focus();
        });
        slot.appendChild(addButton);
      }

      row.append(el('div', 'hour-label', pad(hour) + ':00'), slot);
      timeline.appendChild(row);
    }

    if (isToday) {
      timeline.appendChild(el('div', 'now-line'));
      placeNowLine();
    }
  }

  // One plan: [checkbox] time  what you'll do  [Delete]
  function planRow(item) {
    const row = el('li', 'plan');

    // Tapping the time or text also ticks the checkbox
    const label = el('label', 'plan-label');
    const checkbox = el('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'done-' + item.id;
    checkbox.checked = item.done;
    checkbox.addEventListener('change', function () {
      saveItems(items.map(function (i) {
        return i.id === item.id ? Object.assign({}, i, { done: checkbox.checked }) : i;
      }));
    });
    label.append(checkbox, el('span', 'plan-time', item.time), el('span', 'plan-text', item.text));

    const deleteButton = el('button', 'plan-delete', 'Delete');
    deleteButton.type = 'button';
    deleteButton.setAttribute('aria-label', 'Delete ' + item.time + ' ' + item.text);
    deleteButton.addEventListener('click', function () {
      saveItems(items.filter(function (i) { return i.id !== item.id; }));
    });

    row.append(label, deleteButton);
    return row;
  }

  // The Add form inside an hour's box
  function addForm() {
    const form = el('form', 'plan-form');

    const timeInput = el('input');
    timeInput.type = 'time';
    timeInput.id = 'plan-time';
    timeInput.required = true;
    timeInput.value = draft.time;
    timeInput.setAttribute('aria-label', 'Time');
    timeInput.addEventListener('input', function () { draft.time = timeInput.value; });

    const textInput = el('input');
    textInput.type = 'text';
    textInput.id = 'plan-text';
    textInput.required = true;
    textInput.maxLength = 200;
    textInput.autocomplete = 'off';
    textInput.placeholder = "What you'll do";
    textInput.setAttribute('aria-label', "What you'll do");
    textInput.value = draft.text;
    textInput.addEventListener('input', function () { draft.text = textInput.value; });

    const addButton = el('button', null, 'Add');
    addButton.type = 'submit';
    const cancelButton = el('button', null, 'Cancel');
    cancelButton.type = 'button';
    cancelButton.addEventListener('click', function () {
      draft = null;
      showTimeline();
    });

    const buttons = el('div', 'plan-form-buttons');
    buttons.append(addButton, cancelButton);
    form.append(timeInput, textInput, buttons);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const text = textInput.value.trim();
      if (!text || !timeInput.value) {
        textInput.value = text;
        form.reportValidity();
        return;
      }
      const newItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        time: timeInput.value,
        text: text,
        done: false
      };
      draft = null;
      saveItems(items.concat(newItem));
    });

    return form;
  }

  // Today only: the line at the current time, inside the current hour's box
  function placeNowLine() {
    const line = timeline.querySelector('.now-line');
    if (!line) return;
    const now = new Date();
    const slot = timeline.querySelector('#hour-' + now.getHours() + ' .hour-slot');
    line.style.top = (slot.offsetTop + slot.offsetHeight * now.getMinutes() / 60) + 'px';
    line.style.left = slot.offsetLeft + 'px';
  }

  // When the day opens: today starts an hour before now; other days at
  // their first plan, or at 08:00 if nothing is planned.
  function scrollToStart() {
    let hour;
    if (isToday) {
      hour = Math.max(0, new Date().getHours() - 1);
    } else if (items.length) {
      hour = Math.min.apply(null, items.map(hourOf));
    } else {
      hour = FIRST_HOUR_IF_EMPTY;
    }
    if (hour === 0) return; // already in view
    const row = document.getElementById('hour-' + hour);
    window.scrollTo(0, row.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 8);
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  // ----- Saving -----

  // Update the screen right away, then save
  function saveItems(newItems) {
    items = newItems;
    showTimeline();
    errorBox.hidden = true;
    App.storage.save(savePath, items.length ? { items: items } : null).catch(function () {
      showError(App.storage.saveFailedMessage);
    });
  }

  // Load this day's plans, and keep them up to date.
  // The hours appear only once the day has loaded, so adding a plan
  // can never replace plans that haven't loaded yet.
  const stopWatching = App.storage.watch(
    savePath,
    function (data) {
      const newItems = data && Array.isArray(data.items) ? data.items : [];
      if (loaded && JSON.stringify(newItems) === JSON.stringify(items)) return; // nothing changed
      items = newItems;
      note.hidden = true;
      timeline.hidden = false;
      showTimeline();
      if (!loaded) {
        loaded = true;
        scrollToStart();
      }
    },
    function (err) {
      note.hidden = true;
      timeline.hidden = true;
      showError(err && err.code === 'not_available'
        ? App.storage.notAvailableMessage
        : "Couldn't load this day's plans. Close and reopen the app to try again.");
    }
  );

  // Keep the current-time line in place
  const timer = isToday ? setInterval(placeNowLine, 60 * 1000) : null;
  window.addEventListener('resize', placeNowLine);

  // When you leave this page: stop watching saved data and the clock
  return function leave() {
    stopWatching();
    clearInterval(timer);
    window.removeEventListener('resize', placeNowLine);
  };
};
