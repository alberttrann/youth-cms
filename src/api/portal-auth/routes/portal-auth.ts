export default {
  routes: [
    {
      method: 'POST',
      path: '/portal-auth/login',
      handler: 'api::portal-auth.portal-auth.login', //  Strict v5 UID syntax
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/portal-auth/me',
      handler: 'api::portal-auth.portal-auth.me', //  Strict v5 UID syntax
      config: {
        auth: false,
      },
    },
  ],
};