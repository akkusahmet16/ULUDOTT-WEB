# Güncel ER ve tablo envanteri

3 Ekim 2026: gerçek boş migration/restore tatbikatında43 public tablo. Eski [database.md](database.md) görev2–12 tarihî değişimlerini içerir; güncel kaynak src/db/schema ve migration journal.

```mermaid
erDiagram
  admins ||--o{ admin_roles : roles
  admins ||--o{ admin_sessions : sessions
  admins ||--o{ admin_event_scopes : scopes
  events ||--o{ admin_event_scopes : scopes
  event_categories o|--o{ events : category
  events ||--o| event_years : year
  events o|--o{ announcements : content
  events ||--o| featured_slots : featured
  media_assets ||--o{ media_variants : variants
  media_assets o|--o{ announcements : poster
  media_assets o|--o{ featured_slots : poster
  events o|--o{ forms : event
  forms ||--o{ form_versions : versions
  form_versions ||--o{ form_fields : fields
  form_versions ||--o{ form_rules : rules
  forms ||--o{ submissions : submissions
  form_versions ||--o{ submissions : snapshot
  submissions ||--o{ submission_answers : answers
  form_fields ||--o{ submission_answers : version_field
  submissions ||--o{ submission_status_history : history
  submissions ||--o{ consents : consent
  events ||--o{ applications : applications
  submissions o|--o| applications : specialised
  applications ||--o{ application_skills : skills
  events ||--o{ teams : teams
  teams ||--o{ memberships : roster
  applications ||--o{ memberships : membership_history
  teams ||--o{ team_approvals : revision_decisions
  team_approvals o|--o{ memberships : approved_revision
  admins ||--o{ team_approvals : approver
  teams ||--o| team_access : access
  teams ||--o{ team_sessions : sessions
  events ||--o{ games : games
  teams o|--o{ games : author
  media_assets o|--o{ games : cover
  games ||--o{ game_credits : credits
  applications o|--o{ game_credits : consenting_author
  events ||--o{ awards : ranks
  games ||--o| awards : award
  events ||--o{ finalists : finalists
  games ||--o| finalists : finalist
  applications ||--o| cards : card
  cards ||--o{ wallet_passes : providers
  apple_devices ||--o{ apple_registrations : registrations
  wallet_passes ||--o{ apple_registrations : registrations
  link_groups ||--o{ links : links
  admins ||--o{ audit_logs : actor
  events ||--o{ event_gallery : gallery
  media_assets ||--o{ event_gallery : image
  media_assets o|--o{ events : poster
  content_redirects {
    uuid content_id
  }
  outbox {
    uuid aggregate_id
  }
  idempotency_records {
    uuid resource_id
  }
  rate_limits {
    text scope
  }
  retention_runs {
    uuid id
  }
```

Tablolar: `admin_event_scopes`, `admin_roles`, `admin_sessions`, `admins`, `announcements`, `apple_devices`, `apple_registrations`, `application_skills`, `applications`, `audit_logs`, `awards`, `cards`, `consents`, `content_redirects`, `event_categories`, `event_gallery`, `event_years`, `events`, `featured_slots`, `finalists`, `form_fields`, `form_rules`, `form_versions`, `forms`, `game_credits`, `games`, `idempotency_records`, `link_groups`, `links`, `media_assets`, `media_variants`, `memberships`, `outbox`, `rate_limits`, `retention_runs`, `submission_answers`, `submission_status_history`, `submissions`, `team_access`, `team_approvals`, `team_sessions`, `teams`, `wallet_passes`.

Outbox/redirect/audit nesne kimliği polimorfik referanstır; tek hedefFK varsayılmaz. form/event, submission/version, answer/version-field ve team/event bileşikFK izolasyonu sağlar; active membership partial unique. Approval roster revision üzerinden bağlı; geç üye onaysızdır. Form yayın snapshotları trigger ile değişmez. AUTH ile şifreli capability replay ve MFA alanları PG yedek ve ayrı anahtar kasası ile kurtarılır; eposta/event tekil, telefon zorunlu. S3 media keys DB ile eşlenir; [restore](../operations/backup-restore.md).

Genel form yanıtları JSONB ve aranabilir kişi kolonları DB içinde açık değerdir; AUTH anahtarı bunları topluca şifrelemez. DB/disk erişimi, sunucu yetkisi ve şifreli dış yedek bu veriler için ayrıca korunur.
