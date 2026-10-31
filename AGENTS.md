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
- H2O input schemas in src/lib/h2o/validation.ts mirror database constraints and run before uploads and writes, so invalid input cannot leave uploaded files behind through validation failure.
- Auth callback URLs and same-origin destination validation live in src/lib/authRedirect.ts, so email and Google returns use the same public callback boundary.
