# Design Notification System

## Problem Statement

Design a multi-channel notification system that sends notifications via push, email, SMS, and in-app messages with priority handling, delivery tracking, and rate limiting.

## Requirements

- Multiple channels (push, email, SMS, in-app)
- Priority levels (urgent, high, medium, low)
- Delivery tracking (sent, delivered, read)
- User preferences (opt-in/opt-out)
- Rate limiting (prevent spam)
- Retry logic for failures
- Templates and personalization

## Architecture

```
┌──────────────────────────────────────────┐
│       Notification API                    │
│  - Receives notification requests         │
└────────────┬─────────────────────────────┘
             │
┌────────────▼─────────────────────────────┐
│      Message Queue (Kafka)                │
│  Topics by priority: urgent, high,        │
│  medium, low                              │
└────────────┬─────────────────────────────┘
             │
        ┌────┴────┬────────┬────────┐
        │         │        │        │
   ┌────▼───┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐
   │ Push   │ │Email │ │ SMS  │ │In-App│
   │Service │ │Svc   │ │Svc   │ │Svc   │
   └────┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
        │        │       │       │
        ▼        ▼       ▼       ▼
     FCM/APNS SendGrid Twilio  WebSocket
```

## Database Design

```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY,
  user_id UUID,
  type VARCHAR(50),  -- order_shipped, message_received
  title VARCHAR(200),
  message TEXT,
  priority VARCHAR(20),  -- urgent, high, medium, low
  channels TEXT[],  -- ['push', 'email']
  data JSONB,  -- Custom payload
  created_at TIMESTAMP,

  INDEX idx_user (user_id, created_at DESC)
);

CREATE TABLE notification_deliveries (
  delivery_id UUID PRIMARY KEY,
  notification_id UUID REFERENCES notifications(notification_id),
  channel VARCHAR(20),  -- push, email, sms, in_app
  status VARCHAR(20),  -- pending, sent, delivered, failed, read
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  retry_count INT DEFAULT 0,

  INDEX idx_notification (notification_id),
  INDEX idx_status (status, sent_at)
);

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,  -- e.g., 22:00
  quiet_hours_end TIME,    -- e.g., 08:00
  preferences JSONB  -- Per-notification-type preferences
);
```

## Notification Flow

```python
class NotificationService:
    def send_notification(self, user_id, notification_type, data):
        # 1. Check user preferences
        prefs = self.get_user_preferences(user_id)

        if not self.should_send(prefs, notification_type):
            return {"status": "skipped", "reason": "user_preferences"}

        # 2. Determine channels
        channels = self.get_channels(notification_type, prefs)

        # 3. Apply rate limiting
        if not self.check_rate_limit(user_id, notification_type):
            return {"status": "throttled"}

        # 4. Create notification record
        notification_id = self.create_notification(user_id, notification_type, data)

        # 5. Queue for each channel
        for channel in channels:
            priority = self.get_priority(notification_type)

            kafka.publish(f"notifications_{priority}", {
                "notification_id": notification_id,
                "user_id": user_id,
                "channel": channel,
                "data": data
            })

        return {"notification_id": notification_id, "status": "queued"}

    def should_send(self, prefs, notification_type):
        # Check quiet hours
        if self.in_quiet_hours(prefs):
            if notification_type not in ['urgent_alert', 'security_alert']:
                return False

        # Check opt-out
        if prefs.get(f'{notification_type}_enabled') == False:
            return False

        return True
```

## Channel Workers

### Push Notification Worker

```python
class PushNotificationWorker:
    def process_message(self, message):
        user_id = message['user_id']
        data = message['data']

        # Get user's device tokens
        devices = db.query("""
            SELECT device_token, platform FROM user_devices
            WHERE user_id = ? AND push_enabled = true
        """, user_id)

        for device in devices:
            try:
                if device.platform == 'ios':
                    # Apple Push Notification Service
                    apns.send(device.device_token, {
                        "aps": {
                            "alert": data['message'],
                            "badge": 1,
                            "sound": "default"
                        }
                    })
                elif device.platform == 'android':
                    # Firebase Cloud Messaging
                    fcm.send(device.device_token, {
                        "notification": {
                            "title": data['title'],
                            "body": data['message']
                        },
                        "data": data.get('custom_data', {})
                    })

                # Update delivery status
                self.update_status(message['notification_id'], 'sent')

            except Exception as e:
                # Retry logic
                self.retry(message, error=str(e))
```

### Email Worker

```python
class EmailWorker:
    def process_message(self, message):
        user_id = message['user_id']
        data = message['data']

        # Get user email
        user = db.query("SELECT email, name FROM users WHERE user_id = ?", user_id)

        # Render template
        html = self.render_template(data['template'], data)

        # Send via SendGrid
        sendgrid.send({
            "to": user.email,
            "from": "notifications@example.com",
            "subject": data['subject'],
            "html": html
        })

        self.update_status(message['notification_id'], 'sent')
```

## Priority Queue

```python
# Kafka consumers with different priorities
# Urgent: 10 workers, poll every 100ms
# High: 5 workers, poll every 500ms
# Medium: 2 workers, poll every 1s
# Low: 1 worker, poll every 5s

class UrgentNotificationWorker:
    def run(self):
        while True:
            messages = kafka.poll(topic='notifications_urgent', timeout=100)
            for msg in messages:
                self.process(msg)

class LowNotificationWorker:
    def run(self):
        while True:
            messages = kafka.poll(topic='notifications_low', timeout=5000)
            for msg in messages:
                self.process(msg)
```

## Rate Limiting

```python
# Prevent spam
def check_rate_limit(user_id, notification_type):
    limits = {
        'promotional': (5, 3600),  # 5 per hour
        'transactional': (100, 3600),  # 100 per hour
        'urgent': (1000, 3600)  # 1000 per hour
    }

    limit, window = limits.get(notification_type, (10, 3600))

    key = f"notif_limit:{user_id}:{notification_type}:{int(time.time() // window)}"
    count = redis.incr(key)

    if count == 1:
        redis.expire(key, window)

    return count <= limit
```

## Retry Logic

```python
def retry_failed_notifications():
    # Find failed deliveries
    failed = db.query("""
        SELECT * FROM notification_deliveries
        WHERE status = 'failed'
        AND retry_count < 3
        AND sent_at > NOW() - INTERVAL '1 day'
    """)

    for delivery in failed:
        # Exponential backoff: 1min, 5min, 15min
        retry_delay = [60, 300, 900][delivery.retry_count]

        if time.time() - delivery.sent_at.timestamp() > retry_delay:
            # Retry
            kafka.publish('notifications_retry', {
                "delivery_id": delivery.delivery_id,
                "retry_count": delivery.retry_count + 1
            })
```

## Delivery Tracking

```python
# Webhook from push provider (FCM/APNS)
@app.route('/webhooks/push-delivery', methods=['POST'])
def push_delivery_webhook():
    data = request.json

    db.execute("""
        UPDATE notification_deliveries
        SET status = 'delivered', delivered_at = NOW()
        WHERE delivery_id = ?
    """, data['delivery_id'])

    return {"status": "ok"}

# Track read (user opens notification)
@app.route('/api/notifications/{notification_id}/read', methods=['POST'])
def mark_read(notification_id):
    db.execute("""
        UPDATE notification_deliveries
        SET status = 'read', read_at = NOW()
        WHERE notification_id = ?
    """, notification_id)

    return {"status": "read"}
```

## Analytics

```sql
-- Delivery rate by channel
SELECT channel,
       COUNT(*) as sent,
       COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
       COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
       COUNT(CASE WHEN status = 'delivered' THEN 1 END)::float / COUNT(*) as delivery_rate,
       COUNT(CASE WHEN status = 'read' THEN 1 END)::float / COUNT(*) as read_rate
FROM notification_deliveries
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY channel;
```

## Scaling

1. **Kafka Partitions**: Partition by user_id
2. **Worker Scaling**: Auto-scale based on queue depth
3. **Database Sharding**: Shard by user_id
4. **Batching**: Send 1000 emails in single SendGrid API call

## Monitoring

```
Performance:
- Processing time: p50 < 1s, p99 < 5s
- Queue depth: < 10K messages
- Delivery rate: > 95%

Business:
- Notifications sent per day: 100M
- Channel breakdown: push 60%, email 30%, SMS 5%, in-app 5%
- Read rate: push 20%, email 15%
```

## Interview Talking Points

"Notification system needs multi-channel delivery with priority handling. I'd use Kafka with priority topics (urgent/high/medium/low), separate workers per channel (push/email/SMS), and retry logic with exponential backoff. Rate limit to prevent spam (5 promotional/hour). Track delivery via webhooks from FCM/SendGrid. For scale, partition by user_id and auto-scale workers based on queue depth."
