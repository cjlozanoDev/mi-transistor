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
  {
    path: '/FavoritesStations',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'favorites-stations',
        component: () => import('pages/FavoritesStationsPage.vue'),
      },
    ],
  },
  {
    path: '/RecentsStations',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'recents-stations',
        component: () => import('pages/RecentsStationsPage.vue'),
      },
    ],
  },
  {
    path: '/AboutApp',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'about-app',
        component: () => import('pages/AboutAppPage.vue'),
      },
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
