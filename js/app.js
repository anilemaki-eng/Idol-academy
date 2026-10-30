// Shared app object. The other scripts add to it.
var App = {
  sections: [], // navigation structure, filled in by routes.js
  pages: {}     // page render functions, filled in by the files in js/pages/
};

// Each page file calls this once to register itself.
// render(container, detail) receives:
//   container: the empty element where that page's content goes
//   detail:    the extra part of the address, if any (e.g. '2026-10-29'
//              for #schedule-2026-10-29), otherwise undefined
// render may return a function; it runs when you leave the page
// (used to stop watching saved data).
App.registerPage = function (path, render) {
  App.pages[path] = render;
};
