# Güncel ER ve Tablo Envanteri

Güncelleme: Kasım 2026 (v0.2 Final Sürümü). PostgreSQL 17 / Drizzle ORM omurgası üzerinde toplam 48 tablo tanımlıdır. 

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
  fanzin_issues ||--o{ fanzin_pages : pages
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
  site_settings {
    text key
  }
  site_game_entries {
    uuid id
  }
  people_overrides {
    text slot
  }
  site_page_views {
    uuid id
  }
```

---

## Modüler Tablo Listesi

1. **Yönetim ve Güvenlik (Admin & Auth):** `admins`, `admin_roles`, `admin_sessions`, `admin_event_scopes`, `audit_logs`
2. **Etkinlik ve İçerik (Events & Content):** `events`, `event_categories`, `event_years`, `announcements`, `featured_slots`, `event_gallery`, `content_redirects`
3. **Medya (Media Engine):** `media_assets`, `media_variants`
4. **Form ve Başvurular (Forms & Submissions):** `forms`, `form_versions`, `form_fields`, `form_rules`, `submissions`, `submission_answers`, `submission_status_history`, `consents`
5. **UluJam ve Eşleştirme (Jam & Teams):** `applications`, `application_skills`, `teams`, `memberships`, `team_approvals`, `team_access`, `team_sessions`
6. **Oyun Kataloğu ve Dereceler (Games & Awards):** `games`, `game_credits`, `awards`, `finalists`, `site_game_entries`
7. **Kart ve Dijital Cüzdan (Cards & Wallet):** `cards`, `wallet_passes`, `apple_devices`, `apple_registrations`
8. **Link Merkezi (Link Hub):** `link_groups`, `links`
9. **Fanzin Modülü (Fanzin & Flipbook):** `fanzin_issues`, `fanzin_pages`
10. **CMS ve Dinamik Ayarlar (Site Settings & People):** `site_settings`, `people_overrides`
11. **Analitik (Analytics Engine):** `site_page_views`
12. **Altyapı ve Kuyruk (Operations & Infrastructure):** `outbox`, `idempotency_records`, `rate_limits`, `retention_runs`

---

## Güvenlik ve İzolasyon Standartları

- **Server-Only Sınırı:** Veritabanı sorguları ve şema importları kesinlikle `"server-only"` modülü altında tutulur. İstemci bileşenlerine asla doğrudan erişim verilmez.
- **Bileşik Dış Anahtarlar (Composite Foreign Keys):** Form/etkinlik, başvuru/sürüm, cevap/alan ve takım/etkinlik bileşik anahtarları veri sızıntısını ve çapraz erişimi veritabanı seviyesinde engeller.
- **İdempotency ve Outbox:** Tüm dış servis bildirimleri (e-posta, Google Wallet pass oluşturma) transaction içi outbox tablosu ve idempotency kontrolleriyle asenkron worker tarafından güvenle işlenir.
