<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- H2O Map UI lives in src/app/h2o, data helpers in src/lib/h2o, translations in src/i18n — keep pages thin route wrappers over these modules (ported as-is from the original project).
- Google sign-in uses supabase.auth.signInWithOAuth returning to /auth (external Supabase, so the Lovable auth broker is unavailable).
- Offline/install support uses vite-plugin-pwa generateSW with registration only via src/lib/pwa.ts, which refuses preview hosts.
- H2O input schemas in src/lib/h2o/validation.ts mirror database constraints and validate record input before uploads and writes, so invalid record input is rejected before uploading photos.
- Auth callback URLs and same-origin destination validation live in src/lib/authRedirect.ts, so email and Google returns use the same public callback boundary.
- Role checks are security-invoker, caller-scoped functions; anonymous read policies never call has_role, preventing role enumeration without removing admin access.
- Photo reads follow referencing records' RLS plus uploader access; new attachments must belong to the caller, keeping unpublished uploads private.
- Language writes are serialized and profile synchronization is revision-guarded so slow requests cannot overwrite a newer choice; failed saves are surfaced through translated notifications.
- Lint excludes integration-generated files and exempts only existing colocated shared APIs from Fast Refresh restrictions, avoiding unrelated module restructuring.

- Public landing copy is URL-static in src/app/h2o/landing; / and /en bypass app language/auth subscriptions so landing navigation never saves profile preferences. The existing MapPage is mounted unchanged at /map.
