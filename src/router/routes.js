const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'home', component: () => import('pages/HomePage.vue') }],
  },
  {
    path: '/StationsList',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'stations-list', component: () => import('pages/StationsPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
