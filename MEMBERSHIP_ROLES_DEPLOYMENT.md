# Membership roles and Documents rollout

## Scope

- Hero highlights: Continental Director, Deputy Continental Director, General Members.
- Open recruitment: Continental Director, Marketing & Communication Member, Secretary & Assistant.
- Marketing/Secretary submit personal details, an optional CV / Portfolio upload immediately before Profile Photo, continent and regional division. Assessment answers and other supporting documents are not collected for new applications in those roles.
- Director and legacy applications without Position retain the full flow. The public create API still requires Assessment and CV / Portfolio.
- Reviewer portal and notification emails display the actual applied role.
- Public Documents uses plain rows with Y.O.U gradient separators and retains the two membership audience groups. No document content, links, categories or historical application records are deleted.

## Deployment order

1. Back up the production database using the normal backup procedure.
2. Merge and deploy the backend change first. Wait for the image build/publish to succeed and redeploy the CMS container.
3. Verify CMS health and that existing Director applications still display their previous answers/files.
4. Merge and deploy the frontend change, including its reviewer portal.

For the CV follow-up, deploy the backend controller that retains `resumeCv` before the new frontend. The previous short-flow controller silently removed CV references even when it returned HTTP 201.

No manual data migration or table recreation is required by this change. The existing `assessment` and `resumeCv` attributes become optional at schema level to support the short flow; the create controller keeps Director requirements. Do not delete either attribute or any existing values. Do not roll back to a backend requiring Assessment/CV while the new frontend remains live.

## Acceptance checks

- Hero shows exactly the three highlights above, retains the Director JD link and excludes Marketing/Secretary from the card only.
- Open the Individual form both through Hero and `/?form=individual`. Position excludes General Member and Undefined.
- Marketing and Secretary see one optional CV / Portfolio upload immediately before Profile Photo. They reach Submit Application after Regional Division; successful records contain their Position, personal information, continent, region and the selected CV relation, without Assessment.
- Both short roles can submit without a CV. Director still requires CV in Assessment section 6.
- Switch from a partly completed Director form to Marketing/Secretary: no previous Assessment answers or Assessment-only supporting uploads are sent or saved; the shared CV / Portfolio field remains available.
- Director still reaches all seven Assessment sections and requires CV / Portfolio; a complete application saves answers and file relations.
- Previously saved applications are unchanged and their historical answers/files remain readable.
- Documents sidebar markers and row separators use the Y.O.U gradient; file cards no longer have tinted backgrounds. Organization/Individual groups, revision metadata and download/open links remain available on desktop/mobile.

## Local verification

`npm run build`

`node scripts/smoke-organization-contact.cjs`

The smoke test creates a disposable SQLite database, disables email delivery and never loads production `.env`. It checks real HTTP persistence for both short roles with and without a CV, stale Assessment-field removal, Director validation, preserved answers and existing Organization submissions. It removes only its own temporary database afterward.
