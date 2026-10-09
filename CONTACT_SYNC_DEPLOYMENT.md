# Organization application contact synchronization

The schema now accepts `isPrimaryContact` (`yes` / `no`),
`contactPersonFullName`, `contactPersonEmail`, `contactPersonPhone`, and
`contactPersonPhoneCode`. Existing `representative*` fields continue to store
the Head of Organization; they are not renamed or deleted.

New contact fields are optional at schema level to preserve existing records
and allow cached old frontends to submit. The updated frontend requires name,
email and phone when a different contact is selected. When the head is the
primary contact, the frontend sends the head's details in the contact fields.

On first startup, the backend updates the Head/Contact labels and makes the
contact fields visible in Strapi's Content Manager, preserving other layout
customizations. This runs once and does not rewrite existing application data.

## Rollout order

1. Merge and deploy this backend change first. Wait for image publication and
   redeploy the `youth-cms` stack in Portainer using the new image.
2. Deploy the paired frontend change (payload, proxy, validation and review UI).
   Deploying the frontend before the backend may cause `Invalid key` errors.
3. Submit a test for both Yes and No, and confirm the separate Head/Contact fields
   in Organization Applications. This does not auto-publish a Member record.

Contact information discarded by previous frontend/proxy versions cannot be
recovered from Strapi. Existing records without a primary-contact answer remain
unknown; they are not silently classified as Yes or No.

## Local verification

After `npm run build`, run `node scripts/smoke-organization-contact.cjs`.
The smoke test starts a local Strapi server with a disposable SQLite database,
submits both contact scenarios and a legacy payload, reads the saved records,
and checks the Content Manager labels. It does not load production `.env`.
