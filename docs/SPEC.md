# InsightFlow — Functional Specification (SPEC)

> Phiên bản: 1.0 | Trạng thái: Draft | Cập nhật: 2025

---

## Mục lục

1. [Mục tiêu tài liệu](#1-mục-tiêu-tài-liệu)
2. [Người dùng & vai trò](#2-người-dùng--vai-trò)
3. [Luồng nghiệp vụ chính](#3-luồng-nghiệp-vụ-chính)
4. [Đặc tả chức năng chi tiết](#4-đặc-tả-chức-năng-chi-tiết)
5. [Quy tắc nghiệp vụ (Business Rules)](#5-quy-tắc-nghiệp-vụ-business-rules)
6. [API Endpoints tổng quan](#6-api-endpoints-tổng-quan)
7. [Database Schema (tóm tắt)](#7-database-schema-tóm-tắt)
8. [Yêu cầu phi chức năng (NFR)](#8-yêu-cầu-phi-chức-năng-nfr)
9. [KPI & SLA](#9-kpi--sla)
10. [Rủi ro & Giải pháp](#10-rủi-ro--giải-pháp)
11.

---

## 1. Mục tiêu tài liệu

Tài liệu này định nghĩa các **yêu cầu chức năng** của hệ thống InsightFlow, bao gồm:

- Mô tả hành vi mong muốn của từng tính năng.
- Quy tắc nghiệp vụ và điều kiện biên.
- Giao diện API ở mức tổng quan.
- SLA và KPI kỹ thuật cần đạt.

Đối tượng đọc: **Product Owner, Developer, QA, Tech Lead**.

---

## 2. Người dùng & vai trò

| Vai trò | Mô tả | Quyền truy cập |
|---------|-------|----------------|
| **Super Admin** | Quản trị hệ thống (Anthropic-level) | Toàn quyền + quản lý tenant |
| **Brand Admin** | Quản lý của doanh nghiệp client | Quản lý workspace, user, keyword |
| **Analyst** | Nhân viên phân tích của client | Đọc dashboard, export báo cáo |
| **Sales** | Đội kinh doanh của client | Xem Lead List, đánh dấu đã xử lý |
| **Marketing/PR** | Đội truyền thông của client | Xem mention, dashboard, cảnh báo |
| **Agency** | Đối tác Agency quản lý nhiều brand | Quản lý nhiều workspace brand |

### Multi-tenant Architecture

Mỗi **Tenant** (doanh nghiệp) có thể có nhiều **Workspace** (thương hiệu). Dữ liệu được cô lập hoàn toàn giữa các tenant. Một tenant không có > 60% dữ liệu đến từ 1 nền tảng duy nhất.

---

## 3. Luồng nghiệp vụ chính

### 3.1 Luồng Phòng vệ — Brand Monitoring & Crisis Alert

```
[Crawler] 
  → thu thập post/comment từ nguồn công khai
  → đẩy raw data vào Kafka topic: raw-content

[NLP Fast-path] 
  → lọc keyword match (rule-based, < 1s)
  → nếu khớp từ khóa của tenant: đẩy vào Kafka topic: matched-content

[NLP Deep-path] 
  → phân tích sentiment (Pos/Neg/Neu)
  → gắn nhãn chủ đề
  → lưu vào PostgreSQL + Elasticsearch

[Crisis Alert Engine]
  → kiểm tra ngưỡng spike mention tiêu cực
  → nếu vượt ngưỡng → gửi alert qua Telegram/Zalo/Email (< 3 phút)
  → cập nhật Dashboard real-time qua WebSocket
```

### 3.2 Luồng Tấn công — Lead Generation

```
[NLP Intent Analyzer]
  → phân tích purchase intent từ matched-content
  → phân loại: Hot Lead / Warm Lead / Cold Lead

[Lead Service]
  → Hot Lead: push ngay Zalo/Telegram Sales (< 60 giây)
  → Hiển thị Lead Expiry Countdown trên dashboard
  → Lưu lịch sử xử lý lead

[Sales Action]
  → Nhận alert với context đầy đủ (link, platform, tóm tắt)
  → Đánh dấu đã xử lý / bỏ qua / chuyển tiếp
```

### 3.3 Luồng Báo cáo tự động

```
[Report Scheduler]
  → Chạy hàng ngày lúc 7:00 sáng
  → Tổng hợp mention, sentiment, top nguồn, top chủ đề
  → Xuất PDF/Excel
  → Gửi qua Email / lưu S3 / hiển thị trong dashboard
```

---

## 4. Đặc tả chức năng chi tiết

### 4.1 Quản lý Workspace / Brand

**US-01: Tạo Workspace mới**

- Actor: Brand Admin
- Mô tả: Tạo workspace theo từng thương hiệu để theo dõi
- Inputs:
  - Tên thương hiệu (bắt buộc, thuộc 9 thương hiệu F&B mục tiêu: Highlands Coffee, Phúc Long, Cộng Cà Phê, KATINAT, Phê La, Pizza 4P's, XLIII Coffee, Maison Marou, Laha Cafe)
  - Phân nhóm quy mô thương hiệu (Nhóm Nhỏ / Nhóm Vừa / Nhóm Lớn)
  - Danh sách từ khóa chính (tên thương hiệu, tên sản phẩm, tên founder, tên chi nhánh)
  - Danh sách từ đồng nghĩa / biến thể cách viết (slang, teencode)
  - Mức độ ưu tiên monitoring (Standard / Crisis-watch)
- Outputs: Workspace được tạo, crawler bắt đầu thu thập theo keyword config
- Business rule: Tối thiểu 1 từ khóa. Mỗi tenant tối đa 10 workspace (mặc định, tùy gói dịch vụ)

**US-02: Cập nhật từ khóa**

- Actor: Brand Admin
- Thay đổi có hiệu lực ngay từ chu kỳ crawl tiếp theo
- Lịch sử thay đổi được lưu lại (audit log)

**US-03: Xem sức khỏe nguồn dữ liệu**

- Actor: Brand Admin, Analyst
- Dashboard hiển thị "health" của từng data source (Facebook, TikTok, báo điện tử...)
- Cảnh báo nội bộ khi nguồn mất > 30 phút không có dữ liệu mới

---

### 4.2 Thu thập dữ liệu (Crawling)

**US-04: Crawling theo lịch tiered**

- Tần suất cao: khung giờ cao điểm 7–9h, 11–13h, 19–22h
- Tần suất thấp: các giờ còn lại, đặc biệt sau 23h
- Crisis-watch keyword: luôn crawl tần suất cao bất kể giờ
- Proxy rotation & randomize delay để tránh bị chặn

**US-05: Tiêu chuẩn hóa dữ liệu**

- Tất cả dữ liệu crawl phải qua bước:
  1. **Deduplication** (MinHash LSH): loại bỏ bài duplicate, giữ bản gốc
  2. **Spam filter**: loại bỏ nội dung bot, quảng cáo tự động
  3. **PII Anonymization**: mask số điện thoại, CMND, địa chỉ cụ thể
  4. **Content type filter**: chỉ lưu headline + tóm tắt + URL với nội dung báo điện tử

**US-06: Source Credibility Scoring**

- Mỗi nguồn được gán điểm uy tín:
  - Tờ báo lớn (VnExpress, Tuổi Trẻ...): điểm cao
  - Tài khoản được tạo < 30 ngày: điểm thấp
  - Nguồn có lịch sử spam: điểm âm
- Điểm uy tín ảnh hưởng đến thứ tự hiển thị mention

---

### 4.3 Phân tích AI / NLP

**US-07: Nhận diện mention**

- Input: nội dung post/comment đã chuẩn hóa + keyword config của workspace
- Output: `is_relevant: boolean`, `match_reason: string`
- Xử lý: lọc keyword nhanh (fast-path) → nếu pass → NLP phân tích ngữ cảnh sâu (deep-path)
- Loại bỏ false positive: đề cập trùng từ khóa nhưng không liên quan đến thương hiệu

**US-08: Phân loại Sentiment**

- Input: nội dung mention đã xác định là liên quan
- Output: `sentiment: "positive" | "negative" | "neutral"`, `confidence: float`
- Model: PhoBERT fine-tuned trên dataset tiếng Việt MXH
- Xử lý đặc biệt:
  - Context window mở rộng: phân tích cả đoạn văn, không chỉ 1 câu
  - Sarcasm detection: nhận diện "ngon" trong ngữ cảnh tiêu cực
  - Teencode normalization trước khi đưa vào model
- Accuracy target: > 90% trên bộ test chuẩn
- F1-score sarcasm detection: > 75%

**US-09: Gắn nhãn Chủ đề (Topic Labeling)**

- Output: tối đa 3 nhãn chủ đề / mention
- Danh sách chủ đề mặc định:
  - `quality` — chất lượng sản phẩm
  - `price` — giá cả
  - `service` — dịch vụ chăm sóc khách hàng
  - `staff` — thái độ nhân viên
  - `delivery` — giao hàng
  - `experience` — trải nghiệm khách hàng
  - `legal` — pháp lý / uy tín
  - `operation` — vấn đề vận hành
  - `competitor` — đề cập đến đối thủ
  - `other` — chủ đề khác

**US-10: Phân tích Intent (Lead Generation)**

- Input: mention đã có sentiment + topic từ pipeline crawling & NLP deep-path
- Output: `intent: "hot" | "warm" | "cold" | "none"`, `intent_signals: string[]`, `expiry_at: string`
- **Quy tắc phát hiện Lead Candidate**:
  - Phải liên quan đến thương hiệu (sentiment không trống).
  - Không phải nội dung spam hoặc tin nhắn bot tự động.
  - Có ít nhất một từ khóa nằm trong danh sách tín hiệu ý định (Intent Signals).
- **Quy tắc phân loại và tính điểm (Scoring & Classification)**:
  - Sử dụng phương pháp đối sánh từ khóa được phân nhóm trọng số:
    - *Tín hiệu Hot* (`HOT_KEYWORDS`): "mua", "đặt hàng", "order", "cần gấp", "giá bao nhiêu", "bao nhiêu tiền", "giao hàng", "ship"... (Trọng số: +3 điểm).
    - *Tín hiệu Warm* (`WARM_KEYWORDS`): "gợi ý", "recommend", "so sánh", "khác nhau", "tốt hơn", "còn không", "sẵn không"... (Trọng số: +1 điểm).
    - *Tín hiệu Cold* (`COLD_KEYWORDS`): "ở đâu", "chi nhánh", "địa chỉ", "mở cửa", "giờ hoạt động"... (Trọng số: +0.3 điểm).
  - **Negative Sentiment Penalty**: Nếu sentiment của mention là `negative` (phản ánh tiêu cực hoặc phàn nàn), nhân điểm số với hệ số phạt **0.6** nhằm hạ mức độ ưu tiên xử lý.
  - **Phân nhóm ý định mua**:
    - **Hot Lead**: Tổng điểm >= 5 (có từ 2+ tín hiệu hot hoặc từ ngữ khẩn cấp kèm hành động mua). Thời hạn xử lý: **30 phút**.
    - **Warm Lead**: Tổng điểm từ 2 đến < 5 (có tín hiệu quan tâm, so sánh, hoặc hỏi hàng). Thời hạn xử lý: **24 giờ**.
    - **Cold Lead**: Tổng điểm từ 0.5 đến < 2 (chỉ hỏi vị trí hoặc thông tin cơ bản). Thời hạn xử lý: **7 ngày**.
    - **None**: Tổng điểm < 0.5. Bỏ qua không tạo lead.
- **Expiry Expiry Policy**: Mỗi loại lead được ấn định thời hạn xử lý (`expiry_at`). Quá thời hạn này mà trạng thái vẫn là `new` hoặc `processing`, lead sẽ được coi là "Quá hạn" (Overdue) để hệ thống cảnh báo hoặc tự động chuyển trạng thái `skipped` nếu cấu hình.

---

### 4.4 Cảnh báo sớm (Crisis Alert)

**US-11: Phát hiện Crisis Signal**

- Hệ thống theo dõi các tín hiệu bất thường:

  | Tín hiệu | Mô tả | Ngưỡng mặc định |
  |----------|-------|----------------|
  | Mention spike | Số mention tiêu cực tăng đột biến | > 3x baseline trong 15 phút |
  | High-reach source | Nguồn có nhiều follower/reader đề cập | Nguồn có reach > 100k |
  | Sensitive topic repeat | Chủ đề nhạy cảm lặp lại nhiều lần | > 10 lần trong 1 giờ |

- Brand Admin có thể tùy chỉnh ngưỡng theo từng workspace

**US-12: Gửi cảnh báo**

- Latency mục tiêu: < 3 phút từ khi phát hiện đến khi user nhận được thông báo
- Channel: Telegram Bot, Zalo OA, Email
- Nội dung alert bao gồm:
  - Loại cảnh báo (spike / high-reach / sensitive topic)
  - Tổng số mention tiêu cực
  - Top 3 nội dung tiêu biểu (link + tóm tắt)
  - Đề xuất mức độ ưu tiên xử lý

---

### 4.5 Dashboard tổng quan

**US-13: Tổng quan Dashboard**

- Các widget hiển thị:
  - **Mention Counter**: tổng số mention trong khoảng thời gian được chọn
  - **Sentiment Donut Chart**: tỷ lệ Positive / Negative / Neutral
  - **Sentiment Trend Line**: xu hướng sentiment theo ngày/tuần
  - **Top Sources**: top 5 nguồn có nhiều mention nhất
  - **Top Topics**: top 5 chủ đề được đề cập nhiều nhất
  - **Recent Alerts**: 5 cảnh báo gần nhất với badge mức độ
  - **Lead Summary**: số Hot/Warm/Cold lead hôm nay

- Bộ lọc: theo workspace, theo khoảng thời gian, theo platform, theo sentiment

**US-14: Danh sách Mention**

- Bảng danh sách với pagination (20 items/page)
- Các cột: Nền tảng, Nội dung (tóm tắt), Sentiment, Topic, Nguồn, Thời gian, Credibility Score
- Filter: sentiment, topic, platform, keyword, khoảng thời gian
- Cho phép người dùng relabel sentiment (Human-in-the-loop feedback)

---

### 4.6 Lead Management

**US-15: Xem Lead List**

- Hiển thị danh sách Lead với 3 tab: Hot / Warm / Cold
- Mỗi Lead hiển thị:
  - Platform + link bài đăng
  - Nội dung tóm tắt
  - Intent signals (các từ/cụm từ cho thấy purchase intent)
  - Thời gian phát hiện
  - **Lead Expiry Countdown** (đồng hồ đếm ngược với Hot Lead)
  - Trạng thái: Mới / Đang xử lý / Đã xử lý / Bỏ qua

**US-16: Hot Lead Push Notification**

- Khi hệ thống phát hiện Hot Lead mới:
  - Trong < 60 giây: gửi push notification đến Zalo/Telegram của user Sales
  - Nội dung message: platform, link, tóm tắt content, intent signals
  - User có thể click để mở Lead detail ngay trong app

---

### 4.7 Báo cáo tự động

**US-17: Báo cáo ngày**

- Tự động tạo hàng ngày lúc 7:00 sáng
- Nội dung:
  - Tổng số mention trong ngày hôm qua
  - So sánh với ngày trước (delta %)
  - Phân tích sentiment (số lượng + %)
  - Top 5 nguồn + Top 5 chủ đề
  - Danh sách cảnh báo đã kích hoạt
  - Nội dung cần ưu tiên xử lý (top negative mentions)
- Format: PDF + Excel
- Phân phối: Email + lưu trên S3 + xem trong app

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| BR# | Quy tắc |
|-----|---------|
| BR-01 | Chỉ thu thập dữ liệu **công khai**. Tuyệt đối không crawl nội dung yêu cầu đăng nhập. |
| BR-02 | Với báo điện tử: chỉ lưu headline, tóm tắt (< 300 ký tự) và URL. Không lưu full-text. |
| BR-03 | Tất cả dữ liệu phải qua PII Anonymization trước khi lưu vào DB. |
| BR-04 | Mỗi tenant không được phép truy cập dữ liệu của tenant khác. |
| BR-05 | Nguồn dữ liệu của mỗi tenant: không quá 60% từ 1 nền tảng duy nhất. |
| BR-06 | Hot Lead phải được push trong vòng 60 giây từ khi phát hiện. |
| BR-07 | Crisis Alert phải gửi đến user trong vòng 3 phút từ khi phát hiện spike. |
| BR-08 | Nếu sentiment accuracy < 85% trên test-set → trigger nội bộ để AI team xử lý. |
| BR-09 | Dữ liệu crawl raw được giữ tối đa 90 ngày trên S3. Mention đã phân tích giữ 365 ngày. |
| BR-10 | User relabel sentiment → dữ liệu đưa vào pipeline fine-tuning (không áp dụng ngay). |

---

## 6. API Endpoints tổng quan

### Authentication

```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

### Workspace

```
GET    /api/v1/workspaces                    # Danh sách workspace của tenant
POST   /api/v1/workspaces                    # Tạo workspace mới
GET    /api/v1/workspaces/:id                # Chi tiết workspace
PUT    /api/v1/workspaces/:id                # Cập nhật keyword config
DELETE /api/v1/workspaces/:id                # Xóa workspace
GET    /api/v1/workspaces/:id/health         # Sức khỏe nguồn dữ liệu
```

### Mentions

```
GET    /api/v1/workspaces/:id/mentions       # Danh sách mention (filter, paginate)
GET    /api/v1/workspaces/:id/mentions/:mid  # Chi tiết mention
PATCH  /api/v1/workspaces/:id/mentions/:mid/relabel  # Relabel sentiment
```

### Dashboard

```
GET    /api/v1/workspaces/:id/dashboard      # Tổng quan (summary stats)
GET    /api/v1/workspaces/:id/sentiment-trend?period=7d  # Sentiment trend
GET    /api/v1/workspaces/:id/top-sources    # Top nguồn
GET    /api/v1/workspaces/:id/top-topics     # Top chủ đề
```

### Alerts

```
GET    /api/v1/workspaces/:id/alerts         # Danh sách cảnh báo
GET    /api/v1/workspaces/:id/alerts/:aid    # Chi tiết cảnh báo
PUT    /api/v1/workspaces/:id/alert-config   # Cấu hình ngưỡng cảnh báo
```

### Leads

```
GET    /api/v1/workspaces/:id/leads          # Danh sách lead (filter: hot/warm/cold)
GET    /api/v1/workspaces/:id/leads/:lid     # Chi tiết lead
PATCH  /api/v1/workspaces/:id/leads/:lid     # Cập nhật trạng thái lead
```

### Reports

```
GET    /api/v1/workspaces/:id/reports        # Danh sách báo cáo
GET    /api/v1/workspaces/:id/reports/:rid   # Download báo cáo (PDF/Excel)
POST   /api/v1/workspaces/:id/reports/generate  # Tạo báo cáo thủ công
```

---

## 7. Database Schema (tóm tắt)

### Core Entities

```sql
-- Tenant (Multi-tenant isolation)
tenants (id, name, plan, created_at)

-- Workspace per brand
workspaces (
  id, tenant_id, name, industry,
  keywords: jsonb,         -- [{term, synonyms, priority}]
  crisis_watch: boolean,
  created_at, updated_at
)

-- Raw mention (sau khi dedup + PII mask)
mentions (
  id, workspace_id,
  source_platform,         -- facebook | tiktok | news | youtube
  source_url,
  content_summary,         -- max 500 chars
  author_display_name,     -- public display only
  credibility_score,
  published_at,
  crawled_at
)

-- NLP Analysis result
nlp_results (
  id, mention_id,
  sentiment,               -- positive | negative | neutral
  sentiment_confidence,
  topics: text[],
  intent,                  -- hot | warm | cold | none
  model_version,
  is_relabeled: boolean,
  relabeled_by,
  analyzed_at
)

-- Crisis Alerts
alerts (
  id, workspace_id,
  type,                    -- spike | high_reach | sensitive_topic
  severity,                -- low | medium | high | critical
  triggered_at,
  sent_at,
  channels_sent: text[],
  acknowledged_at,
  acknowledged_by
)

-- Leads
leads (
  id, workspace_id, mention_id,
  intent_type,             -- hot | warm | cold
  intent_signals: text[],
  status,                  -- new | in_progress | handled | ignored
  pushed_at,
  handled_at,
  handled_by,
  expires_at               -- Hot lead: 30 phút từ pushed_at
)

-- Daily Reports
reports (
  id, workspace_id,
  period_start, period_end,
  file_url,                -- S3 URL
  generated_at
)
```

---

## 8. Yêu cầu phi chức năng (NFR)

### Performance

| Metric | Target |
|--------|--------|
| API response time (P95) | < 500ms |
| Dashboard load time | < 2s |
| WebSocket latency (alert) | < 3 phút end-to-end |
| Hot Lead push notification | < 60 giây |
| NLP Fast-path processing | < 1 giây / mention |
| NLP Deep-path processing | 5–10 giây / mention |
| System throughput | >= 10,000 posts/phút lúc peak |

### Availability

| Component | SLA |
|-----------|-----|
| Web App | 99.5% uptime |
| Alert Service | 99.9% uptime (critical path) |
| Crawler | 95% uptime (có thể degrade theo platform) |

### Security

- JWT Authentication với refresh token rotation
- HTTPS/TLS cho tất cả endpoints
- Rate limiting: 100 req/phút / user
- Multi-tenant data isolation (row-level security)
- PII anonymization trước khi lưu
- Không lưu thông tin cá nhân ngoài tên hiển thị công khai

### Scalability

- Kubernetes HPA cho crawler và NLP worker pods
- Kafka buffer giúp hệ thống chịu traffic spike 100x
- Tiered crawling giảm 30–40% chi phí compute

---

## 9. KPI & SLA

### KPI Kỹ thuật

| KPI | Target |
|-----|--------|
| Sentiment accuracy | > 90% trên bộ test chuẩn |
| Sarcasm detection F1-score | > 75% |
| Crisis Alert latency | < 3 phút |
| Hot Lead push latency | < 60 giây |
| System throughput | >= 10,000 posts/phút |

### KPI Vận hành

| KPI | Target |
|-----|--------|
| Data source uptime | > 95% / nguồn |
| Report generation thành công | > 99% |
| Dedup effectiveness | < 2% duplicate trong DB |

---

## 10. Rủi ro & Giải pháp

### Rủi ro kỹ thuật

| Rủi ro | Giải pháp |
|--------|----------|
| **AI accuracy thấp với tiếng Việt MXH** | Fine-tune PhoBERT + context window rộng + human-in-the-loop feedback |
| **Traffic spike làm nghẽn hệ thống** | Kafka buffer + K8s HPA + tiered processing (fast-path / deep-path) |
| **Dữ liệu nhiễu, spam, duplicate** | MinHash LSH dedup + spam classifier + source credibility scoring |
| **Bot bị chặn khi crawl** | Ưu tiên Official API + residential proxy pool + randomize delay |

### Rủi ro pháp lý

| Rủi ro | Giải pháp |
|--------|----------|
| **Vi phạm quyền riêng tư** | PII Anonymization Pipeline + không crawl private content |
| **Vi phạm bản quyền báo chí** | Chỉ lưu headline + tóm tắt + URL |
| **API bị đóng đột ngột (như Twitter 2023)** | Data Source Abstraction Layer + đa nguồn (không > 60% từ 1 nền tảng) |

### Rủi ro vận hành

| Rủi ro | Giải pháp |
|--------|----------|
| **Lead hết hạn trước khi Sales xử lý** | Lead Expiry Countdown + phân loại Hot/Warm/Cold + hướng dẫn onboarding |
| **Chi phí cloud vượt doanh thu** | Tiered crawling + batch NLP cho non-critical + pricing model theo khối lượng |
| **Cạnh tranh từ Buzzmetrics, Meltwater** | USP: Lead Generation (offense) — hầu hết đối thủ chỉ làm defense |
