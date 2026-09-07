import type { Core } from '@strapi/strapi';

export type SubmissionType =
  | 'inquiry'
  | 'leadership-application'
  | 'organization-application'
  | 'support-submission';

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = Array.isArray(value) ? value.join(', ') : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStaffEmail(): string {
  return process.env.STAFF_NOTIFICATION_EMAIL || 'info@youthorgunion.org';
}

function getSenderEmail(): string {
  return process.env.EMAIL_DEFAULT_FROM || '"Y.O.U Alliance" <no-reply@youthorgunion.com>';
}

function buildHtmlWrapper(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7FB; font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F7FB; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(11, 26, 43, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- Y.O.U Signature 4-Color Rainbow Gradient Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #EE334E 0%, #FCB131 33%, #00A651 67%, #0081C8 100%); height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td style="background-color: #0B1A2B; padding: 28px 32px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      Y<span style="color: #EE334E;">.</span>O<span style="color: #FCB131;">.</span>U
                    </span>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">
                      Youth Organization Union
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 12px; font-style: italic; color: #CBD5E1;">
                      Where Unity Drives Change
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #0B1A2B; padding: 24px 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                © ${new Date().getFullYear()} Youth Organization Union · Operating across 6 continents
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #CBD5E1;">
                <a href="https://youthorgunion.org" style="color: #38BDF8; text-decoration: none; font-weight: 600;">youthorgunion.org</a> &nbsp;·&nbsp; 
                <a href="mailto:info@youthorgunion.org" style="color: #38BDF8; text-decoration: none;">info@youthorgunion.org</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── 1. Contact Inquiry Templates ───────────────────────────────────────────
function getInquiryTemplates(data: Record<string, any>) {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone || 'N/A');
  const reason = escapeHtml(data.reason);
  const message = escapeHtml(data.message).replace(/\n/g, '<br>');

  const staffSubject = `[Inquiry] ${reason} — from ${name}`;
  const staffHtml = buildHtmlWrapper(
    'New Contact Inquiry',
    `
    <div style="text-align: left;">
      <span style="background-color: #EBF4FA; color: #005D9A; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 50px; text-transform: uppercase;">
        New Contact Inquiry
      </span>
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 16px 0 8px 0;">Message regarding ${reason}</h2>
      <p style="font-size: 14px; color: #64748B; margin: 0 0 20px 0;">A visitor has submitted an inquiry via the website contact form:</p>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px; margin-bottom: 24px;">
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 140px;">Full Name:</td><td style="font-size: 14px; font-weight: 600; color: #0F172A;">${name}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Email:</td><td style="font-size: 14px; font-weight: 600; color: #005D9A;"><a href="mailto:${email}" style="color: #005D9A; text-decoration: none;">${email}</a></td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Phone:</td><td style="font-size: 14px; color: #0F172A;">${phone}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Reason:</td><td style="font-size: 14px; font-weight: 600; color: #EE334E;">${reason}</td></tr>
      </table>

      <p style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 0 0 8px 0;">Inquiry Message:</p>
      <div style="background-color: #FFFFFF; border-left: 4px solid #005D9A; border-radius: 0 8px 8px 0; padding: 14px 18px; font-size: 14px; line-height: 1.6; color: #1E293B; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
        ${message}
      </div>
    </div>
    `
  );

  const userSubject = `We've received your inquiry — Youth Organization Union`;
  const userHtml = buildHtmlWrapper(
    'Thank you for contacting Y.O.U',
    `
    <div style="text-align: left;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Dear ${name},</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        Thank you for reaching out to the <strong>Youth Organization Union (Y.O.U)</strong>. We have received your inquiry regarding <strong>${reason}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #64748B; margin: 0 0 24px 0;">
        Our team reviews incoming correspondence within <strong>5–7 business days</strong>. If your request requires follow-up, our team will connect with you directly.
      </p>

      <div style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px; margin-bottom: 28px;">
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Your Message:</p>
        <p style="margin: 0; font-size: 14px; color: #334155; font-style: italic; line-height: 1.6;">"${message}"</p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
        Warm regards,<br>
        <strong style="color: #0B1A2B;">The Y.O.U Alliance Secretariat</strong>
      </p>
    </div>
    `
  );

  return { staffSubject, staffHtml, userSubject, userHtml };
}

// ── 2. Leadership Application Templates ────────────────────────────────────
function getLeadershipTemplates(data: Record<string, any>) {
  const fullName = escapeHtml(data.fullName);
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.whatsappNumber);
  const continent = escapeHtml(data.continent);
  const region = escapeHtml(data.region);
  const country = escapeHtml(data.countryOfResidence);

  const staffSubject = `[Candidate Application] ${fullName} — ${continent} (${region})`;
  const staffHtml = buildHtmlWrapper(
    'New Leadership Candidate',
    `
    <div style="text-align: left;">
      <span style="background-color: #FEE2E2; color: #EE334E; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 50px; text-transform: uppercase;">
        Leadership Application
      </span>
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 16px 0 8px 0;">Candidate: ${fullName}</h2>
      <p style="font-size: 14px; color: #64748B; margin: 0 0 20px 0;">A youth leader has applied for a Continental Director / Leadership position:</p>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px; margin-bottom: 24px;">
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 140px;">Candidate:</td><td style="font-size: 14px; font-weight: 600; color: #0F172A;">${fullName}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Region:</td><td style="font-size: 14px; font-weight: 600; color: #005D9A;">${continent} · ${region}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Residence:</td><td style="font-size: 14px; color: #0F172A;">${country}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Email:</td><td style="font-size: 14px; color: #005D9A;"><a href="mailto:${email}" style="color: #005D9A;">${email}</a></td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">WhatsApp:</td><td style="font-size: 14px; color: #0F172A;">${phone}</td></tr>
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://youthorgunion.org/portal/applications/leadership" style="display: inline-block; background-color: #005D9A; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 50px; box-shadow: 0 4px 10px rgba(0, 93, 154, 0.25);">
          Open Candidate in Portal ATS ➔
        </a>
      </div>
    </div>
    `
  );

  const userSubject = `Application Received: Continental Director / Leadership Role — Y.O.U`;
  const userHtml = buildHtmlWrapper(
    'Leadership Application Received',
    `
    <div style="text-align: left;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Dear ${fullName},</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        Thank you for applying to serve as a <strong>Continental Director</strong> with the <strong>Youth Organization Union (Y.O.U)</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #64748B; margin: 0 0 24px 0;">
        We have received your application and 9-point leadership assessment for the <strong>${continent} (${region})</strong> chapter.
      </p>

      <div style="background-color: #F8FAFC; border-left: 4px solid #EE334E; border-radius: 0 12px 12px 0; padding: 16px; margin-bottom: 28px;">
        <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #0F172A;">What to Expect Next:</h4>
        <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
          Our Executive Board is vetting candidates based on regional advocacy experience and organizational capacity. If shortlisted, you will be invited to an online interview.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
        Thank you for championing youth diplomacy,<br>
        <strong style="color: #0B1A2B;">Y.O.U Global Executive Board</strong>
      </p>
    </div>
    `
  );

  return { staffSubject, staffHtml, userSubject, userHtml };
}

// ── 3. Organization Application Templates ──────────────────────────────────
function getOrganizationTemplates(data: Record<string, any>) {
  const orgName = escapeHtml(data.organizationName);
  const repName = escapeHtml(data.representativeFullName);
  const email = escapeHtml(data.email);
  const country = escapeHtml(data.country);
  const focusArea = escapeHtml(data.focusArea);
  const projectName = escapeHtml(data.projectName);

  const staffSubject = `[Member Registration] ${orgName} (${country})`;
  const staffHtml = buildHtmlWrapper(
    'New Organization Registration',
    `
    <div style="text-align: left;">
      <span style="background-color: #ECFDF5; color: #059669; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 50px; text-transform: uppercase;">
        Organization Registration
      </span>
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 16px 0 8px 0;">${orgName}</h2>
      <p style="font-size: 14px; color: #64748B; margin: 0 0 20px 0;">A youth-led organization has submitted a formal membership application:</p>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px; margin-bottom: 24px;">
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 140px;">Organization:</td><td style="font-size: 14px; font-weight: 600; color: #0F172A;">${orgName}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Country:</td><td style="font-size: 14px; font-weight: 600; color: #0F172A;">${country}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Representative:</td><td style="font-size: 14px; color: #0F172A;">${repName} (<a href="mailto:${email}" style="color: #005D9A;">${email}</a>)</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Focus Area:</td><td style="font-size: 14px; font-weight: 600; color: #005D9A;">${focusArea}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Key Project:</td><td style="font-size: 14px; color: #0F172A;">${projectName}</td></tr>
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://youthorgunion.org/portal/applications/organizations" style="display: inline-block; background-color: #005D9A; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 50px; box-shadow: 0 4px 10px rgba(0, 93, 154, 0.25);">
          Review Organization in Portal ➔
        </a>
      </div>
    </div>
    `
  );

  const userSubject = `Registration Received: ${orgName} — Youth Organization Union`;
  const userHtml = buildHtmlWrapper(
    'Organization Registration Received',
    `
    <div style="text-align: left;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Dear ${repName},</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        Thank you for submitting the official registration for <strong>${orgName}</strong> to join the <strong>Youth Organization Union (Y.O.U)</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #64748B; margin: 0 0 24px 0;">
        Our Partnerships Committee is reviewing your organization profile and target SDG metrics. We will notify you once your membership is verified.
      </p>

      <div style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px; margin-bottom: 28px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #334155;"><strong>Organization:</strong> ${orgName} (${country})</p>
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Project:</strong> ${projectName}</p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
        In partnership,<br>
        <strong style="color: #0B1A2B;">Y.O.U Partnerships &amp; Membership Committee</strong>
      </p>
    </div>
    `
  );

  return { staffSubject, staffHtml, userSubject, userHtml };
}

// ── 4. Support Submission Templates ────────────────────────────────────────
function getSupportTemplates(data: Record<string, any>) {
  const fullName = escapeHtml(data.fullName);
  const email = escapeHtml(data.email);
  const projects = escapeHtml(data.projects);
  const letter = escapeHtml(data.letter).replace(/\n/g, '<br>');
  const financialGift = escapeHtml(data.financialGiftDetails || 'None / Pure Letter of Encouragement');
  const frequency = escapeHtml(data.donationFrequency || 'once');

  const staffSubject = `[Supporter Postbox] New letter from ${fullName}`;
  const staffHtml = buildHtmlWrapper(
    'New Supporter Letter',
    `
    <div style="text-align: left;">
      <span style="background-color: #FEF3C7; color: #D97706; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 50px; text-transform: uppercase;">
        Supporter Postbox
      </span>
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 16px 0 8px 0;">Message from ${fullName}</h2>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px; margin-bottom: 24px;">
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B; width: 140px;">Supporter:</td><td style="font-size: 14px; font-weight: 600; color: #0F172A;">${fullName} (<a href="mailto:${email}" style="color: #005D9A;">${email}</a>)</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Supported Projects:</td><td style="font-size: 14px; font-weight: 600; color: #005D9A;">${projects}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #64748B;">Financial Pledge:</td><td style="font-size: 14px; font-weight: 600; color: #059669;">${financialGift} (${frequency})</td></tr>
      </table>

      <p style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 0 0 8px 0;">Letter of Well-Wishes:</p>
      <div style="background-color: #FFFFFF; border-left: 4px solid #00A651; border-radius: 0 8px 8px 0; padding: 14px 18px; font-size: 14px; line-height: 1.6; color: #1E293B; font-style: italic;">
        "${letter}"
      </div>
    </div>
    `
  );

  const userSubject = `Thank you for your warm letter and support — Youth Organization Union`;
  const userHtml = buildHtmlWrapper(
    'Thank you for your support',
    `
    <div style="text-align: left;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Dear ${fullName},</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        Thank you for sending your warm encouragement to our project teams across the <strong>Youth Organization Union</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #64748B; margin: 0 0 24px 0;">
        Every word of solidarity fuels youth changemakers on the ground as they advance sustainable community impact.
      </p>

      <div style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 16px; margin-bottom: 28px;">
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Your Message to the Team:</p>
        <p style="margin: 0; font-size: 14px; color: #334155; font-style: italic; line-height: 1.6;">"${letter}"</p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
        With gratitude,<br>
        <strong style="color: #0B1A2B;">Youth Organization Union &amp; Partner Project Teams</strong>
      </p>
    </div>
    `
  );

  return { staffSubject, staffHtml, userSubject, userHtml };
}

// ── 5. Safe Background Dispatcher ──────────────────────────────────────────
export function sendSubmissionNotifications(
  type: SubmissionType,
  data: Record<string, any>,
  strapi: Core.Strapi
): void {
  setImmediate(async () => {
    try {
      if (!process.env.SMTP_HOST) {
        strapi.log.info(
          `[Email Service] SMTP_HOST not configured. Skipped automated email dispatch for ${type}.`
        );
        return;
      }

      const emailPlugin = strapi.plugin('email');
      if (!emailPlugin?.service('email')) {
        strapi.log.warn('[Email Service] Email plugin is not available.');
        return;
      }

      let templates: { staffSubject: string; staffHtml: string; userSubject: string; userHtml: string };

      switch (type) {
        case 'inquiry':
          templates = getInquiryTemplates(data);
          break;
        case 'leadership-application':
          templates = getLeadershipTemplates(data);
          break;
        case 'organization-application':
          templates = getOrganizationTemplates(data);
          break;
        case 'support-submission':
          templates = getSupportTemplates(data);
          break;
        default:
          return;
      }

      const sender = getSenderEmail();
      const staffEmail = getStaffEmail();
      const userEmail = data.email;

      // 1. Send Staff Alert
      await emailPlugin.service('email').send({
        to: staffEmail,
        from: sender,
        replyTo: userEmail || sender,
        subject: templates.staffSubject,
        html: templates.staffHtml,
      });

      strapi.log.info(`[Email Service] Sent staff notification for ${type} to ${staffEmail}`);

      // 2. Send User Confirmation Receipt
      if (userEmail && typeof userEmail === 'string' && userEmail.includes('@')) {
        await emailPlugin.service('email').send({
          to: userEmail,
          from: sender,
          replyTo: staffEmail,
          subject: templates.userSubject,
          html: templates.userHtml,
        });

        strapi.log.info(`[Email Service] Sent confirmation receipt for ${type} to ${userEmail}`);
      }
    } catch (error: any) {
      strapi.log.error(
        `[Email Service] Failed to send automated notification for ${type}: ${error?.message || error}`
      );
    }
  });
}