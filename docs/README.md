# InsightFlow - Brand Intelligence Platform

> Nền tảng hỗ trợ thương hiệu theo dõi, phân tích và vận hành xử lý dữ liệu truyền thông công khai bằng AI.

InsightFlow không chỉ là dashboard hiển thị số liệu. Mục tiêu sản phẩm là giúp từng vai trò trong hệ thống biết **mình cần làm gì tiếp theo**: dữ liệu nào cần kiểm duyệt, vấn đề nào cần xử lý, lead nào cần chăm sóc, báo cáo nào cần xem, và phản hồi nào có thể tự động hoặc cần con người duyệt.

---

## 1. Tài liệu liên quan

| Tài liệu | Mục đích |
|---|---|
| `docs/SPEC.md` | Đặc tả sản phẩm Sprint 2: vai trò, phân quyền, workflow, dashboard/report, onboarding, auto-response |
| `docs/ARCHITECTURE.md` | Kiến trúc hệ thống Sprint 2: role guard, brand isolation, data lifecycle, audit, triển khai trong cấu trúc hiện tại |
| `docs/API.md` | Tham khảo API hiện có/định hướng API |
| `docs/DEPLOYMENT.md` | Hướng dẫn triển khai |
| `docs/CHANGELOG.md` | Nhật ký thay đổi |

Nếu có xung đột, ưu tiên tài liệu theo thứ tự:

1. `SPEC.md` cho nghiệp vụ sản phẩm.
2. `ARCHITECTURE.md` cho kiến trúc triển khai.
3. `README.md` cho định hướng nhanh và onboarding đội phát triển.

---

## 2. Tổng quan sản phẩm

InsightFlow hỗ trợ thương hiệu và đội truyền thông:

- Thu thập dữ liệu công khai về thương hiệu.
- Tiền xử lý dữ liệu, loại bỏ dữ liệu lỗi/trùng/spam.
- Dùng AI để gán nhãn sentiment, topic, crisis level và lead intent.
- Cho Admin kiểm duyệt nhãn đầu vào trước khi dữ liệu được publish.
- Tổng hợp nhiều post/comment của cùng một contact đối với một brand để đánh giá trạng thái, độ ảnh hưởng, spam score và priority.
- Cho đội thương hiệu xử lý khủng hoảng, lead và báo cáo theo vai trò.
- Cho nhân viên gửi request sửa nhãn nếu phát hiện AI hoặc dữ liệu đã publish bị sai.
- Cho Quản lý thương hiệu duyệt request, cấu hình template phản hồi và bật/tắt auto-response.

Luồng giá trị chính:

```text
Cào dữ liệu công khai
-> tiền xử lý
-> AI gán nhãn
-> gom nhóm contact và đánh giá influence/spam
-> Admin kiểm duyệt nhãn
-> publish dữ liệu cho thương hiệu
-> xử lý nghiệp vụ theo vai trò
-> báo cáo và audit
```

---

## 3. Vai trò chính trong Sprint 2

Quy tắc nền tảng:

**Admin không tham gia nhiệm vụ nghiệp vụ thương hiệu.** Admin vận hành nền tảng, tài khoản cấp cao và chất lượng dữ liệu đầu vào. Nghiệp vụ thương hiệu thuộc Quản lý thương hiệu và nhân viên của thương hiệu đó.

| Vai trò | Mục tiêu | Không làm |
|---|---|---|
| Admin | Phê duyệt tài khoản Quản lý thương hiệu, kiểm duyệt nhãn AI trước publish, theo dõi chất lượng dữ liệu/crawler | Không xử lý khủng hoảng, không chăm sóc lead, không quyết định phản hồi thay brand |
| Quản lý thương hiệu | Quản lý toàn bộ nghiệp vụ của một brand, quản lý nhân viên, duyệt request sửa nhãn, xem báo cáo, cấu hình auto-response | Không truy cập brand khác, không phê duyệt tài khoản Quản lý thương hiệu khác |
| Nhân viên xử lý khủng hoảng | Xem alerts/mentions tiêu cực của brand mình, xử lý khủng hoảng, gửi request sửa nhãn | Không xem/xử lý lead, không duyệt request, không cấu hình auto-response |
| Nhân viên xử lý khách hàng tiềm năng | Xem và xử lý hot/warm/cold leads của brand mình, cập nhật trạng thái chăm sóc | Không xem/xử lý khủng hoảng, không duyệt request, không cấu hình auto-response |

---

## 4. Người dùng làm gì sau đăng nhập?

InsightFlow không điều hướng tất cả người dùng vào cùng một dashboard chung. Mỗi vai trò có landing và hành động tiếp theo riêng.

| Vai trò | Landing ưu tiên trong cấu trúc hiện tại | Việc cần làm đầu tiên |
|---|---|---|
| Admin | `/dashboard` với mode vận hành | Kiểm tra dữ liệu/nhãn/tài khoản đang chờ duyệt |
| Quản lý thương hiệu | `/dashboard` với mode brand manager | Xem sức khỏe brand, request chờ duyệt và trạng thái đội xử lý |
| Nhân viên khủng hoảng | `/alerts` hoặc dashboard focus crisis | Mở item tiêu cực/khủng hoảng ưu tiên cao nhất |
| Nhân viên lead | `/leads` | Xử lý hot lead hoặc lead sắp quá hạn |

Onboarding/user guide phải theo vai trò, không dùng một hướng dẫn chung cho mọi người.

---

## 5. Tính năng trọng tâm Sprint 2

| Nhóm tính năng | Mục tiêu |
|---|---|
| Role-based access | Người dùng chỉ thấy đúng module, brand và action thuộc quyền |
| Brand isolation | Dữ liệu nghiệp vụ luôn được scope theo brand/workspace |
| Label lifecycle | Dữ liệu đi từ raw -> preprocessed -> ai_labeled -> admin_reviewing -> approved_for_publish -> published |
| Admin review | Admin kiểm duyệt nhãn AI trước khi publish dữ liệu cho brand |
| Contact Intelligence | Tổng hợp lịch sử contact-brand, influence score, spam score và priority boost |
| Label correction request | Nhân viên khủng hoảng gửi request sửa nhãn, Quản lý thương hiệu duyệt/từ chối/chỉnh lại |
| Role-based dashboard/report | Số liệu tích cực/tiêu cực/lead/khủng hoảng hiển thị theo mục tiêu từng vai trò |
| Auto-response safety | Brand Manager quản lý template, bật/tắt auto-response, high/critical phải manual review |
| Audit | Ghi lại thay đổi nhãn, quyền, request, lead/crisis status và auto-response |

---

## 6. Hiện trạng repo

Repo hiện ở trạng thái web-first/Firebase-first:

- `apps/web` là phần có giao diện và logic sản phẩm rõ nhất.
- Dashboard, Mentions, Alerts, Leads, Reports, Profile và Settings Brand đã có route/module cơ bản.
- Firebase/Firestore đang là nguồn dữ liệu chính ở frontend.
- `apps/api` có nền tảng Fastify/Firebase Admin, nhưng nhiều route nghiệp vụ còn placeholder.
- `database/schema.prisma` đã có các model nền như Tenant, Workspace, Mention, NlpResult, Alert, Lead, Report.
- `services/crawler`, `services/nlp`, `services/alert`, `services/lead`, `services/report` đã có cấu trúc ban đầu, một số phần vẫn là placeholder.

Điểm cần lưu ý:

- Sprint 2 **không yêu cầu đổi cấu trúc thư mục hiện tại**.
- Kiến trúc được cập nhật theo hướng `evolve in place`: bổ sung role guard, policy, service/data contract và role-aware components trong các module đang có.
- Không tạo mới cây route `/admin/*`, `/brand/*`, `/crisis/*` như điều kiện bắt buộc.

---

## 7. Cấu trúc thư mục hiện tại

```text
InsightFlow/
├── apps/
│   ├── web/                    # Next.js app chính
│   │   └── src/
│   │       ├── app/            # App Router: dashboard, mentions, alerts, leads, reports...
│   │       ├── components/     # UI components theo module hiện có
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── stores/
│   │       └── types/
│   └── api/                    # Fastify API app
├── services/
│   ├── crawler/
│   ├── nlp/
│   ├── alert/
│   ├── lead/
│   └── report/
├── database/
│   └── schema.prisma
├── shared/
├── infrastructure/
├── scripts/
├── docs/
├── package.json
└── turbo.json
```

Sprint 2 triển khai trong cấu trúc này bằng cách mở rộng:

- `stores/auth.store.ts`, `hooks/useAuth.ts`: user profile, role, membership.
- `lib/services/*`: data access theo role/brand scope.
- `components/dashboard`, `components/alerts`, `components/leads`, `components/reports`: widget theo vai trò.
- `app/dashboard`, `app/alerts`, `app/leads`, `app/settings/brand`: giữ route hiện có, đổi nội dung/action theo quyền.
- `apps/api/src/middleware`: auth, brand/tenant guard.
- `apps/api/src/routes`: mở rộng route hiện có hoặc thêm route domain nhỏ khi cần.

---

## 8. Công nghệ sử dụng

### Web

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 14 |
| Language | TypeScript |
| UI runtime | React 18 |
| Styling | Tailwind CSS |
| State | Zustand |
| Charts | Chart.js, react-chartjs-2, Recharts |
| Auth/Data | Firebase/Firestore |

### API và backend

| Layer | Công nghệ |
|---|---|
| Runtime | Node.js |
| Framework | Fastify |
| Auth admin | Firebase Admin |
| ORM target | Prisma |
| Workspace | npm workspaces |
| Build orchestration | Turbo |

### Services

| Service | Vai trò |
|---|---|
| `services/crawler` | Cào dữ liệu và pipeline tiền xử lý |
| `services/nlp` | AI/NLP labeling pipeline |
| `services/alert` | Cảnh báo và rule khủng hoảng |
| `services/lead` | Lead scoring và lead workflow |
| `services/report` | Tổng hợp báo cáo |

---

## 9. Cài đặt và chạy local

### Yêu cầu

- Node.js >= 20 LTS
- npm
- Python >= 3.11 nếu chạy các service Python
- Docker/Docker Compose nếu chạy hạ tầng phụ trợ

### Cài dependencies

```bash
npm install
```

### Chạy toàn bộ workspace dev

```bash
npm run dev
```

### Chạy web

```bash
npm run dev:web
```

### Chạy API

```bash
npm run dev:api
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

---

## 10. Biến môi trường

Tùy môi trường triển khai, dự án có thể cần các nhóm biến sau:

```env
# Firebase / Auth / Firestore
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Database target
DATABASE_URL=

# Optional service integrations
REDIS_URL=
KAFKA_BROKERS=
TELEGRAM_BOT_TOKEN=
ZALO_OA_TOKEN=
EMAIL_SERVICE_KEY=
```

Không commit secret thật vào repo.

---

## 11. Luồng dữ liệu Sprint 2

```text
Crawler chạy mỗi 1-2 tiếng
-> raw_collected
-> preprocessed
-> contact_resolved
-> ai_labeled
-> spam_assessed
-> admin_reviewing
-> approved_for_publish
-> published
-> contact_aggregated / priority_scored
-> brand users xử lý theo role
-> correction/audit/report
```

Quy tắc:

- Dữ liệu chưa `published` không xuất hiện trong dashboard/report của brand.
- Admin review là bước quản trị chất lượng dữ liệu, không phải nghiệp vụ xử lý khủng hoảng/lead.
- Contact có nhiều nội dung tiêu cực, ảnh hưởng cao và spam score thấp được tăng mức ưu tiên xử lý.
- Contact hoặc content có spam score cao không được boost priority như contact thật.
- Nhãn đã được Quản lý thương hiệu duyệt sửa phải trở thành active label cho dashboard/report.

---

## 12. Contact Intelligence

Contact Intelligence giúp InsightFlow hiểu bối cảnh của một đối tượng/contact với thương hiệu, thay vì chỉ nhìn từng mention rời rạc.

Hệ thống cần tổng hợp:

- Các post/comment của cùng contact trong cùng platform và brand.
- Sentiment history: phần lớn nội dung là tích cực, trung tính hay tiêu cực.
- Topic history: contact thường nói về vấn đề nào.
- Influence score: dựa trên like, comment, share, reply, view hoặc follower nếu có.
- Spam score: phát hiện content/contact có dấu hiệu spam, bot hoặc noise.
- Priority score: mức ưu tiên xử lý sau khi xét sentiment, influence, recency và spam.

Ví dụ:

```text
Một contact có 8 post/comment về Brand X trong 7 ngày
-> 6 nội dung negative
-> tổng tương tác cao
-> spam score thấp
-> hệ thống tăng priority trong crisis queue
```

Khuyến nghị Sprint 2:

- Chỉ gom contact trong cùng platform trước.
- Không gom cross-platform nếu chỉ dựa vào tên hiển thị.
- Spam detection cần áp dụng ở cả content-level và contact-level.

---

## 13. Auto-response

Auto-response phải an toàn theo brand.

Mode đề xuất:

- `off`: mặc định cho brand mới.
- `suggest_only`: hệ thống gợi ý, người dùng gửi thủ công.
- `auto_safe`: chỉ tự động trong tình huống rủi ro thấp đã cấu hình.
- `manual_review_required`: chuẩn bị phản hồi nhưng cần duyệt.

Quy tắc:

- Quản lý thương hiệu bật/tắt auto-response cho brand mình.
- High/critical crisis không được tự động phản hồi công khai nếu chưa qua manual review.
- Mọi response event phải audit được.

---

## 14. Quy trình phát triển đề xuất

Khi phát triển Sprint 2, ưu tiên theo thứ tự:

1. Role profile, membership, route guard, sidebar theo quyền.
2. Brand/data scope ở service/API layer.
3. Data lifecycle và Admin review queue.
4. Contact Intelligence: contact resolution, influence score, spam score, priority score.
5. Label correction request workflow.
6. Dashboard/report theo vai trò.
7. Onboarding/user guide theo vai trò.
8. Response template, auto-response setting và safety gate.
9. Audit log cho các thao tác quan trọng.

Nguyên tắc:

- Không refactor cấu trúc thư mục nếu chưa cần.
- Không chỉ ẩn menu ở frontend; quyền phải được enforce ở data access/API layer.
- Không đưa dữ liệu AI chưa duyệt vào báo cáo thương hiệu.
- Không để Admin bị lẫn vào workflow xử lý nghiệp vụ của brand.

---

## 15. Phạm vi sản phẩm

### In scope

- Dữ liệu truyền thông công khai.
- Brand monitoring theo workspace/brand.
- AI labeling và human-in-the-loop review.
- Contact Intelligence trong cùng platform và brand.
- Crisis workflow.
- Lead workflow.
- Role-based dashboard/report.
- Auto-response có kiểm soát.
- Audit các thao tác quan trọng.

### Out of scope trong Sprint 2

- Admin xử lý khủng hoảng hoặc lead thay brand.
- Tự động phản hồi mọi tình huống không qua safety gate.
- Cào dữ liệu private message, group kín hoặc dữ liệu không công khai.
- Refactor bắt buộc toàn bộ cấu trúc thư mục/route.
- Gom contact xuyên nền tảng bằng tín hiệu yếu như tên hiển thị.

---

## 16. Definition of Done cấp sản phẩm

Sprint 2 được coi là đúng hướng khi:

- Người dùng đăng nhập biết phải làm gì tiếp theo.
- Mỗi vai trò chỉ thấy đúng dữ liệu và chức năng.
- Admin được tách khỏi nghiệp vụ brand.
- Dữ liệu đi qua lifecycle rõ ràng trước khi publish.
- Có thể tổng hợp nhiều post/comment của cùng contact trong cùng platform và brand.
- Priority tăng khi contact có nhiều nội dung tiêu cực, influence cao và không phải spam.
- Spam contact/content không được ưu tiên như contact thật.
- Nhân viên khủng hoảng gửi được request sửa nhãn.
- Quản lý thương hiệu duyệt/từ chối/chỉnh request sửa nhãn.
- Lead và crisis được tách quyền rõ.
- Report dùng nhãn đã duyệt/latest active label.
- Auto-response có bật/tắt, mode an toàn và audit.
- Tài liệu `SPEC.md`, `ARCHITECTURE.md`, `README.md` thống nhất với nhau.

---

## 17. Change Log

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 2.1 | 2026-07-02 | Bổ sung Contact Intelligence: contact-level aggregation, influence score, spam score và priority boost. |
| 2.0 | 2026-07-02 | Cập nhật README theo SPEC/ARCHITECTURE Sprint 2: role-based workflow, không đổi cấu trúc thư mục, label lifecycle, onboarding, report và auto-response safety. |

## 18. Tài khoản test
Tài khoản test, mật khẩu chung: Test@123456
Role	Email	Trang sau đăng nhập
Admin	demo.admin@insightflow.com	/admin
Quản lý thương hiệu	manager@highlandscoffee.com	/dashboard
Nhân viên xử lý khủng hoảng	nguyen_van_crisis@highlandscoffee.com	/alerts
Nhân viên xử lý lead	tran_thi_lead@highlandscoffee.com	/leads