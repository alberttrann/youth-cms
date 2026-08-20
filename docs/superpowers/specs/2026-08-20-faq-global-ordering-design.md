# FAQ Global Display Ordering

## Goal

Allow CMS editors to reorder the shared FAQ list once, with the same order rendered everywhere on the website.

## Design

Add a required integer `displayOrder` field to the FAQ collection. Strapi Content Manager exposes the field in the FAQ list and edit views. A custom FAQ admin list view provides drag-and-drop ordering; after a drop, it submits the complete ordered FAQ ID list to a dedicated reorder endpoint. The endpoint assigns sequential order values in one database transaction.

The order is global because FAQs are shared collection entries, not page-local dynamic-zone content. Existing question and answer fields remain unchanged.

## API

Add a protected reorder action for the FAQ collection. The request contains an ordered array of FAQ document IDs. Validate that IDs are unique, non-empty, and resolve to existing FAQs before writing. Assign `displayOrder` values in array order inside a transaction; reject the whole request on validation or persistence failure.

Keep the existing public `find` and `findOne` reads. The public frontend request adds `sort[0]=displayOrder:asc`; FAQ rendering remains unchanged because it already maps the API response order directly.

## Admin behavior

The FAQ list displays question, answer, and display order. Editors drag rows to the desired position and save automatically. The UI refreshes from the server after a successful reorder. On failure, it restores the previous local order and shows the existing admin error state. No drag-and-drop code is added to the public frontend.

## Testing

- Validate FAQ schema and generated TypeScript types through the Strapi build.
- Test reorder success, duplicate/unknown IDs, and atomic failure behavior.
- Test that the frontend request includes `displayOrder:asc` and preserves response order.
- Manually verify FAQ drag-and-drop in the Strapi Content Manager and public homepage order.

## Scope

Included: FAQ schema, generated types, FAQ reorder API, Strapi admin ordering UI, frontend sort query, focused tests.

Excluded: per-page FAQ ordering, public drag-and-drop, new FAQ fields, unrelated admin redesign, new dependencies unless the existing Strapi admin runtime cannot support the interaction without one.
