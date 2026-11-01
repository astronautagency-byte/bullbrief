# Microsoft 365 / Outlook setup

The read-only connection implementation is now available at `/connections`. It is not live with a mailbox until Microsoft Entra registration and a successful user authorization/sync have been completed. No Microsoft account has been authorized during development.

## Remaining Microsoft registration

1. Open Microsoft Entra admin center → App registrations → New registration. Name the app **BullBrief CRM**. Use **Accounts in this organizational directory only** for the initial work/school-tenant pilot. This implementation requires a specific tenant UUID; `common` and `organizations` are not accepted. Separate unrelated Microsoft tenants require a later multi-tenant design.
2. Under Authentication, add a **Web** platform with this exact local redirect URI:
   `http://localhost:3000/api/crm/microsoft/callback`
   A deployed app must instead use its canonical HTTPS origin with that same callback path. The configured redirect origin must match the actual application origin; do not mix localhost and 127.0.0.1.
3. Under API permissions, add **delegated** Microsoft Graph permissions `User.Read`, `Mail.ReadBasic`, `Calendars.ReadBasic`. The OAuth flow also requests `offline_access` for renewal. Review the permissions and your tenant's user/admin consent policy. Do not grant application-wide mailbox access, Mail.Send, Mail.ReadWrite or Calendars.ReadWrite for this pilot.
4. Record the **Application (client) ID** and **Directory (tenant) ID**. Create a confidential web-app client secret with an expiry, and store its **value** in server configuration. Never paste it into chat, CRM forms or committed files. The current adapter uses a client secret; certificate authentication is not implemented in this version.
5. Add these three settings to ignored `.env.local`, then restart the local Next server:
   ```dotenv
   MICROSOFT_CLIENT_ID=<Application client UUID>
   MICROSOFT_TENANT_ID=<Directory tenant UUID>
   MICROSOFT_CLIENT_SECRET=<Secret value, stored privately>
   ```
   Local `MICROSOFT_REDIRECT_URI` and a randomly generated 256-bit `MICROSOFT_TOKEN_ENCRYPTION_KEY` have been prepared in `.env.local`. That file is ignored by Git and restricted to the local user. Their values were not printed. Keep the encryption key stable; changing it makes existing token caches unreadable and requires reconnecting. Back it up using your approved secret manager.
6. Open **Email & Calendar** in BullBrief, select the firm, review the read-only access description and choose **Connect Outlook**. Complete Microsoft sign-in/consent with an authorized test mailbox containing fictional test data. No server or admin can authorize a mailbox merely by entering its address.
7. Choose **Sync now**, verify the imported metadata and visibility, then verify disconnect before real use.

For production, configure all five settings in the deployment's secret manager, register the exact production callback, and use a securely managed 64-character hexadecimal encryption key. Never expose any setting through `NEXT_PUBLIC_` variables. Key rotation needs a planned reconnect/re-encryption procedure; automatic key rotation is not implemented.

## Implemented behavior

- MSAL Node authorization-code flow with PKCE. Single-use, ten-minute database attempts bind signed-in user, active firm membership, state and an HttpOnly SameSite=Lax browser nonce. Callback errors return a generic status without forwarding codes or raw provider errors. MSAL logging is disabled.
- AES-256-GCM encryption protects serialized MSAL token caches and PKCE verifiers. Authenticated encryption binds caches to the user, firm and connection generation; ciphertext cannot be reused for another connection.
- Safe connection-status columns and private item metadata use owner-only RLS with active membership. Token/account/cache columns and pending attempts have no browser grants; mutations use a service-only RPC with a server-supplied actor. Firm owners/admins do not gain access to another member's mailbox snapshot.
- Manual, read-only full-window snapshots: Inbox metadata from the last 14 days; default calendar occurrences from the previous 7 through next 30 days. Message bodies, previews and attachments are not requested. Microsoft Graph paging is bounded to 500 mail items and 500 events; if a window is too large or a request fails, the prior snapshot remains intact. No silent partial success.
- Per-connection leases and a sixty-second attempt limit prevent concurrent manual syncs. MSAL silently refreshes cached credentials. Reauthentication is required when Microsoft access is no longer usable. Connection generations prevent old callbacks/syncs from overwriting a newer connection or resurrecting a disconnected one.
- Disconnect removes BullBrief credentials, pending attempts and private cached items. It does not delete messages/events at Microsoft and does not revoke the Entra consent grant. Users/admins can revoke Microsoft consent separately. No automatic background polling, sends or calendar writes occur.
- Shared audit events contain operation metadata and item counts, not tokens, subjects, senders or calendar contents. Private Outlook items are not automatically shared with households or sent to AI. Household publication, full content retrieval, external event creation and two-way sync are future work.

This is a rolling snapshot pilot, not delta synchronization, an email archive or a complete mailbox backup. Leaving Inbox or moving outside the window removes an item from the next successful snapshot. Disabled members cannot read or initiate/finish synchronization; credential retention after account deactivation still requires a firm operational policy.

## Verification

`npm run test:microsoft` covers authenticated encryption/context binding, minimal scopes, PKCE, secure cookies, callback handling without code leakage, authenticated actor/origin checks, Graph URL restrictions, metadata-only normalization and throttling using synthetic data and mocked network calls.

`npm run test:microsoft:db` runs transactional synthetic-user checks and rolls them back: actor/browser binding, replay/expiry, private status/item RLS even against same-firm admins, denied credential reads, atomic snapshots, concurrent sync exclusion, stale generations, and disconnect races.

Applied migrations: `20261031080000_crm_microsoft.sql` and `20261031080500_crm_microsoft_commands.sql`. The follow-up removes a shadowing local variable found during database testing.

A live release still requires a real authorized test mailbox completing OAuth, refresh, successful sync, reconnect and disconnect. Automated tests do not establish that Microsoft tenant permissions, registration or mailbox APIs are live.

Official references:
- https://learn.microsoft.com/en-us/graph/auth-v2-user
- https://learn.microsoft.com/en-us/entra/msal/javascript/node/acquire-token-requests
- https://learn.microsoft.com/en-us/entra/msal/javascript/node/caching
- https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0
- https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0

## Client meeting invitations

The scheduling release adds an optional **Enable meeting scheduling** choice on `/connections`. Add delegated `Calendars.ReadWrite` to the Entra registration and reconnect with that choice enabled. Read-only connections retain their existing scopes. Calendar event creation sends invitations to selected attendees without a separate `Mail.Send` permission: [Microsoft event creation](https://learn.microsoft.com/en-us/graph/api/user-post-events?view=graph-rest-1.0).

On `/schedule`, save a future meeting owned by the connected advisor, then use **Client invitation**. Select household contacts, verify their email addresses, enter a separate client-facing agenda and review the preview before sending. Contact profiles already store email and phone; phone is optional and is not an SMS destination. Internal agendas, scratchpads and financial notes are excluded. Teams meeting generation requires an eligible Microsoft account and tenant support.

A successful response records **Accepted by Microsoft**, not verified recipient delivery or acceptance. The provider event ID, invitation recipients and Teams/Outlook links are persisted with a household-scoped audit receipt. A durable single-submission record and Graph transaction ID prevent repeat submissions. A network timeout or uncertain response blocks automatic retry; inspect Outlook before reconciliation. Definite rejection permits a newly reviewed attempt. There is no background send queue.

Rescheduling or cancellation after submission must currently be managed in Outlook. BullBrief blocks local time/title/location/owner edits and cancellation for submitted invitations to avoid silently diverging from the invitation; the original BullBrief schedule remains a snapshot. RSVP synchronization, changes flowing back from Outlook and SMS reminders remain future work. Disconnecting Outlook does not cancel an existing meeting or retract invitations; a provider request already in flight can still complete.

Verification: `npm run test:crm-invitations`, `npm run test:crm-invitations:db`, existing Microsoft and calendar tests, TypeScript, ESLint and production build. Automated provider calls are mocked and synthetic DB records are rolled back. No real client invitation has been sent. Live authorization and authorized pilot-mailbox invitation delivery remain gated on Entra setup.
