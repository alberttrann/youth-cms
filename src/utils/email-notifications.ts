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
  return process.env.EMAIL_DEFAULT_FROM || 'no-reply@youthorgunion.com';
}

function buildHtmlWrapper(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #EE334E 0%, #FCB131 33%, #00A651 67%, #0081C8 100%); height: 6px;"></td>
          </tr>
          <tr>
            <td style="background-color: #0B1A2B; padding: 24px 32px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
                Youth Organization Union (Y.O.U)
              </h1>
              <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 13px;">
                Where Unity Drives Change
              </p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F1F5F9; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; font-size: 12px; color: #64748B;">
                © ${new Date().getFullYear()} Youth Organization Union · Operating across 6 continents
              </p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748B;">
                <a href="https://youthorgunion.org" style="color: #005D9A; text-decoration: none; font-weight: 600;">youthorgunion.org</a> · <a href="mailto:info@youthorgunion.org" style="color: #005D9A; text-decoration: none;">info@youthorgunion.org</a>
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

  const staffSubject = `[Y.O.U Inquiry] New message from ${name} (${reason})`;
  const staffHtml = buildHtmlWrapper(
    'New Contact Inquiry',
    `
    <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">New Contact Inquiry Received</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">A visitor has submitted an inquiry via the website contact form:</p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Full Name:</strong> ${name}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #005D9A;">${email}</a></p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Phone:</strong> ${phone}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Reason for Contact:</strong> <span style="display: inline-block; background-color: #EBF4FA; color: #005D9A; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${reason}</span></p>
    </div>
    <p style="font-size: 14px; font-weight: 600; color: #0F172A; margin-bottom: 8px;">Message:</p>
    <div style="background-color: #FFFFFF; border-left: 4px solid #005D9A; padding: 12px 16px; font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
      ${message}
    </div>
    `
  );

  const userSubject = `We've received your message — Youth Organization Union`;
  const userHtml = buildHtmlWrapper(
    'Thank you for contacting Y.O.U',
    `
    <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">Dear ${name},</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Thank you for reaching out to the <strong>Youth Organization Union (Y.O.U)</strong>. We have received your inquiry regarding <strong>${reason}</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Our team typically reviews all messages within <strong>5–7 business days</strong> and will follow up with you directly if further information is required.
    </p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748B;">Summary of your message:</p>
      <p style="margin: 0; font-size: 14px; color: #334155; font-style: italic;">"${message}"</p>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Warm regards,<br>
      <strong>The Y.O.U Alliance Secretariat</strong>
    </p>
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

  const staffSubject = `[Leadership Application] New Candidate: ${fullName} (${continent} / ${region})`;
  const staffHtml = buildHtmlWrapper(
    'New Leadership Role Application',
    `
    <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">New Continental Director / Leadership Application</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">A candidate has applied for a leadership position via the portal:</p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Candidate Name:</strong> ${fullName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Continent / Region:</strong> ${continent} — ${region}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Country of Residence:</strong> ${country}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #005D9A;">${email}</a></p>
      <p style="margin: 0; font-size: 14px;"><strong>WhatsApp:</strong> ${phone}</p>
    </div>
    <p style="font-size: 14px; color: #475569;">
      You can review their full assessment responses and uploaded CV in the <strong>Strapi Admin Content Manager ➔ Leadership Applications</strong>.
    </p>
    `
  );

  const userSubject = `Application Received: Continental Director / Leadership Role — Y.O.U`;
  const userHtml = buildHtmlWrapper(
    'Leadership Application Received',
    `
    <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">Dear ${fullName},</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Thank you for submitting your application for the <strong>Continental Director / Leadership Role</strong> at the Youth Organization Union (Y.O.U).
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      We have successfully recorded your details and assessment responses for the <strong>${continent} (${region})</strong> region.
    </p>
    <div style="background-color: #F8FAFC; border-left: 4px solid #EE334E; padding: 14px 18px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #334155;">
        <strong>Next Steps:</strong> Our Executive Board is reviewing candidate applications in accordance with our recruitment criteria. If shortlisted, you will receive an interview invitation by email.
      </p>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Thank you for your dedication to youth empowerment and sustainable development.<br><br>
      Best regards,<br>
      <strong>Y.O.U Global Executive Board</strong>
    </p>
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

  const staffSubject = `[Organization Application] New Member Registration: ${orgName} (${country})`;
  const staffHtml = buildHtmlWrapper(
    'New Organization Registration',
    `
    <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">New Youth Organization Registration</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">An organization has submitted a membership application:</p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Organization Name:</strong> ${orgName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Country:</strong> ${country}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Representative:</strong> ${repName} (<a href="mailto:${email}" style="color: #005D9A;">${email}</a>)</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Focus Area:</strong> ${focusArea}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Key Project:</strong> ${projectName}</p>
    </div>
    <p style="font-size: 14px; color: #475569;">
      Review organization details in the <strong>Strapi Admin Content Manager ➔ Organization Applications</strong>.
    </p>
    `
  );

  const userSubject = `Registration Received: ${orgName} — Youth Organization Union`;
  const userHtml = buildHtmlWrapper(
    'Membership Application Received',
    `
    <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">Dear ${repName},</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Thank you for registering <strong>${orgName}</strong> to join the <strong>Youth Organization Union (Y.O.U)</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Your membership application has been received. Our Partnership Committee will review your organization profile, impact metrics, and alignment with the UN SDGs.
    </p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748B;">Registered Details:</p>
      <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Organization:</strong> ${orgName}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Project:</strong> ${projectName}</p>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      We look forward to collaborating and amplifying your youth-led impact globally.<br><br>
      Warm regards,<br>
      <strong>Y.O.U Membership & Partnerships Committee</strong>
    </p>
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
  const financialGift = escapeHtml(data.financialGiftDetails || 'None / Pure Encouragement Letter');
  const frequency = escapeHtml(data.donationFrequency || 'once');

  const staffSubject = `[Y.O.U Support] New Letter of Support from ${fullName}`;
  const staffHtml = buildHtmlWrapper(
    'New Support Letter & Pledge',
    `
    <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">New Supporter Letter & Contribution</h2>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Supporter Name:</strong> ${fullName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #005D9A;">${email}</a></p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Supported Projects:</strong> ${projects}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Financial Pledge / Gift Details:</strong> ${financialGift}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Donation Frequency:</strong> ${frequency}</p>
    </div>
    <p style="font-size: 14px; font-weight: 600; color: #0F172A; margin-bottom: 8px;">Letter of Support:</p>
    <div style="background-color: #FFFFFF; border-left: 4px solid #00A651; padding: 12px 16px; font-size: 14px; line-height: 1.6; color: #334155;">
      "${letter}"
    </div>
    `
  );

  const userSubject = `Thank you for your warm letter and support — Youth Organization Union`;
  const userHtml = buildHtmlWrapper(
    'Thank you for your support',
    `
    <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">Dear ${fullName},</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Thank you for sending your message of encouragement to our project teams across the <strong>Youth Organization Union</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Every word of support and every contribution helps fuel real-world youth action on the ground.
    </p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748B;">Your message to the team:</p>
      <p style="margin: 0; font-size: 14px; color: #334155; font-style: italic;">"${letter}"</p>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      With deepest gratitude,<br>
      <strong>Youth Organization Union & Project Teams</strong>
    </p>
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
  // Execute detached in the background so the HTTP response is never blocked
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

      // 1. Send Alert to Staff
      await emailPlugin.service('email').send({
        to: staffEmail,
        from: sender,
        replyTo: userEmail || sender,
        subject: templates.staffSubject,
        html: templates.staffHtml,
      });

      strapi.log.info(`[Email Service] Sent staff notification for ${type} to ${staffEmail}`);

      // 2. Send Confirmation Receipt to Applicant (if valid email provided)
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
      // Log error safely without leaking credentials or crashing Strapi
      strapi.log.error(
        `[Email Service] Failed to send automated notification for ${type}: ${error?.message || error}`
      );
    }
  });
}