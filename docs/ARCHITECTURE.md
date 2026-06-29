# InsightFlow — System Architecture

> Phiên bản: 1.1  
> Trạng thái: Cập nhật theo repo hiện tại và commit history `main`  
> Mục tiêu: mô tả **kiến trúc đang có trong code**, đồng thời tách rõ phần định hướng tương lai.

---

## 1. Tổng quan kiến trúc hiện tại

InsightFlow hiện đang được triển khai theo hướng **monorepo web-first**.

Kiến trúc thực tế trong repo hiện tại:

```text
InsightFlow/
├── apps/
│   └── web/                  # Ứng dụng web chính — Next.js 14
├── docs/                     # Tài liệu dự án
├── services/                 # Placeholder/service folder cho alert, crawler, lead, nlp, report
├── shared/                   # Shared types/constants/utils
├── scripts/                  # Script setup/deploy/seed
├── infrastructure/           # Placeholder infra config
├── database/                 # Placeholder database/migration
├── package.json              # Root workspace + turbo
└── turbo.json                # Turborepo config
```

Ở trạng thái hiện tại, phần có logic sản phẩm rõ nhất là `apps/web`.

---

## 2. Tech stack hiện tại

### 2.1 Frontend Web

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 14 |
| Language | TypeScript |
| UI Runtime | React 18 |
| Styling | Tailwind CSS |
| Chart | Chart.js, react-chartjs-2, Recharts |
| State Management | Zustand |
| Data Source | Firebase/Firestore |
| Icon | lucide-react |
| Realtime client package | socket.io-client, hiện mới ở mức dependency |

### 2.2 Monorepo

| Thành phần | Công nghệ |
|---|---|
| Workspace | npm workspaces |
| Build orchestration | Turbo |
| Web package | `@insightflow/web` |

---

## 3. Kiến trúc thư mục `apps/web`

```text
apps/web/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login/Register/Auth pages
│   │   ├── alerts/           # Trang cảnh báo
│   │   ├── dashboard/        # Dashboard tổng quan
│   │   ├── leads/            # Lead page
│   │   ├── mentions/         # Mention list/page
│   │   ├── nganh/            # Trang ngành/lĩnh vực
│   │   ├── profile/          # Trang hồ sơ
│   │   ├── reports/          # Trang báo cáo
│   │   ├── settings/brand/   # Cài đặt thương hiệu
│   │   ├── ve-chung-toi/     # Trang giới thiệu
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx          # Trang chủ
│   ├── components/
│   │   ├── alerts/
│   │   ├── auth/
│   │   ├── charts/
│   │   ├── dashboard/
│   │   ├── home/
│   │   ├── layout/
│   │   ├── mentions/
│   │   ├── nganh/
│   │   ├── profile/
│   │   └── ve-chung-toi/
│   ├── hooks/
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── services/
│   ├── stores/
│   └── types/
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Data flow hiện tại

### 4.1 Dashboard data flow

```text
Firestore
   ↓
Firebase Client (`lib/firebase.ts`)
   ↓
Service layer (`lib/services/dashboard`)
   ↓
Hook/store (`hooks`, `stores/dashboard.store.ts`)
   ↓
Dashboard components
   ↓
Stat cards, sentiment chart, top sources, top topics, alerts/leads summary
```

Dashboard không nên phụ thuộc vào dữ liệu hard-code. Sau commit `add data tren trang dashboard`, dữ liệu dashboard được định hướng lấy từ Firebase/Firestore rồi tính toán lại theo filter.

### 4.2 Mentions data flow

```text
Firestore mentions collection / dữ liệu mention đã chuẩn hóa
   ↓
Firebase client/service
   ↓
Mentions page/components
   ↓
Hiển thị content, platform/source, sentiment, topic, posted_at
```

Sau commit `đẩy dữ liệu lên mention`, trang Mentions cần được xem là màn hình tiêu thụ dữ liệu thật từ Firestore thay vì chỉ layout tĩnh.

---

## 5. Frontend architecture theo module

### 5.1 Routing layer

Routing dùng Next.js App Router.

| Route | Mục đích |
|---|---|
| `/` | Trang chủ / Landing page |
| `/(auth)` | Nhóm trang đăng nhập/đăng ký |
| `/dashboard` | Dashboard tổng quan |
| `/mentions` | Danh sách mention |
| `/alerts` | Danh sách cảnh báo |
| `/reports` | Báo cáo |
| `/leads` | Lead list |
| `/profile` | Hồ sơ người dùng |
| `/settings/brand` | Cài đặt thương hiệu |
| `/nganh` | Trang ngành/lĩnh vực |
| `/ve-chung-toi` | Trang giới thiệu |

### 5.2 Component layer

Components được chia theo domain:

| Folder | Vai trò |
|---|---|
| `components/home` | Section trang chủ |
| `components/auth` | UI xác thực |
| `components/dashboard` | Dashboard cards, filters, charts, top lists |
| `components/mentions` | UI danh sách mention |
| `components/alerts` | UI cảnh báo |
| `components/charts` | Thành phần biểu đồ dùng lại |
| `components/layout` | Header/layout dùng chung |
| `components/profile` | UI hồ sơ |
| `components/nganh` | UI trang ngành |
| `components/ve-chung-toi` | UI giới thiệu |

### 5.3 State layer

State hiện dùng Zustand.

Mục tiêu state layer:

- Lưu danh sách mentions, alerts, leads, workspaces.
- Lưu filter dashboard.
- Cung cấp helper như `getFilteredMentions`, `getFilteredAlerts`, `getFilteredLeads`.
- Giúp dashboard tính toán lại khi dữ liệu hoặc filter thay đổi.

### 5.4 Service layer

Service layer nằm trong `src/lib/services`.

Vai trò:

- Đọc dữ liệu từ Firebase/Firestore.
- Chuẩn hóa dữ liệu cho UI.
- Tính toán dashboard stats, top sources, top topics.
- Giảm việc để component xử lý trực tiếp logic dữ liệu.

---

## 6. Entity architecture hiện tại

### 6.1 Mention

```ts
type Mention = {
  id: string;
  content?: string;
  text?: string;
  platform: string;
  source?: string;
  sentiment: "positive" | "neutral" | "negative";
  topic?: Topic;
  posted_at: string | Date;
  created_at?: string | Date;
  ai_summary?: string;
};
```

### 6.2 Topic

Topic phải nằm trong union type frontend. Commit sửa lỗi `marketting không có trong union type topic` cho thấy cần tránh đưa dữ liệu ngoài type.

Khuyến nghị chuẩn hóa:

```ts
type Topic =
  | "quality"
  | "price"
  | "service"
  | "staff"
  | "delivery"
  | "experience"
  | "marketing"
  | "operation"
  | "competitor"
  | "other";
```

### 6.3 DashboardFilters

```ts
type DashboardFilters = {
  workspace_id?: string;
  time_range?: "today" | "7d" | "30d" | "custom";
  platform?: string;
};
```

Lưu ý: chỉ giữ các field thực sự dùng trong component. Nếu thêm field mới như `topic` hoặc `sentiment`, phải cập nhật type trước khi dùng để tránh lỗi build Vercel.

---

## 7. Trình tự tiến hóa kiến trúc theo commit

### Giai đoạn 1 — Foundation

```text
Repo init
→ Tạo monorepo structure
→ Tạo docs/services/shared/scripts placeholder
→ Dọn file thừa và gitignore
```

### Giai đoạn 2 — Web shell & Home

```text
Next.js app
→ Trang chủ
→ Fix layout home
→ Chuẩn hóa header/layout
```

### Giai đoạn 3 — Auth

```text
Auth routes/components
→ Login/logout
→ Session logout handling
→ Merge auth branch vào main
```

### Giai đoạn 4 — Dashboard

```text
Dashboard layout
→ Dashboard components
→ Dashboard filters
→ Store/service/hook
→ Firebase data
→ Chart/stat recalculation
```

### Giai đoạn 5 — Business pages

```text
Mentions layout
→ Mentions data
→ Alerts layout
→ Reports page
→ Leads/Profile/Settings/Industry/About pages
→ Responsive update
```

### Giai đoạn 6 — AI/data fix & build stabilization

```text
AI analysis display update
→ Data field fix: posted_at/poster_at
→ Topic union type fix
→ Vercel/build fixes
→ Merge information/dashboard/mention branches
```

---

## 8. Kiến trúc chưa nên ghi là đã hoàn thành

Các phần sau có thể nằm trong tầm nhìn sản phẩm hoặc placeholder thư mục, nhưng chưa nên mô tả là kiến trúc production đã chạy nếu không có commit triển khai đầy đủ:

- Kafka event bus.
- PostgreSQL production schema.
- Elasticsearch search engine.
- Redis queue/session.
- Kubernetes/HPA.
- Crawler đa nền tảng production.
- NLP FastAPI service fine-tune PhoBERT.
- Alert service gửi Telegram/Zalo/Email end-to-end.
- Lead service scoring production.
- Report service export PDF/Excel production.

---

## 9. Kiến trúc đề xuất cho bước tiếp theo

Để phát triển tiếp mà không làm rối repo, nên đi theo thứ tự:

1. Chuẩn hóa Firestore schema: `mentions`, `dashboard_stats`, `alerts`, `leads`, `reports`, `brands`.
2. Tách rõ `lib/services/*` cho từng domain: dashboard, mentions, alerts, leads, reports.
3. Chuẩn hóa type trong `types/*` trước khi thêm field vào UI.
4. Thêm backend/API chỉ khi FE đã ổn định data contract.
5. Khi có crawler/NLP thật, thêm pipeline riêng thay vì nhét logic xử lý vào component.
6. Chỉ cập nhật tài liệu production architecture sau khi service thật được commit.

---

## 10. Nguyên tắc maintain kiến trúc

- Không để component gọi Firestore trực tiếp nếu logic có thể đặt ở service.
- Không thêm field dữ liệu mới nếu chưa cập nhật TypeScript type.
- Không dùng mock data lẫn với data thật mà không có tên rõ ràng.
- Không ghi docs vượt quá trạng thái code hiện tại.
- Mỗi module mới cần có route, component, type và service rõ ràng nếu có dữ liệu động.
---

## 11. Corrections 2026-06-29

Các ghi chú dưới đây phản ánh trạng thái code hiện tại và ưu tiên hơn các mô tả cũ nếu có chênh lệch:

### 11.1 Route inventory hiện tại

- Route `/settings/brand` vẫn tồn tại trong app shell hiện tại.
- Module `mentions` hiện gồm:
  - `/mentions`
  - `/mentions/[id]`

### 11.2 Frontend modules mới/đã cập nhật

- `apps/web/src/components/platform/PlatformLogo.tsx`
  - Shared component dùng chung cho logo nền tảng ở bảng Mentions và trang chi tiết đề cập.
- `apps/web/src/app/mentions/[id]/page.tsx`
  - Bổ sung comment filtering, back-to-top, summary panel bên phải gọn hơn và logic scroll theo app container.

### 11.3 Dữ liệu và UI shell

- `workspace` vẫn là đơn vị tổ chức dữ liệu thương hiệu trong frontend store/service.
- Route cấu hình thương hiệu riêng (`/settings/brand`) vẫn là một phần của app shell hiện tại.
