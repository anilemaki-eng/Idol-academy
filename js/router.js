// Router: shows the right page for the current address.
// The page path '/training/dance' appears in the address as #training-dance
// (this form works both in a browser and on the hosted version).
(function () {
  const DEFAULT_PATH = '/home';
  let leavePage = null; // cleanup returned by the page currently shown

  // '/training/dance' -> 'training-dance'
  function toHash(path) {
    return path.slice(1).replace(/\//g, '-');
  }

  // All pages, each with the section it belongs to.
  function allPages() {
    const list = [];
    for (const section of App.sections) {
      list.push({ section: section, page: section });
      for (const child of section.children || []) {
        list.push({ section: section, page: child });
      }
    }
    return list;
  }

  // Find the page for an address, plus any extra part after it.
  // Example: 'schedule-2026-10-29' -> Schedule page, detail '2026-10-29'
  // (only for pages marked hasDetail: true in routes.js).
  function findRoute(hash) {
    const pages = allPages();
    for (const item of pages) {
      if (toHash(item.page.path) === hash) {
        return { section: item.section, page: item.page, detail: undefined };
      }
    }
    for (const item of pages) {
      const pageHash = toHash(item.page.path);
      if (item.page.hasDetail && hash.startsWith(pageHash + '-')) {
        return { section: item.section, page: item.page, detail: hash.slice(pageHash.length + 1) };
      }
    }
    return null;
  }

  // Build the <li> links for a nav list.
  function navItems(items, activePath, currentPath) {
    return items
      .map(function (item) {
        const active = item.path === activePath ? ' class="active"' : '';
        const current = item.path === currentPath ? ' aria-current="page"' : '';
        return `<li><a href="#${toHash(item.path)}"${active}${current}>${item.label}</a></li>`;
      })
      .join('');
  }

  function render() {
    const hash = window.location.hash.slice(1) || toHash(DEFAULT_PATH);
    const route = findRoute(hash);

    // Unknown address: go to the default page.
    if (!route) {
      window.location.replace('#' + toHash(DEFAULT_PATH));
      return;
    }

    // Let the previous page clean up (for example, stop watching saved data)
    if (typeof leavePage === 'function') {
      leavePage();
    }
    leavePage = null;

    const section = route.section;
    const page = route.page;
    const path = page.path;
    const isSubPage = page !== section;

    // Each new page starts at the top
    window.scrollTo(0, 0);

    // Main navigation
    document.getElementById('main-nav').innerHTML =
      navItems(App.sections, section.path, path);

    // Page area: section heading, sub-section nav (if any), sub-page heading
    let html = `<h1>${section.label}</h1>`;
    if (section.children) {
      html +=
        `<nav aria-label="${section.label} sections">` +
        `<ul class="nav-list sub-nav">${navItems(section.children, page.path, path)}</ul>` +
        `</nav>`;
    }
    if (isSubPage) {
      html += `<h2>${page.label}</h2>`;
    }
    html += '<div id="page-content"></div>';
    document.getElementById('app').innerHTML = html;

    document.title = isSubPage
      ? `${page.label} - ${section.label} - Idol Academy`
      : `${section.label} - Idol Academy`;

    // Let the page's own file fill in its content
    const renderPage = App.pages[path];
    if (renderPage) {
      leavePage = renderPage(document.getElementById('page-content'), route.detail);
    } else {
      console.warn('No page file registered for ' + path);
    }
  }

  window.addEventListener('hashchange', render);
  render();
})();
