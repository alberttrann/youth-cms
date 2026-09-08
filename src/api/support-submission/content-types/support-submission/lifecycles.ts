import { sendSubmissionNotifications } from '../../../../utils/email-notifications';

export default {
  async afterCreate(event: any) {
    const data = event.result || event.params?.data;
    if (data) {
      sendSubmissionNotifications('support-submission', data, strapi);
    }
  },
};