# Security and reliability — current H2O Map project only

- [ ] Apply versioned security migration and verify role, report and photo policies.
- [ ] Fix language saving and test failed saves and racing changes.
- [ ] Resolve lint issues without changing the UI.
- [ ] Verify validation parity; run tests and lint; inspect automated type/build evidence.
- [ ] Report results and remaining authenticated/production verification blockers.

## Previous verification

- [x] Audit hosted constraints, grants, RLS, storage and security warnings.
- [x] Fix safe frontend validation and auth redirect issues; add regression tests.
- [x] Verify public browser flows and anonymous access restrictions.
- [ ] Verify authenticated workflows (blocked: external unmanaged authentication has no test session).
- [x] Check public Google settings and document manual configuration; private redirect allowlist is unavailable.
- [x] Review automated type-check/build evidence and run existing tests.
- [ ] Fresh production build (blocked: available harness runs automatic checks; no new production build was supplied).
- [x] Deliver PASS / FAIL / NOT TESTED report; do not alter the original project, providers, policies or admin privileges.