# Membership details synchronization

Deploy backend first, then frontend. New frontend sends fields that the old
backend rejects. Merge the backend PR, wait for CI to publish the image, then
pull/redeploy `youth-cms` before deploying the frontend PR.

## Organization applications

Facebook/Instagram/LinkedIn URLs already existed in the schema; the startup
layout update makes them visible with explicit labels. New activity uploads
use `organizationActivityPhotos`; `organizationImage` retains cover uploads
and historical mixed images. Old mixed images cannot be split automatically.

## Individual applications

`position` is a separate optional string for backward compatibility and future
role-specific forms. `assessment.appliedPosition` is still sent for existing
review tools. This change does not invent new questions for unfinished roles.

Ant Design omits unmounted assessment sections from onFinish values. The form
now reads the complete preserved store, including earlier answers and uploads.
Assessment answers remain in the JSON field; supporting documents are media
relations (`resumeCv`, `orgProfileDoc`, `leadershipProofDoc`, `additionalDocs`).

`resumeCv` is labeled CV / Portfolio and is the single current upload input.
The old `portfolio` string remains in the database, is hidden from the current
Strapi edit layout, and historical URLs remain accessible in the review portal.

Upload failures now stop submission instead of recording success without files.
Existing answers/files that were never submitted cannot be recovered.

## Verification

Run frontend application/proxy and wizard-preservation tests. Run backend build,
then `node scripts/smoke-organization-contact.cjs` to verify real local API
creation and persisted social profiles, separate media relations, Position,
assessment answers, all document fields, and Strapi admin visibility. Media
metadata is seeded only in a disposable SQLite database, not uploaded to production
or Cloudinary. Test an actual file upload on production after deployment.
