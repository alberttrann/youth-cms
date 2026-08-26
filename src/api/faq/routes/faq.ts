export default {
  routes: [
    {
      method: 'GET',
      path: '/faqs',
      handler: 'faq.find',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/faqs/:documentId',
      handler: 'faq.findOne',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
