This folder groups server-side endpoints for creating users (professionals) inside an organization.

Naming conventions:

- Folder `create_user_in_organization` contains per-role subfolders (e.g. `coach`, `nutritionist`).
- Each role folder exposes a `create/route.ts` POST endpoint that accepts a JSON body with minimal professional data and will create the `Professional` and link it to the organization via `ProfessionalOrganization`.

Auditing:

- Endpoints record an `AuditLog` entry with `performedById` (the authenticated user) and `changes` payload.

Authorization:

- All endpoints require `orgSlug` query parameter and are guarded with `requireOrgAccess`.

Keep the API minimal — the frontend should call the invite flow if a full account lifecycle is required.
