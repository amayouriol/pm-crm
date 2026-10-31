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

- Keep pasted LinkedIn summaries in a separate server-function module with request-local Responses helpers; preserve the existing applicant-summary integration.
- Mount the LinkedIn summarizer in the shared contact section and key it by applicant identity so pasted text and results never carry between applicants.
- LinkedIn summaries are transient and do not write to Sheets or create new columns; copying is explicit.
- Protect every CRM content route with the encrypted shared-team session and every private Sheets/AI server function with requireTeamGate; route guards alone do not secure RPC endpoints.
- Keep team-password comparison and cookie utilities in a dynamically imported server-only module; runtime secrets are read inside server handlers or server middleware, never in client code.
- Coordinate profile-exit cache cancellation, cache clearing, profile reset, and selector navigation in the browser-safe exitView helper so leaving a view remains separate from revoking the encrypted team gate.
- Keep team-wide application analytics in a browser-safe shared overview on the password-protected index; derive weekly cohorts from existing Sheets timestamps and decisions without adding columns, leaving staff routes operational.
