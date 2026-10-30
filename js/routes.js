// All sections of the app, in navigation order.
// To add a page: add it here, create its file in js/pages/,
// and add a <script> tag for that file in index.html.
// hasDetail: true lets the address carry an extra part after the section,
// e.g. #schedule-2026-10-29 opens the board for that day, and
// #training-dance-compare opens Dance's Compare view.
App.sections = [
  { path: '/home', label: 'Home' },
  {
    path: '/profile',
    label: 'Profile',
    children: [
      { path: '/profile/info', label: 'Profile Info' },
      { path: '/profile/settings', label: 'Settings' },
      { path: '/profile/notifications', label: 'Notifications' },
      { path: '/profile/history', label: 'History' }
    ]
  },
  {
    path: '/training',
    label: 'Training',
    children: [
      { path: '/training/dance', label: 'Dance', hasDetail: true },
      { path: '/training/vocals', label: 'Vocals' },
      { path: '/training/rap', label: 'Rap' },
      { path: '/training/korean', label: 'Korean' }
    ]
  },
  { path: '/schedule', label: 'Schedule', hasDetail: true },
  { path: '/goals', label: 'Goals' }
];
