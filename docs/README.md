# InsightFlow — Brand Intelligence Platform

> *"Biến dữ liệu thành insight"* — Nền tảng theo dõi & phân tích thương hiệu bằng AI theo thời gian thực.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Tính năng cốt lõi](#2-tính-năng-cốt-lõi)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Công nghệ sử dụng](#4-công-nghệ-sử-dụng)
5. [Cài đặt và chạy local](#5-cài-đặt-và-chạy-local)
6. [Biến môi trường](#6-biến-môi-trường)
7. [Quy trình phát triển (Agile)](#7-quy-trình-phát-triển-agile)
8. [Phạm vi sản phẩm](#8-phạm-vi-sản-phẩm)
9. [Đóng góp](#9-đóng-góp)
10. [Giấy phép](#10-giấy-phép)

---

## 1. Tổng quan dự án

**InsightFlow** là nền tảng AI Media Monitoring giúp doanh nghiệp, KOL/KOC và agency PR/Marketing:

- **Phòng vệ (Defense):** Phát hiện sớm rủi ro truyền thông, cảnh báo khủng hoảng real-time.
- **Tấn công (Offense):** Khai thác khách hàng tiềm năng (Lead Generation) từ các tín hiệu mua hàng trên mạng xã hội.

### Bài toán giải quyết

Phần lớn doanh nghiệp đang theo dõi thương hiệu thủ công — tự tìm từ khóa, đọc bài viết, tổng hợp báo cáo bằng tay. Hậu quả:

- Bỏ sót cảnh báo khủng hoảng do xử lý chậm.
- Dữ liệu mention bị phân tán ở nhiều kênh.
- Tốn nhiều giờ tổng hợp báo cáo định kỳ.
- Không ưu tiên được nội dung nào cần xử lý trước.

### Điểm khác biệt (USP)

Không giống Buzzmetrics, Younet Media, Meltwater chỉ làm brand monitoring đơn thuần, InsightFlow bổ sung **chiến lược tấn công**: phát hiện purchase intent & cung cấp Lead List thời gian thực cho đội Sales.

---

## 2. Tính năng cốt lõi

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | **Quản lý Brand/Project** | Tạo workspace theo thương hiệu, cấu hình từ khóa, tên sản phẩm, tên founder |
| 2 | **Crawling thông minh** | Thu thập dữ liệu real-time từ các nguồn công khai (báo điện tử, Fanpage/Group, YouTube, TikTok) |
| 3 | **AI NLP — Nhận diện Mention** | Xác định mention liên quan, loại bỏ nhiễu từ khóa |
| 4 | **Phân tích Sentiment** | Phân loại Tích cực / Tiêu cực / Trung tính (accuracy mục tiêu > 90%) |
| 5 | **Gắn nhãn Chủ đề (Topic)** | Phân nhóm: chất lượng SP, giá cả, dịch vụ, giao hàng, pháp lý... |
| 6 | **Cảnh báo sớm (Crisis Alert)** | Kích hoạt khi mention tiêu cực tăng đột biến, latency < 3 phút |
| 7 | **Lead Generation** | Phát hiện purchase intent → Hot/Warm/Cold Lead → Push Zalo/Telegram |
| 8 | **Dashboard tổng quan** | Biểu đồ sentiment, top nguồn, top chủ đề, xu hướng theo thời gian |
| 9 | **Báo cáo tự động** | Export PDF/Excel theo ngày/tuần, tóm tắt nội dung cần ưu tiên |

---

## 3. Cấu trúc thư mục

```
insightflow/
│
├── apps/
│   ├── web/                        # Frontend — Next.js Dashboard
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router (pages & layouts)
│   │   │   │   ├── (auth)/         # Login, Register
│   │   │   │   ├── dashboard/      # Dashboard tổng quan
│   │   │   │   ├── brands/         # Quản lý thương hiệu / workspace
│   │   │   │   ├── mentions/       # Danh sách mention & filter
│   │   │   │   ├── leads/          # Lead List (Hot/Warm/Cold)
│   │   │   │   ├── alerts/         # Lịch sử cảnh báo
│   │   │   │   ├── reports/        # Báo cáo định kỳ
│   │   │   │   └── settings/       # Cài đặt tài khoản, notification
│   │   │   ├── components/         # UI components tái sử dụng
│   │   │   │   ├── charts/         # Recharts / Chart.js wrappers
│   │   │   │   ├── tables/         # Bảng mention, lead list
│   │   │   │   ├── alerts/         # Alert cards & banners
│   │   │   │   └── ui/             # shadcn/ui base components
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── stores/             # Zustand state management
│   │   │   ├── lib/                # Utilities, API clients
│   │   │   └── types/              # TypeScript types / interfaces
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                        # Backend — Node.js / FastAPI gateway
│       ├── src/
│       │   ├── routes/             # REST API routes
│       │   ├── controllers/        # Business logic handlers
│       │   ├── middleware/         # Auth, rate-limit, logging
│       │   ├── services/           # External service clients
│       │   └── types/
│       └── package.json
│
├── services/
│   ├── crawler/                    # Crawling Service — Python
│   │   ├── sources/                # Adapter cho từng nền tảng
│   │   │   ├── facebook.py         # Meta Graph API + intelligent scraping
│   │   │   ├── tiktok.py
│   │   │   ├── news.py             # Báo điện tử
│   │   │   └── youtube.py
│   │   ├── pipeline/               # Data normalization pipeline
│   │   ├── dedup/                  # MinHash LSH deduplication
│   │   ├── scheduler.py            # Tiered crawling theo giờ cao điểm
│   │   ├── health_monitor.py       # Data source health check
│   │   └── requirements.txt
│   │
│   ├── nlp/                        # NLP Service — Python (AI/ML)
│   │   ├── models/                 # Model weights & configs
│   │   │   ├── phobert/            # PhoBERT fine-tuned
│   │   │   └── multilingual_bert/
│   │   ├── pipelines/
│   │   │   ├── mention_detector.py # Nhận diện mention liên quan
│   │   │   ├── sentiment.py        # Phân loại sentiment (3 class)
│   │   │   ├── topic_labeler.py    # Gắn nhãn chủ đề
│   │   │   ├── intent_analyzer.py  # Purchase intent detection (Lead)
│   │   │   ├── spam_filter.py      # Spam classifier
│   │   │   └── pii_anonymizer.py   # PII masking trước khi lưu
│   │   ├── fast_path/              # Rule-based fast path (< 1s)
│   │   │   └── keyword_filter.py
│   │   ├── feedback/               # Human-in-the-loop relabeling
│   │   └── requirements.txt
│   │
│   ├── alert/                      # Alert Service — Node.js
│   │   ├── engine/                 # Crisis detection engine
│   │   │   ├── spike_detector.ts   # Phát hiện mention tiêu cực đột biến
│   │   │   └── threshold.ts        # Ngưỡng cảnh báo theo tenant
│   │   ├── channels/               # Notification channels
│   │   │   ├── telegram.ts
│   │   │   ├── zalo.ts
│   │   │   └── email.ts
│   │   └── package.json
│   │
│   ├── lead/                       # Lead Generation Service — Node.js
│   │   ├── scorer.ts               # Lead Scoring (Hot/Warm/Cold)
│   │   ├── expiry.ts               # Lead Expiry countdown
│   │   ├── pusher.ts               # Real-time push < 60 giây
│   │   └── package.json
│   │
│   └── report/                     # Report Service — Python
│       ├── generators/
│       │   ├── daily_report.py     # Báo cáo ngày
│       │   ├── weekly_report.py
│       │   └── pdf_exporter.py     # Xuất PDF
│       └── requirements.txt
│
├── infrastructure/
│   ├── kafka/                      # Message queue config
│   │   └── topics.yaml
│   ├── k8s/                        # Kubernetes manifests
│   │   ├── deployments/
│   │   ├── services/
│   │   └── hpa/                    # Horizontal Pod Autoscaler
│   ├── nginx/                      # Reverse proxy config
│   ├── redis/                      # Cache config
│   └── docker-compose.yml          # Local development
│
├── database/
│   ├── migrations/                 # Prisma / Alembic migrations
│   ├── seeds/                      # Dữ liệu mẫu
│   └── schema.prisma               # Database schema
│
├── shared/
│   ├── types/                      # Shared TypeScript types (cross-service)
│   ├── constants/                  # Enum, threshold constants
│   └── utils/                      # Shared utilities
│
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── seed_db.sh
│
├── docs/
│   ├── README.md                   # File này
│   ├── SPEC.md                     # Functional specification
│   ├── ARCHITECTURE.md             # System architecture
│   ├── API.md                      # API reference
│   └── DEPLOYMENT.md               # Hướng dẫn deploy
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── turbo.json                      # Turborepo monorepo config
```

---

## 4. Công nghệ sử dụng

### Frontend
| Layer | Công nghệ | Lý do chọn |
|-------|-----------|-----------|
| Framework | **Next.js 14** (App Router) | SSR/SSG, route-based code split, SEO |
| Language | **TypeScript** | Type-safety toàn bộ codebase |
| Styling | **Tailwind CSS v4** | Utility-first, nhất quán design system |
| State | **Zustand** | Lightweight, dễ maintain hơn Redux |
| Charts | **Recharts + Chart.js** | Sentiment chart, trend line, pie chart |
| UI Kit | **shadcn/ui** | Accessible, customizable components |
| Real-time | **Socket.IO** | Push cảnh báo và lead real-time |
| HTTP | **Axios + React Query** | Cache, retry, background refetch |

### Backend API
| Layer | Công nghệ | Lý do chọn |
|-------|-----------|-----------|
| Runtime | **Node.js 20 LTS** | Event-driven, phù hợp I/O-heavy |
| Framework | **Express / Fastify** | REST API gateway |
| Auth | **JWT + Refresh Token** | Stateless, multi-tenant |
| ORM | **Prisma** | Type-safe DB access, migrations |
| Validation | **Zod** | Schema validation + type inference |

### NLP / AI Service
| Layer | Công nghệ | Lý do chọn |
|-------|-----------|-----------|
| Language | **Python 3.11** | Hệ sinh thái ML mạnh nhất |
| Framework | **FastAPI** | Async, hiệu năng cao, tự gen docs |
| Models | **PhoBERT, mBERT** | Pre-trained tiếng Việt, fine-tunable |
| ML Framework | **Hugging Face Transformers** | Dễ fine-tune, community lớn |
| Dedup | **MinHash LSH** (datasketch) | Near-duplicate detection hiệu quả |
| PII | **Presidio (Microsoft)** | PII detection & anonymization |

### Crawling Service
| Layer | Công nghệ |
|-------|-----------|
| Language | **Python 3.11** |
| HTTP | **httpx + Playwright** (headless browser) |
| Scheduling | **APScheduler** (tiered crawl theo giờ) |
| Proxy | **Residential proxy pool** (rotation) |
| Official API | **Meta Graph API**, YouTube Data API v3 |

### Infrastructure & Data
| Layer | Công nghệ | Lý do chọn |
|-------|-----------|-----------|
| Message Queue | **Apache Kafka** | High-throughput, durable, replay |
| Primary DB | **PostgreSQL 16** | Relational, full-text search, JSONB |
| Cache | **Redis** | Real-time alert queue, session |
| Search | **Elasticsearch** | Full-text search mention, analytics |
| Object Storage | **S3-compatible** | Lưu raw crawl data, báo cáo PDF |
| Container | **Docker + Kubernetes** | Deploy, scale, HPA |
| Monorepo | **Turborepo** | Build cache, pipeline task |

---

## 5. Cài đặt và chạy local

### Yêu cầu

- Node.js >= 20 LTS
- Python >= 3.11
- Docker & Docker Compose
- pnpm >= 9

### Bước 1: Clone & cài dependencies

```bash
git clone https://github.com/your-org/insightflow.git
cd insightflow
pnpm install
```

### Bước 2: Cấu hình môi trường

```bash
cp .env.example .env
# Điền các biến: DATABASE_URL, KAFKA_BROKERS, REDIS_URL, API keys...
```

### Bước 3: Khởi động infrastructure

```bash
docker-compose up -d postgres redis kafka elasticsearch
```

### Bước 4: Chạy migrations

```bash
pnpm --filter @insightflow/api db:migrate
```

### Bước 5: Chạy tất cả services

```bash
pnpm dev
# hoặc từng service:
pnpm --filter @insightflow/web dev
pnpm --filter @insightflow/api dev
cd services/nlp && uvicorn main:app --reload
cd services/crawler && python scheduler.py
```

---

## 6. Biến môi trường

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/insightflow

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# AI / NLP
OPENAI_API_KEY=sk-...             # Optional: fallback LLM
HF_TOKEN=hf_...                   # Hugging Face token

# Meta Graph API
META_APP_ID=...
META_APP_SECRET=...

# YouTube Data API
YOUTUBE_API_KEY=...

# Notification
TELEGRAM_BOT_TOKEN=...
ZALO_OA_TOKEN=...

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# S3 Storage
S3_ENDPOINT=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=insightflow-data
```

---

## 7. Quy trình phát triển (Agile)

Dự án phát triển theo **Agile Scrum**, chia 3 giai đoạn lớn:

| Giai đoạn | Mục tiêu |
|-----------|---------|
| **Phase 1** | End-to-end demo: crawl → NLP cơ bản → dashboard cho 9 thương hiệu F&B mục tiêu thuộc các nhóm Nhỏ (XLIII Coffee, Maison Marou, Laha Cafe), Vừa (KATINAT, Phê La, Pizza 4P's) và Lớn (Highlands, Phúc Long, Cộng Cà Phê) |
| **Phase 2** | Chuẩn hóa platform, tập trung huấn luyện chuyên sâu mô hình NLP trên tập dữ liệu F&B thu được, nâng cao năng lực phân loại sắc thái cảm xúc, tự động gắn nhãn chủ đề và tối ưu hóa hệ thống cảnh báo sớm |
| **Phase 3** | Tăng cường độ phủ dữ liệu, nâng cấp hạ tầng chịu tải lớn, bắt đầu mở rộng mô hình sang các ngành dọc khác và phát hành phiên bản thương mại chính thức |

Mỗi sprint tạo ra increment demo được. Sau mỗi sprint: review + feedback loop.

---

## 8. Phạm vi sản phẩm

### Phạm vi bao gồm (In-Scope)

- Nguồn dữ liệu **công khai**: báo điện tử, Fanpage/Group công khai, YouTube, TikTok.
- Dashboard biểu đồ, báo cáo PDF/Excel, Lead List, hệ thống cảnh báo.

### Phạm vi loại trừ (Out-of-Scope)

- Tin nhắn cá nhân, group kín, tài khoản khóa bảo mật (tuân thủ Luật An ninh mạng).
- Báo giấy, phát thanh, truyền hình chưa số hóa.
- Xử lý khủng hoảng, gỡ bài tiêu cực (hệ thống chỉ phát hiện & báo cáo).

### Phạm vi đối tượng mục tiêu trong giai đoạn đầu (Target Brands)

Để kiểm chứng pipeline xử lý dữ liệu và xây dựng phiên bản demo thực tế, InsightFlow sẽ tập trung quét dữ liệu, nhận diện thương hiệu và phân tích phản hồi xoay quanh **9 thương hiệu tiêu biểu thuộc ngành F&B (Cà phê, Trà sữa, Tiệm bánh) tại Việt Nam**, được phân chia theo 3 quy mô cụ thể sau:

| Phân nhóm quy mô | Thương hiệu tiêu biểu | Đặc điểm dữ liệu & Định hướng thu thập |
|---|---|---|
| **Nhóm Nhỏ** *(Local Craft / Premium / Niche)* | **XLIII Coffee** | Chuỗi specialty coffee có footprint gọn hơn, hiện có các điểm ở Đà Nẵng, TP.HCM, Hội An và Hà Nội. Rất phù hợp để crawl pilot thực nghiệm cho nhóm thương hiệu ngách. |
| | **Maison Marou** | Thương hiệu chocolate/patisserie cao cấp, sở hữu trang vị trí cửa hàng riêng và hệ sinh thái sản phẩm rõ ràng. Phù hợp để kiểm thử và tối ưu nhóm dữ liệu "food premium / local craft". |
| | **Laha Cafe** | Local coffee brand có hiện diện online chính thức và hoạt động theo mô hình công ty/nhượng quyền. Footprint online hiện tại gọn hơn các chuỗi quốc dân, thích hợp để theo dõi luồng thảo luận quy mô nhỏ gọn. |
| **Nhóm Vừa** *(Đang mở rộng nhanh / Phủ đa tỉnh)* | **KATINAT Coffee & Tea House** | Sở hữu hệ thống cửa hàng lớn và các thông báo vận hành "trên toàn quốc". Tốc độ tăng trưởng và độ thảo luận truyền thông đủ mạnh để đại diện cho nhóm brand đang mở rộng nhanh. |
| | **Phê La** | Hệ thống cửa hàng hiện diện tại nhiều thành phố lớn (Đà Lạt, Đà Nẵng, Hà Nội, TP.HCM). Lượng thảo luận đặc trưng, cực kỳ phù hợp cho bài toán phân tích sắc thái cảm xúc (Sentiment) và brand mention. |
| | **Pizza 4P’s** | Thương hiệu F&B gốc Việt có hơn 30 địa điểm trên nhiều thị trường. Độ phủ mạnh, tệp khách hàng trung thành cao nhưng chưa theo kiểu đại trà, nằm ở ranh giới giữa nhóm vừa và vừa-lớn. |
| **Nhóm Lớn** *(Chuỗi Quốc dân / Volume khổng lồ)* | **Highlands Coffee** | Hệ thống tìm kiếm cửa hàng và menu đồng bộ trên toàn quốc. Là một trong những brand lớn nhất thị trường, lý tưởng để thử nghiệm khả năng cào dữ liệu và chịu tải với volume (dung lượng) lớn. |
| | **Phúc Long** | Có trang tìm cửa hàng riêng và điều khoản hội viên áp dụng cho hệ thống toàn quốc. Lượng tương tác, bài đăng phản hồi lớn, đại diện xuất sắc cho nhóm thương hiệu lớn. |
| | **Cộng Cà Phê** | Sở hữu mạng lưới 58 cửa hàng tại Việt Nam và 7 cửa hàng quốc tế. Brand mang đậm tính văn hóa bản địa, có lượng brand mention phong phú ở cả thị trường trong và ngoài nước, rất đáng theo dõi. |

---

## 9. Đóng góp

1. Fork repo, tạo branch `feature/ten-feature`
2. Commit theo convention: `feat:`, `fix:`, `docs:`, `refactor:`
3. Mở Pull Request, assign reviewer
4. Merge sau khi pass CI và có ít nhất 1 approval

---

## 10. Giấy phép

© 2025 InsightFlow Team. Tất cả quyền được bảo lưu.
