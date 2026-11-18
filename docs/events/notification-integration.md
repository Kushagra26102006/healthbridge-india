# HealthBridge India — Domain Event to Notification Integration (Day 8 Task 03)

## 1. End-to-End Pipeline

```
Domain Event (Outbox)
  -> unifiedNotificationEventHandler (idempotent per eventId)
  -> NotificationRecipientResolver (validates ObjectIds + role authorization + Admin PHI boundary)
  -> NotificationTemplateRegistry (renders neutral, privacy-safe title/message/linkUrl)
  -> NotificationPreferenceService (respects user channel/category prefs; enforces mandatory SECURITY)
  -> NotificationModel.create() (persisted FIRST with SHA-256 idempotencyKey + 90-day retention)
  -> NotificationDeliveryService (in-app active; Email/SMS only when external credentials configured)
  -> NotificationStreamService (per-user SSE push with id: header + dashboard_sync hint)
```

## 2. Privacy Protection Guarantees

- Neutral wording only (e.g., `"Your appointment status has been updated. Sign in to view the details."`, `"A laboratory report is ready to view in your account."`).
- Defense-in-depth `sanitizeNotificationText()` strips diagnoses, numeric lab values/units (`mg/dL`, `HbA1c`), medication dosages, 14-digit ABHA numbers, 12-digit Aadhaar numbers, and Bearer tokens.
- `ADMIN` accounts are strictly prevented by `NotificationRecipientResolver` from receiving patient clinical notifications.
- External Email/SMS providers are NOT faked: `NotificationDeliveryService.getConfiguredChannels()` reports `email: false` and `sms: false` when SMTP/SES/Twilio/MSG91 environment variables are absent, while keeping in-app notifications fully operational.
