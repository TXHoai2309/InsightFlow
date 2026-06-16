# InsightFlow — System Architecture

> Phiên bản: 1.0 | Trạng thái: Draft | Cập nhật: 2025

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Sơ đồ kiến trúc hệ thống](#2-sơ-đồ-kiến-trúc-hệ-thống)
3. [Phân tầng xử lý (Processing Pipeline)](#3-phân-tầng-xử-lý-processing-pipeline)
4. [Chi tiết từng service](#4-chi-tiết-từng-service)
5. [Data Flow & Event Streaming](#5-data-flow--event-streaming)
6. [Database Design](#6-database-design)
7. [AI / NLP Architecture](#7-ai--nlp-architecture)
8. [Real-time & Notification](#8-real-time--notification)
9. [Infrastructure & Deployment](#9-infrastructure--deployment)
10. [Security Architecture](#10-security-architecture)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Quyết định kiến trúc (ADR)](#12-quyết-định-kiến-trúc-adr)
13. [DevOps & CI/CD](#13-devops--cicd)
---

## 1. Tổng quan kiến trúc

InsightFlow được thiết kế theo kiến trúc **Event-Driven Microservices**, với các thành phần chính:

- **Crawling Service**: Thu thập dữ liệu từ nhiều nguồn công khai.
- **NLP Service**: Phân tích AI (sentiment, topic, intent) — tách biệt khỏi crawling.
- **Alert Service**: Phát hiện và gửi cảnh báo real-time.
- **Lead Service**: Chấm điểm và push Hot Lead cho đội Sales.
- **API Gateway**: RESTful + WebSocket cho frontend.
- **Web Dashboard**: Next.js SPA với cập nhật real-time.

### Nguyên tắc thiết kế

| Nguyên tắc | Giải thích |
|-----------|------------|
| **Event-Driven** | Kafka làm trung gian; các service không gọi nhau trực tiếp |
| **Data Source Abstraction** | Adapter pattern cho từng nền tảng; thay đổi 1 adapter không ảnh hưởng pipeline |
| **Tiered Processing** | Fast-path (rule-based, < 1s) + Deep-path (NLP, 5–10s) |
| **Multi-tenant Isolation** | Row-level security, mỗi tenant có namespace riêng trên Kafka |
| **Graceful Degradation** | Nếu 1 data source bị chặn → tăng cường từ nguồn khác, không sập hệ thống |

---

## 2. Sơ đồ kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                             │
│  [Facebook API]  [TikTok]  [Báo điện tử]  [YouTube API]        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CRAWLING SERVICE (Python)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ facebook │  │  tiktok  │  │   news   │  │   youtube    │   │
│  │ adapter  │  │ adapter  │  │ adapter  │  │   adapter    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                  │
│  [APScheduler — Tiered crawl]  [Health Monitor]                 │
│  [Dedup (MinHash LSH)]  [PII Anonymizer]  [Spam Filter]        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ raw-content (Kafka topic)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   APACHE KAFKA (Message Queue)                   │
│                                                                  │
│  Topics:                                                         │
│  ├── raw-content          (crawler → NLP)                       │
│  ├── matched-content      (NLP fast-path → NLP deep-path)       │
│  ├── analyzed-content     (NLP → DB writer, alert engine)       │
│  ├── crisis-alerts        (alert engine → notification)         │
│  └── hot-leads            (intent analyzer → lead service)      │
└──────┬─────────────────────────────────┬───────────────────────┘
       │                                 │
       ▼                                 ▼
┌──────────────────┐          ┌──────────────────────────────────┐
│  NLP SERVICE     │          │   ALERT ENGINE (Node.js)         │
│  (Python/FastAPI)│          │                                  │
│                  │          │  [Spike Detector]                │
│  ┌────────────┐  │          │  [High-reach Detector]           │
│  │ Fast-path  │  │          │  [Sensitive Topic Detector]      │
│  │ (< 1s)    │  │          │                                  │
│  └─────┬──────┘  │          └──────────────┬───────────────────┘
│        │         │                         │
│  ┌─────▼──────┐  │          ┌──────────────▼───────────────────┐
│  │ Deep-path  │  │          │   NOTIFICATION SERVICE           │
│  │ (5-10s)   │  │          │                                  │
│  │ Sentiment  │  │          │  [Telegram Bot]                  │
│  │ Topic      │  │          │  [Zalo OA]                       │
│  │ Intent     │  │          │  [Email (SendGrid)]              │
│  └────────────┘  │          └──────────────────────────────────┘
└──────────────────┘
       │
       ▼ analyzed-content
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│                                                                  │
│  [PostgreSQL 16]  [Elasticsearch]  [Redis]  [S3 Storage]        │
│                                                                  │
│  PostgreSQL: mentions, nlp_results, alerts, leads, reports      │
│  Elasticsearch: full-text search, analytics aggregation         │
│  Redis: alert queue, WebSocket sessions, rate-limit             │
│  S3: raw crawl data, report PDFs, model artifacts               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Node.js/Express)                 │
│                                                                  │
│  REST API  +  WebSocket (Socket.IO)                             │
│  [Auth Middleware]  [Rate Limiter]  [Multi-tenant Guard]        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WEB DASHBOARD (Next.js 14)                     │
│                                                                  │
│  [Dashboard]  [Mentions]  [Leads]  [Alerts]  [Reports]         │
│  [Real-time WebSocket]  [Zustand Store]  [React Query]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Phân tầng xử lý (Processing Pipeline)

### 3.1 Fast-path (Latency < 1 giây)

Mục tiêu: lọc nhanh để tách mention liên quan từ lượng lớn raw content.

```
raw-content (Kafka)
    │
    ▼
Keyword Matcher (rule-based)
    │ → không match: discard
    │ → match: push vào matched-content topic
    ▼
Crisis Alert Pre-check (rule-based spike counter)
    │ → nếu đã vượt ngưỡng sơ bộ: gửi provisional alert
    ▼
matched-content (Kafka)
```

**Stack:** Python, Redis (spike counter), simple string matching với Aho-Corasick algorithm.

---

### 3.2 Deep-path (Latency 5–10 giây)

Mục tiêu: phân tích ngữ nghĩa sâu cho các mention đã pass fast-path.

```
matched-content (Kafka)
    │
    ▼
NLP Pipeline Worker (parallel workers)
    ├── Spam Classifier → discard nếu spam
    ├── PII Anonymizer → mask thông tin cá nhân
    ├── Sentiment Analyzer (PhoBERT)
    │   └── Confidence < 0.6: gắn "uncertain" → human review queue
    ├── Topic Labeler (multi-label)
    └── Intent Analyzer → classify Hot/Warm/Cold/None
    │
    ▼
analyzed-content (Kafka)
    │
    ├── → DB Writer (PostgreSQL + Elasticsearch)
    ├── → Alert Engine (kiểm tra ngưỡng chính xác)
    └── → Lead Service (nếu intent != none)
```

**Stack:** Python, FastAPI, Hugging Face Transformers (PhoBERT), Redis (consumer group).

---

### 3.3 Tiered Crawling Schedule

```
Giờ cao điểm (7-9h, 11-13h, 19-22h)
  └── Crawl interval: 5 phút / nguồn
  └── Crisis-watch keyword: 1 phút / nguồn

Giờ thường (9-11h, 13-19h)
  └── Crawl interval: 15 phút / nguồn

Giờ thấp điểm (22h-7h)
  └── Crawl interval: 30 phút / nguồn
  └── Crisis-watch keyword: 5 phút / nguồn
```

---

## 4. Chi tiết từng service

### 4.1 Crawling Service

**Ngôn ngữ:** Python 3.11  
**Framework:** FastAPI (health API) + APScheduler (cron jobs)

```
services/crawler/
├── sources/                   # Adapter pattern
│   ├── base.py                # Abstract Crawler base class
│   ├── facebook.py            # Meta Graph API + playwright fallback
│   ├── tiktok.py              # httpx + playwright
│   ├── news.py                # RSS feeds + custom scraper
│   └── youtube.py             # YouTube Data API v3
├── pipeline/
│   ├── normalizer.py          # Chuẩn hóa data format
│   ├── dedup.py               # MinHash LSH (datasketch)
│   ├── pii_filter.py          # Presidio PII masking
│   └── spam_filter.py         # Binary classifier: spam/non-spam
├── health_monitor.py          # Check source last-seen timestamp
├── scheduler.py               # APScheduler với tiered intervals
└── producer.py                # Kafka producer
```

**Anti-scraping mitigations:**
- Residential proxy pool rotation
- Randomize request delay (2–8 giây)
- Rotate User-Agent per request
- Giảm tốc độ crawl trong giờ cao điểm
- Ưu tiên Meta Graph API chính thức cho Facebook

---

### 4.2 NLP Service

**Ngôn ngữ:** Python 3.11  
**Framework:** FastAPI

```
services/nlp/
├── fast_path/
│   └── keyword_filter.py     # Aho-Corasick multi-pattern matching
├── pipelines/
│   ├── spam_filter.py        # Logistic Regression / fine-tuned small model
│   ├── pii_anonymizer.py     # Microsoft Presidio
│   ├── mention_detector.py   # Context relevance check
│   ├── sentiment.py          # PhoBERT fine-tuned, 3-class
│   ├── topic_labeler.py      # Multi-label classification
│   └── intent_analyzer.py    # Purchase intent (Hot/Warm/Cold)
├── models/
│   ├── phobert/              # Weights + tokenizer
│   └── configs/              # Model hyperparams
├── feedback/
│   └── relabel_collector.py  # Thu thập human corrections
└── worker.py                 # Kafka consumer + parallel processing
```

**Model Architecture:**
- **Sentiment:** PhoBERT → Fine-tune với dataset tiếng Việt MXH (bao gồm sarcasm cases)
- **Topic:** Multi-label classifier (mBERT) với custom head
- **Intent:** Rule-based + keyword dictionary → Fast; Small fine-tuned BERT → Accurate
- **Spam:** TF-IDF + Logistic Regression (đủ fast, không cần GPU)

---

### 4.3 Alert Service

**Ngôn ngữ:** Node.js + TypeScript  
**Framework:** Express

```
services/alert/
├── engine/
│   ├── spike_detector.ts     # Sliding window counter (Redis)
│   ├── high_reach_detector.ts
│   └── sensitive_topic.ts    # Topic frequency counter
├── channels/
│   ├── telegram.ts           # Telegram Bot API
│   ├── zalo.ts               # Zalo Official Account API
│   └── email.ts              # SendGrid
├── consumer.ts               # Kafka consumer: analyzed-content
└── alert_store.ts            # PostgreSQL write
```

**Spike Detection Algorithm:**
```
window_size = 15 phút
baseline = avg(mention_tiêu_cực, 7 ngày trước, cùng giờ)
current_count = count(mention_tiêu_cực, 15 phút vừa qua)

if current_count > 3 * baseline AND current_count > min_threshold:
    trigger_alert(severity="high")
```

---

### 4.4 Lead Service

**Ngôn ngữ:** Node.js + TypeScript

```
services/lead/
├── scorer.ts                 # Phân loại Hot/Warm/Cold từ intent data
├── expiry.ts                 # Tính và track Lead Expiry
├── pusher.ts                 # Push notification < 60s
└── consumer.ts               # Kafka consumer: hot-leads
```

**Lead Classification Logic:**
```typescript
enum IntentType { HOT, WARM, COLD, NONE }

function classifyLead(signals: string[]): IntentType {
  const hotKeywords = ["cần mua ngay", "mua ở đâu", "giá bao nhiêu", "order ngay"]
  const warmKeywords = ["đang tìm", "so sánh", "review", "ai dùng rồi chưa"]
  
  if (signals.some(s => hotKeywords.includes(s))) return IntentType.HOT
  if (signals.some(s => warmKeywords.includes(s))) return IntentType.WARM
  return IntentType.COLD
}

// Hot Lead: expires in 30 phút
// Warm Lead: expires in 24 giờ
// Cold Lead: expires in 7 ngày
```

---

### 4.5 API Gateway

**Ngôn ngữ:** Node.js + TypeScript  
**Framework:** Fastify (hiệu năng cao hơn Express)

```
apps/api/
├── routes/
│   ├── auth.ts
│   ├── workspaces.ts
│   ├── mentions.ts
│   ├── dashboard.ts
│   ├── alerts.ts
│   ├── leads.ts
│   └── reports.ts
├── middleware/
│   ├── auth.ts               # JWT verify + user context
│   ├── tenant.ts             # Multi-tenant guard
│   ├── rate_limit.ts         # Redis-based rate limiter
│   └── logger.ts             # Structured logging
├── services/
│   ├── mention_service.ts    # Query PostgreSQL + Elasticsearch
│   ├── dashboard_service.ts  # Aggregation queries
│   └── report_service.ts     # Trigger report generation
└── websocket.ts              # Socket.IO setup
```

---

### 4.6 Web Dashboard

**Framework:** Next.js 14 App Router  
**Real-time:** Socket.IO client

```
apps/web/src/
├── app/
│   ├── (auth)/               # Login layout group
│   ├── dashboard/            # Overview page
│   ├── brands/               # Workspace management
│   ├── mentions/             # Mention list + filter
│   ├── leads/                # Lead list + countdown
│   ├── alerts/               # Alert history
│   └── reports/              # Report list + download
├── components/
│   ├── charts/
│   │   ├── SentimentDonut.tsx
│   │   ├── SentimentTrend.tsx
│   │   ├── TopSources.tsx
│   │   └── TopTopics.tsx
│   ├── leads/
│   │   ├── LeadCard.tsx      # Card với countdown timer
│   │   └── LeadList.tsx
│   └── alerts/
│       ├── AlertBanner.tsx   # Real-time alert popup
│       └── AlertHistory.tsx
├── stores/
│   ├── workspace.store.ts
│   ├── alert.store.ts        # Real-time alerts via WebSocket
│   └── lead.store.ts
└── hooks/
    ├── useWebSocket.ts       # Subscribe alerts + leads real-time
    └── useDashboard.ts       # React Query dashboard data
```

---

## 5. Data Flow & Event Streaming

### Kafka Topics

| Topic | Producer | Consumer | Retention |
|-------|----------|----------|-----------|
| `raw-content` | Crawler | NLP Fast-path | 1 ngày |
| `matched-content` | NLP Fast-path | NLP Deep-path | 1 ngày |
| `analyzed-content` | NLP Deep-path | DB Writer, Alert Engine | 3 ngày |
| `crisis-alerts` | Alert Engine | Notification Service | 7 ngày |
| `hot-leads` | NLP Intent | Lead Service | 7 ngày |

### Message Format (analyzed-content)

```typescript
interface AnalyzedContent {
  mention_id: string
  workspace_id: string
  tenant_id: string
  source: {
    platform: "facebook" | "tiktok" | "news" | "youtube"
    url: string
    author_name: string           // public display only
    published_at: string          // ISO 8601
    credibility_score: number     // 0-100
  }
  content: {
    summary: string               // max 500 chars, PII masked
    raw_ref_id: string            // S3 key của raw content
  }
  nlp: {
    sentiment: "positive" | "negative" | "neutral"
    sentiment_confidence: number
    topics: string[]
    intent: "hot" | "warm" | "cold" | "none"
    intent_signals: string[]
    model_version: string
  }
  processed_at: string
}
```

---

## 6. Database Design

### PostgreSQL — Các index quan trọng

```sql
-- Lọc mention theo workspace + thời gian (query phổ biến nhất)
CREATE INDEX idx_mentions_workspace_published
  ON mentions (workspace_id, published_at DESC);

-- Lọc theo sentiment (dashboard aggregation)
CREATE INDEX idx_nlp_sentiment
  ON nlp_results (mention_id, sentiment);

-- Lead expiry check (Lead Countdown)
CREATE INDEX idx_leads_status_expires
  ON leads (workspace_id, status, expires_at)
  WHERE status = 'new';

-- Alert query
CREATE INDEX idx_alerts_workspace_triggered
  ON alerts (workspace_id, triggered_at DESC);
```

### Elasticsearch — Index Mapping

```json
{
  "mappings": {
    "properties": {
      "workspace_id": { "type": "keyword" },
      "content_summary": {
        "type": "text",
        "analyzer": "vietnamese"
      },
      "sentiment": { "type": "keyword" },
      "topics": { "type": "keyword" },
      "source_platform": { "type": "keyword" },
      "published_at": { "type": "date" },
      "credibility_score": { "type": "float" }
    }
  }
}
```

---

## 7. AI / NLP Architecture

### Model Selection Rationale

| Model | Task | Lý do chọn |
|-------|------|-----------|
| **PhoBERT** (VinAI) | Sentiment | Pre-trained tiếng Việt, state-of-the-art cho Vietnamese NLP |
| **mBERT** | Topic labeling | Đa ngôn ngữ, flexible fine-tuning |
| **Custom rule-based + small BERT** | Intent | Rule-based đủ nhanh cho hot keywords; BERT cho edge cases |
| **TF-IDF + LogReg** | Spam filter | Không cần GPU, inference < 10ms |
| **Presidio (Microsoft)** | PII masking | Production-ready, nhiều entity types |
| **MinHash LSH** | Deduplication | Sub-linear time, phù hợp real-time |

### Training Data Strategy

```
Giai đoạn 1 (Bootstrap):
├── Thu thập 10,000 bài viết xoay quanh 9 thương hiệu F&B mục tiêu (thuộc các nhóm Nhỏ, Vừa, Lớn)
├── Gán nhãn thủ công sentiment + topic + sarcasm cases
└── Fine-tune PhoBERT → baseline model

Giai đoạn 2 (Human-in-the-loop):
├── User relabel incorrect predictions trong app
├── Mỗi 2 tuần: batch fine-tune từ correction data
└── A/B test model mới vs. model cũ trên validation set

Giai đoạn 3 (Vertical expansion):
├── Xây test-set riêng cho từng thương hiệu / ngành mới
├── SLA trigger: accuracy < 85% → alert AI team
└── Personalized fine-tuning theo client (nếu có đủ data)
```

### Inference Architecture

```
Request → Load Balancer
    │
    ├── Fast-path workers (CPU-only, 8 replicas)
    │   └── Keyword matching + Spam filter
    │
    └── Deep-path workers (GPU, 2-4 replicas, HPA)
        └── PhoBERT sentiment + topic + intent
        └── Batch size: 32 items / inference call
        └── GPU: NVIDIA T4 (GCP) hoặc equivalent
```

---

## 8. Real-time & Notification

### WebSocket Architecture

```
Client (Next.js)
    │ WebSocket (Socket.IO)
    ▼
API Gateway
    │ Subscribe to Redis PubSub channels:
    │   ├── alerts:{workspace_id}
    │   └── leads:{workspace_id}
    ▼
Redis PubSub
    │ Published by:
    ├── Alert Service → alerts:{workspace_id}
    └── Lead Service → leads:{workspace_id}
```

### Notification Flow (Crisis Alert)

```
Alert Engine phát hiện spike
    │ (< 30 giây từ last analyzed mention)
    ▼
Push vào Kafka: crisis-alerts
    │
    ▼
Notification Worker consume
    │
    ├── Telegram Bot API → message đến group Sales/PR
    ├── Zalo OA API → message đến Zalo nhóm
    ├── SendGrid → Email
    └── Redis PubSub → WebSocket push đến Dashboard
```

**Target latency end-to-end: < 3 phút từ publish đến user nhận notification.**

---

## 9. Infrastructure & Deployment

### Kubernetes Architecture

```yaml
# Namespace per environment: insightflow-prod, insightflow-staging

Deployments:
├── web-dashboard         (2 replicas, min)
├── api-gateway           (3 replicas, min)
├── crawler-worker        (2 replicas)  
├── nlp-fast-path         (4 replicas CPU)
├── nlp-deep-path         (2 replicas GPU, HPA: 2-8)
├── alert-service         (2 replicas)
├── lead-service          (2 replicas)
└── report-service        (1 replica, scheduled jobs)

HPA Config (nlp-deep-path):
├── minReplicas: 2
├── maxReplicas: 8
├── metric: Kafka consumer group lag
└── scaleUp: lag > 1000 messages → +2 pods
    scaleDown: lag < 100 messages 5 phút liên tục → -1 pod
```

### Docker Compose (Local Dev)

```yaml
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports: ["9092:9092"]
  
  elasticsearch:
    image: elasticsearch:8.13.0
    ports: ["9200:9200"]
  
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
```

### CI/CD Pipeline

```
Git Push → GitHub Actions
    │
    ├── Lint + Type Check (pnpm typecheck)
    ├── Unit Tests (Jest / pytest)
    ├── Integration Tests (Docker Compose)
    │
    ▼ (main branch only)
    ├── Build Docker images
    ├── Push to Container Registry
    └── Deploy to Kubernetes (kubectl apply)
        ├── Rolling update strategy
        └── Health check trước khi shift traffic
```

---

## 10. Security Architecture

### Authentication Flow

```
User Login
    │
    ▼
API Gateway: POST /auth/login
    │ Verify password (bcrypt)
    │ Generate: access_token (15 phút) + refresh_token (7 ngày)
    │ Lưu refresh_token hash vào Redis
    ▼
Client lưu token trong httpOnly cookie

Subsequent Requests:
    │ Bearer token trong Authorization header
    ▼
API Gateway Middleware
    ├── Verify JWT signature
    ├── Check token expiry
    ├── Extract: userId, tenantId, role
    └── Inject vào request context

Token Refresh:
    │ POST /auth/refresh với refresh_token cookie
    ▼
    ├── Verify refresh_token hash trong Redis
    ├── Rotate: invalidate old, issue new pair
    └── Update Redis
```

### Multi-tenant Data Isolation

```sql
-- Tất cả queries PHẢI có tenant_id constraint
-- API Gateway inject tenantId từ JWT vào query context
-- Prisma middleware tự động thêm WHERE tenant_id = $tenantId

-- Ví dụ:
SELECT * FROM mentions m
JOIN workspaces w ON m.workspace_id = w.id
WHERE w.tenant_id = $1  -- ← luôn có điều kiện này
```

### Data Privacy

```
PII Anonymization Pipeline (trước khi lưu DB):
├── Số điện thoại: 0912345678 → 091*****78
├── CMND/CCCD: detected & removed
├── Địa chỉ nhà cụ thể: detected & generalized
└── Chỉ giữ: author_display_name (public info)

Báo điện tử:
└── Chỉ lưu: headline + summary (< 300 chars) + URL
    (tránh vi phạm bản quyền)
```

---

## 11. Monitoring & Observability

### Stack

| Layer | Công cụ |
|-------|---------|
| Metrics | **Prometheus** + **Grafana** |
| Logging | **Loki** + **Grafana** |
| Tracing | **OpenTelemetry** + **Jaeger** |
| Alerting | **Alertmanager** → PagerDuty |
| Uptime | **Uptime Kuma** |

### Key Metrics Dashboard

```
Business Metrics:
├── Mentions ingested / phút (theo tenant)
├── Sentiment distribution (rolling 24h)
├── Crisis Alert count (theo ngày)
├── Hot Lead count (theo ngày)
└── Report generation success rate

System Metrics:
├── Kafka consumer group lag (fast-path, deep-path)
├── NLP inference latency P50/P95/P99
├── API Gateway response time P95
├── Crawler success rate / nguồn
└── GPU utilization (nlp-deep-path pods)

SLA Alerts:
├── Crisis Alert latency > 3 phút → PagerDuty
├── Kafka lag > 5000 messages → Scale up alert
├── Crawler source down > 30 phút → Slack alert
├── Sentiment accuracy < 85% on test-set → Slack alert
└── API P95 > 1s → PagerDuty
```

---

## 12. Quyết định kiến trúc (ADR)

### ADR-001: Kafka thay vì RabbitMQ

**Bối cảnh:** Cần message queue chịu được traffic spike (scandal = 100x traffic bình thường).

**Quyết định:** Chọn **Apache Kafka**.

**Lý do:**
- Kafka lưu message on-disk → consumer có thể replay nếu xử lý lỗi.
- Throughput cao hơn RabbitMQ đáng kể (triệu messages/giây).
- Consumer group offset cho phép nhiều service consume độc lập từ cùng topic.

---

### ADR-002: Tiered Processing (Fast-path + Deep-path)

**Bối cảnh:** Crisis Alert cần latency < 3 phút. NLP deep inference tốn 5–10 giây.

**Quyết định:** Tách thành 2 luồng xử lý độc lập.

**Lý do:**
- Fast-path (keyword matching) chạy trong < 1 giây → đủ nhanh cho sơ bộ crisis detection.
- Deep-path (NLP) chạy song song, không block crisis alert.
- Cho phép scale riêng biệt: fast-path cần CPU, deep-path cần GPU.

---

### ADR-003: PhoBERT cho Sentiment tiếng Việt

**Bối cảnh:** Tiếng Việt MXH có nhiều teencode, slang, sarcasm.

**Quyết định:** Fine-tune **PhoBERT** (VinAI).

**Lý do:**
- PhoBERT được pre-train trên corpus tiếng Việt lớn → hiểu ngữ cảnh tốt hơn mBERT.
- Có thể fine-tune trên data MXH tiếng Việt nội bộ.
- Community hỗ trợ tốt, tài liệu phong phú.

---

### ADR-004: PostgreSQL + Elasticsearch (không phải chỉ 1 DB)

**Bối cảnh:** Cần cả quan hệ dữ liệu rõ ràng (lead, alert, report) lẫn full-text search và aggregation analytics.

**Quyết định:** Dùng **cả hai**.

**Lý do:**
- PostgreSQL: ACID transactions, foreign key integrity, complex joins.
- Elasticsearch: Full-text search tiếng Việt, fast aggregation cho dashboard analytics.
- DB Writer service đồng bộ cả hai sau khi NLP xong.
- Elasticsearch là read replica → không làm phức tạp write path.

---

### ADR-005: Monorepo với Turborepo

**Bối cảnh:** Nhiều apps (web, api) và services (crawler, nlp, alert, lead, report) cần share types và utilities.

**Quyết định:** Dùng **Turborepo monorepo** cho phần Node.js/TypeScript.

**Lý do:**
- Shared types giữa web và api tránh duplication và runtime errors.
- Build cache tăng tốc CI/CD.
- Quản lý dependencies dễ hơn.
- Python services (crawler, nlp) vẫn là separate repos do khác ecosystem.
