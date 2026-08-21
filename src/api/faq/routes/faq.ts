export default {
  routes: [
    {
      method: 'GET',
      path: '/faqs',
      handler: 'faq.find',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/faqs/reorder',
      handler: 'faq.reorder',
      config: { auth: true, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/faqs/:documentId',
      handler: 'faq.findOne',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
