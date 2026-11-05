// Training > Dance.
// #training-dance               -> three buttons + practice video suggestions
// #training-dance-warming-up    -> Warming Up (warming-up.js)
// #training-dance-learn-choreo  -> Learn Choreo (learn-choreo.js)
// #training-dance-learn-choreo-<video id> -> Learn Choreo with that video
// #training-dance-compare       -> Compare (compare.js)
// #training-dance-compare-<video id> -> Compare with that video
App.dance = App.dance || {};
App.dance.renderView = App.dance.renderView || {}; // filled in by each view's file

// The three buttons, in order. 'id' is the end of the view's address.
// hasDetail: true lets the view's address carry an extra part (e.g. a video id).
App.dance.views = [
  { id: 'warming-up', label: 'Warm Up and Stretch' },
  { id: 'learn-choreo', label: 'Learn Choreo', hasDetail: true },
  { id: 'compare', label: 'Compare', hasDetail: true }
];

App.registerPage('/training/dance', function (container, detail) {
  // Main Dance page
  if (!detail) {
    // (returns the cleanup that stops watching the saved video list)
    return App.dance.renderMain(container);
  }

  // One of the three views, possibly with an extra part (e.g. a video id)
  let extra;
  const view = App.dance.views.find(function (v) {
    if (v.id === detail) return true;
    if (v.hasDetail && detail.indexOf(v.id + '-') === 0) {
      extra = detail.slice(v.id.length + 1);
      return true;
    }
    return false;
  });
  if (!view) {
    // Unknown address: go back to the main Dance page
    window.location.replace('#training-dance');
    return;
  }

  // Each view is a page of its own: a back link and the view's name on top
  const back = extra
    ? `<a href="#training-dance-${view.id}" class="dance-back">&larr; Back to ${view.label}</a>`
    : '<a href="#training-dance" class="dance-back">&larr; Back to Dance</a>';
  container.innerHTML = `
    <p class="dance-back-row">${back}</p>
    <h1 class="dance-view-title">${view.label}</h1>
    <div class="dance-view"></div>`;
  document.title = view.label + ' - Dance - Idol Academy';
  return App.dance.renderView[view.id](container.querySelector('.dance-view'), extra);
});

// Main Dance page: the three buttons, then the video suggestions
App.dance.renderMain = function (container) {
  const buttons = App.dance.views
    .map(function (v) {
      return `<a class="dance-button" href="#training-dance-${v.id}">${v.label}</a>`;
    })
    .join('');
  container.innerHTML = `
    <div class="dance-buttons">${buttons}</div>
    <div class="dance-videos"></div>`;
  return App.dance.renderVideos(container.querySelector('.dance-videos'));
};
