# InsightFlow - Kiến trúc hệ thống

> Phiên bản: 2.0  
> Trạng thái: Bản nháp kiến trúc mục tiêu Sprint 2  
> Ngày cập nhật: 2026-07-02  
> Cơ sở nghiệp vụ: `docs/SPEC.md` phiên bản 2.0  
> Phạm vi: Role-based architecture, brand isolation, label lifecycle, onboarding, reporting, audit và auto-response safety

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả kiến trúc hệ thống InsightFlow theo hai lớp:

1. **Baseline hiện tại**: những gì repo đang có ở mức web-first/Firebase-first.
2. **Kiến trúc mục tiêu Sprint 2**: kiến trúc cần hướng tới để đáp ứng `SPEC.md` phiên bản 2.0.

Tài liệu này không khẳng định toàn bộ kiến trúc mục tiêu đã được implement. Các phần Sprint 2 Target Architecture là định hướng thiết kế để đội phát triển triển khai, QA kiểm thử và PO chốt phạm vi.

---

## 2. Baseline hiện tại

InsightFlow hiện là monorepo web-first. Phần có logic sản phẩm rõ nhất nằm ở `apps/web`.

```text
InsightFlow/
├── apps/
│   ├── web/                  # Next.js app chính
│   └── api/                  # API app, nhiều route còn placeholder
├── services/
│   ├── crawler/              # Crawler service placeholder/pipeline sơ bộ
│   ├── nlp/                  # NLP service placeholder/pipeline sơ bộ
│   ├── alert/                # Alert service placeholder
│   ├── lead/                 # Lead service placeholder/scoring sơ bộ
│   └── report/               # Report service sơ bộ
├── database/
│   └── schema.prisma         # Schema có Tenant/Workspace/Mention/NlpResult/Alert/Lead/Report
├── shared/
├── docs/
├── infrastructure/
├── scripts/
├── package.json
└── turbo.json
```

### 2.1 Tech stack hiện tại

| Layer | Công nghệ hiện tại |
|---|---|
| Web | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Chart | Chart.js, react-chartjs-2, Recharts |
| Auth/Data source | Firebase/Firestore ở frontend |
| API | Fastify/Node.js, Firebase Admin ở một số middleware/route |
| Monorepo | npm workspaces, Turbo |
| Database target | Prisma/PostgreSQL schema đã có, chưa là nguồn dữ liệu chính của web |

### 2.2 Giới hạn baseline

Baseline hiện tại phù hợp demo dashboard/mentions nhưng chưa đủ cho Sprint 2:

- Auth store chủ yếu giữ Firebase user, chưa có user profile/role/membership đầy đủ.
- Tenant middleware còn placeholder.
- Một số route backend như workspaces, mentions, leads còn placeholder.
- Frontend đang đọc dữ liệu Firestore trực tiếp và lọc ở client.
- Workspace/brand ở web có phần được suy ra từ dữ liệu mention.
- Chưa có role-based route guard đầy đủ.
- Chưa có data lifecycle từ raw đến published theo trạng thái nghiệp vụ.
- Chưa có workflow chuẩn cho label correction request.
- Chưa có audit model đầy đủ cho thay đổi nhãn, phân quyền, auto-response.

Vì vậy Sprint 2 cần bổ sung kiến trúc domain và access control rõ hơn thay vì chỉ thêm UI.

---

## 3. Nguyên tắc kiến trúc Sprint 2

### 3.0 Không thay đổi cấu trúc thư mục hiện tại

Sprint 2 không yêu cầu đổi cấu trúc thư mục của hệ thống.

Kiến trúc mục tiêu phải được triển khai theo hướng **evolve in place**:

- Giữ nguyên các route và module chính đang có như `/dashboard`, `/mentions`, `/alerts`, `/leads`, `/reports`, `/settings/brand`, `/profile`.
- Không bắt buộc tạo cây route mới như `/admin/*`, `/brand/*`, `/crisis/*`.
- Bổ sung role guard, policy, service layer, data contract và component logic bên trong cấu trúc hiện tại.
- Nếu cần thêm màn hình mới, ưu tiên thêm ở module hiện có hoặc tạo route nhỏ có mục đích rõ ràng, không refactor toàn bộ app shell.
- Không đổi cấu trúc thư mục chỉ để phản ánh vai trò; vai trò phải được điều khiển bằng policy, route guard và role-aware components.

### 3.1 Role-first

Mọi màn hình, route, API và query dữ liệu phải bắt đầu từ câu hỏi:

- Người dùng là ai?
- Thuộc brand nào?
- Vai trò của họ trong brand là gì?
- Họ được phép xem và thao tác nghiệp vụ nào?

### 3.2 Admin không xử lý nghiệp vụ thương hiệu

Admin vận hành hệ thống, tài khoản cấp cao và chất lượng dữ liệu đầu vào.

Admin không có business task queue cho:

- Xử lý khủng hoảng.
- Chăm sóc lead.
- Duyệt phản hồi truyền thông thay thương hiệu.
- Quyết định chiến lược phản hồi của brand.

### 3.3 Brand isolation

Mọi dữ liệu nghiệp vụ của brand phải được scope theo `brand_id` hoặc `workspace_id`.

Không được chỉ ẩn dữ liệu bằng UI. Backend/data access layer phải enforce quyền.

### 3.4 Data lifecycle có kiểm duyệt

Dữ liệu chưa được Admin kiểm duyệt không được xuất hiện trong dashboard/report nghiệp vụ của brand.

Pipeline mục tiêu:

```text
raw_collected
-> preprocessed
-> ai_labeled
-> admin_reviewing
-> approved_for_publish
-> published
```

### 3.5 Human-in-the-loop

AI hỗ trợ gán nhãn nhưng không phải nguồn quyết định cuối cùng.

- Admin kiểm duyệt nhãn đầu vào trước publish.
- Nhân viên khủng hoảng có thể gửi request sửa nhãn sau khi dữ liệu đã publish.
- Quản lý thương hiệu duyệt request sửa nhãn trong phạm vi brand.

### 3.6 Audit mọi thao tác quan trọng

Những thao tác sau phải có audit log hoặc event sẵn sàng audit:

- Admin chỉnh nhãn.
- Admin approve/reject record.
- Quản lý thương hiệu duyệt/từ chối request sửa nhãn.
- Thay đổi vai trò nhân viên.
- Bật/tắt auto-response.
- Lead/crisis status changes.
- Public response hoặc auto-response event.

### 3.7 Auto-response có safety gate

Auto-response không được là một nút bật tự động cho mọi tình huống.

Hệ thống cần có:

- Template.
- Mode theo brand.
- Safety gate.
- Manual review cho nội dung high/critical crisis.
- Emergency pause.
- Audit log.

---

## 4. Domain architecture mục tiêu

Sprint 2 nên tách hệ thống thành các domain sau:

| Domain | Trách nhiệm |
|---|---|
| Identity & Access | Xác thực, user profile, role, brand membership, route/API guard |
| Brand/Workspace Management | Thông tin brand, keyword config, thành viên brand |
| Data Ingestion | Cào dữ liệu định kỳ 1-2 tiếng/lần |
| Preprocessing | Chuẩn hóa, dedup, spam filter, PII handling nếu cần |
| AI Labeling | Gán sentiment, topic, crisis level, lead intent |
| Admin Label Review | Hàng chờ Admin kiểm duyệt nhãn trước publish |
| Published Brand Data | Dữ liệu đã được duyệt và hiển thị cho brand |
| Label Correction Request | Nhân viên khủng hoảng gửi request, Quản lý thương hiệu duyệt |
| Crisis Operations | Queue xử lý khủng hoảng của brand |
| Lead Operations | Queue xử lý khách hàng tiềm năng của brand |
| Reporting | Báo cáo theo role, dùng dữ liệu đã publish/latest approved labels |
| Response Templates | Template phản hồi theo brand, sentiment, topic, crisis level |
| Auto-Response Safety | Mode bật/tắt, rule an toàn, manual review, emergency pause |
| Onboarding/User Guide | First login, checklist, role-specific guide |
| Audit & Observability | Audit log, metrics vận hành, crawler/model health |

### 4.1 Sơ đồ domain tổng quát

```text
                   ┌──────────────────────┐
                   │ Identity & Access    │
                   │ User / Role / Brand  │
                   └──────────┬───────────┘
                              │
                              ▼
┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│ Crawler  │ ->│ Preprocess   │ ->│ AI Labeling  │ ->│ Admin Review     │
└──────────┘   └──────────────┘   └──────────────┘   └────────┬─────────┘
                                                               │ approve
                                                               ▼
                                                     ┌──────────────────┐
                                                     │ Published Data   │
                                                     └───────┬──────────┘
                                                             │
                  ┌──────────────────────────────────────────┼──────────────────────────────────┐
                  ▼                                          ▼                                  ▼
        ┌──────────────────┐                       ┌──────────────────┐             ┌──────────────────┐
        │ Crisis Operations│                       │ Lead Operations  │             │ Reporting        │
        └────────┬─────────┘                       └────────┬─────────┘             └──────────────────┘
                 │                                          │
                 ▼                                          ▼
        ┌──────────────────┐                       ┌──────────────────┐
        │ Label Requests   │                       │ Lead Status      │
        └────────┬─────────┘                       └────────┬─────────┘
                 │                                          │
                 ▼                                          ▼
        ┌──────────────────┐                       ┌──────────────────┐
        │ Brand Manager    │                       │ Brand Manager    │
        │ Approval         │                       │ Monitoring       │
        └──────────────────┘                       └──────────────────┘
```

---

## 5. Identity and access architecture

### 5.1 Role model

Allowed roles:

- `admin`
- `brand_manager`
- `crisis_employee`
- `lead_employee`

### 5.2 Access control layers

Access control phải có nhiều lớp:

```text
Firebase/Auth provider
-> user profile
-> role
-> brand membership
-> permission policy
-> route guard
-> API middleware guard
-> data query scope
```

Không được xem frontend menu hiding là bảo mật đầy đủ.

### 5.3 User profile

`UserProfile` là hồ sơ nghiệp vụ của user, tách khỏi Firebase Auth user.

Trường chính:

- `id`
- `auth_uid`
- `email`
- `display_name`
- `status`
- `must_change_password`
- `onboarding_completed`
- `created_at`
- `last_login_at`

### 5.4 Brand membership

`BrandMembership` xác định user thuộc brand nào và giữ vai trò gì trong brand.

Trường chính:

- `id`
- `brand_id`
- `user_id`
- `role`
- `status`
- `created_by`
- `created_at`

Quy tắc:

- Brand Manager có membership với role `brand_manager`.
- Crisis Employee có membership với role `crisis_employee`.
- Lead Employee có membership với role `lead_employee`.
- Admin có thể không cần brand membership cho nghiệp vụ brand; Admin dùng platform role.

### 5.5 Permission policy

Policy phải trả lời được:

- User có quyền truy cập brand này không?
- User có quyền xem module này không?
- User có quyền thực hiện action này không?
- Action này là platform operation hay brand business operation?

Ví dụ policy:

```text
can(user, "review_ai_label", record)
-> true nếu user.role = admin

can(user, "handle_crisis_task", task)
-> true nếu user.role = crisis_employee
-> và user.brand_id = task.brand_id

can(user, "handle_lead", lead)
-> true nếu user.role = lead_employee
-> và user.brand_id = lead.brand_id

can(user, "approve_label_correction", request)
-> true nếu user.role = brand_manager
-> và user.brand_id = request.brand_id
```

---

## 6. Target data model

Phần này mô tả data model mục tiêu theo nghiệp vụ. Schema vật lý có thể dùng Prisma/PostgreSQL, Firestore hoặc mô hình chuyển tiếp, nhưng cần đảm bảo các thực thể này tồn tại ở data contract.

### 6.1 Core identity entities

| Entity | Mục đích |
|---|---|
| `UserProfile` | Hồ sơ nghiệp vụ của người dùng |
| `Role` | Role hợp lệ của hệ thống |
| `BrandMembership` | Liên kết user với brand và vai trò |
| `ProvisionedAccount` | Tài khoản cấp sẵn, mật khẩu tạm, trạng thái đổi mật khẩu |

### 6.2 Brand entities

| Entity | Mục đích |
|---|---|
| `Brand` hoặc `Workspace` | Không gian dữ liệu của một thương hiệu |
| `BrandKeywordConfig` | Từ khóa, synonym, từ khóa loại trừ |
| `BrandAutoResponseSetting` | Mode auto-response theo brand |

### 6.3 Data and labeling entities

| Entity | Mục đích |
|---|---|
| `RawMention` | Dữ liệu mới cào, chưa xử lý |
| `Mention` | Mention đã chuẩn hóa |
| `Label` | Nhãn hiện tại của mention |
| `LabelReview` | Admin review trước publish |
| `LabelCorrectionRequest` | Request sửa nhãn từ phía brand |
| `LabelHistory` | Lịch sử thay đổi nhãn |

### 6.4 Operation entities

| Entity | Mục đích |
|---|---|
| `Alert` | Cảnh báo khủng hoảng |
| `CrisisTask` | Công việc xử lý khủng hoảng |
| `Lead` | Khách hàng tiềm năng |
| `LeadActivity` | Lịch sử chăm sóc lead |
| `ReportSnapshot` | Snapshot báo cáo theo kỳ |
| `ResponseTemplate` | Template phản hồi |
| `ResponseEvent` | Sự kiện phản hồi hoặc auto-response |
| `AuditLog` | Nhật ký thao tác quan trọng |

### 6.5 Mapping với schema hiện tại

Schema hiện tại đã có:

- `Tenant`
- `Workspace`
- `Mention`
- `NlpResult`
- `Alert`
- `Lead`
- `Report`

Cần bổ sung hoặc mô phỏng ở tầng data contract:

- `UserProfile`
- `BrandMembership`
- `ProvisionedAccount`
- `LabelReview`
- `LabelCorrectionRequest`
- `LabelHistory`
- `CrisisTask`
- `ResponseTemplate`
- `BrandAutoResponseSetting`
- `ResponseEvent`
- `AuditLog`

---

## 7. Data lifecycle architecture

### 7.1 Pipeline mục tiêu

```text
Crawler Scheduler
-> Raw Data Store
-> Preprocessing Pipeline
-> AI Labeling Service
-> Admin Review Queue
-> Published Brand Data
-> Role-Based Work Queues
-> Reports and Audit
```

### 7.2 State machine

| State | Producer | Consumer | Ghi chú |
|---|---|---|---|
| `raw_collected` | Crawler | Preprocessing | Dữ liệu mới cào |
| `preprocessed` | Preprocessing | AI Labeling | Đã normalize/dedup/filter lỗi cơ bản |
| `ai_labeled` | AI Labeling | Admin Review | Có nhãn AI và confidence |
| `admin_reviewing` | Admin Review Queue | Admin | Chờ kiểm duyệt |
| `approved_for_publish` | Admin | Publish worker/API | Đủ điều kiện publish |
| `published` | Publish worker/API | Brand users | Brand thấy theo quyền |
| `correction_requested` | Crisis Employee | Brand Manager | Chờ duyệt sửa nhãn |
| `brand_relabel_approved` | Brand Manager | Dashboard/Reports | Nhãn mới được dùng |
| `brand_relabel_rejected` | Brand Manager | Audit/Requester | Giữ nhãn cũ |
| `archived` | Retention process | Audit | Không còn active |

### 7.3 Admin review queue

Admin review queue nhận dữ liệu ở trạng thái `ai_labeled` hoặc `admin_reviewing`.

Queue cần hỗ trợ:

- Filter theo brand.
- Filter theo source.
- Filter theo confidence thấp.
- Filter theo sentiment/topic/crisis/lead intent.
- Approve từng record.
- Bulk approve khi rule cho phép.
- Reject record.
- Chỉnh nhãn trước publish.

Kết quả của Admin review:

- `approved_for_publish`
- `rejected`
- `needs_manual_check` nếu cần kiểm tra sâu hơn

### 7.4 Published data contract

Brand-facing module chỉ đọc dữ liệu:

- `data_state = published`
- `brand_id` thuộc membership của user
- label active là nhãn đã được duyệt mới nhất

Report không được tính từ raw/unreviewed labels.

---

## 8. Application layer architecture

### 8.1 Frontend modules trong cấu trúc hiện tại

Sprint 2 không yêu cầu thêm cây thư mục mới cho từng vai trò. Các module hiện có vẫn là nơi triển khai chính:

```text
apps/web/src/
├── app/
│   ├── (auth)/
│   ├── dashboard/            # Dashboard hiện có, render theo role
│   ├── mentions/             # Mention list/detail hiện có, scope theo role
│   ├── alerts/               # Alerts hiện có, dùng cho crisis workflow
│   ├── leads/                # Leads hiện có
│   ├── reports/              # Reports hiện có
│   ├── settings/brand/       # Brand settings hiện có
│   └── profile/              # Profile hiện có
├── components/
│   ├── dashboard/            # Thêm role-aware widgets trong module hiện có
│   ├── mentions/             # Thêm action/request theo quyền trong module hiện có
│   ├── alerts/               # Thêm crisis queue view trong module hiện có
│   ├── leads/                # Thêm lead queue view trong module hiện có
│   ├── reports/              # Thêm report sections theo role trong module hiện có
│   ├── profile/              # Thêm first-login/onboarding state nếu phù hợp
│   └── layout/
├── hooks/
├── lib/                      # Mở rộng helper/service hiện có, không bắt buộc thêm thư mục mới
├── stores/
└── types/
```

Việc tách domain nên thực hiện ở tầng policy/service/component bên trong các module hiện có, không phải bằng cách đổi toàn bộ folder tree.

Các logical module cần bổ sung có thể nằm trong file/service hiện có:

| Logical module | Nơi triển khai ưu tiên |
|---|---|
| Auth profile, role, membership | `stores/auth.store.ts`, `hooks/useAuth.ts`, service hiện có |
| Permission policy | Helper trong `lib` hoặc service hiện có |
| Role-aware dashboard | `app/dashboard`, `components/dashboard`, `stores/dashboard.store.ts` |
| Crisis workflow | `app/alerts`, `components/alerts`, mention detail hiện có |
| Lead workflow | `app/leads`, `components/leads`, lead store hiện có |
| Label correction request | Mention detail/modal trong `app/mentions` hoặc `components/mentions` |
| Response templates/auto-response | `app/settings/brand` và component brand settings hiện có |
| Onboarding/user guide | `profile`, layout shell, hoặc modal/checklist trong route sau login |

Ví dụ:

- `/dashboard` vẫn là route dashboard, nhưng nội dung bên trong được chọn theo role.
- `/alerts` là nơi Crisis Employee xử lý khủng hoảng và Brand Manager giám sát khủng hoảng.
- `/leads` chỉ mở cho Brand Manager và Lead Employee.
- `/settings/brand` có thể chứa phần cấu hình brand, nhân viên, response templates và auto-response.
- `/mentions` và `/mentions/[id]` dùng cùng route hiện có nhưng lọc dữ liệu và action theo quyền.

Nếu sau này cần refactor route hoặc thư mục theo domain sâu hơn, phải là quyết định riêng sau Sprint 2, không phải điều kiện bắt buộc của kiến trúc này.

### 8.2 Frontend responsibilities

Frontend chịu trách nhiệm:

- Hiển thị UI theo role.
- Điều hướng sau login theo role.
- Chặn route ở client để UX tốt hơn.
- Hiển thị empty state và onboarding theo role.
- Gọi API/data service đã enforce quyền.
- Không tự quyết định quyền bảo mật cuối cùng.

### 8.3 Backend/API target modules

API nên được tách theo domain ở mức route handler/service, nhưng không bắt buộc thay đổi lớn cấu trúc thư mục. Nếu các file route hiện có đang nằm trong `apps/api/src/routes`, có thể mở rộng ngay trong thư mục đó.

| API group | Mục đích |
|---|---|
| `/auth` | Session, profile, first-login state |
| `/users` | User profile và platform user management |
| `/brands` | Brand/workspace management |
| `/memberships` | Thành viên và role trong brand |
| `/mentions` | Published mention access theo quyền |
| `/labels` | Label active và Admin review |
| `/label-requests` | Request sửa nhãn |
| `/alerts` | Alerts theo brand và role |
| `/crisis-tasks` | Task khủng hoảng |
| `/leads` | Lead queue và lead status |
| `/reports` | Report snapshot và report data |
| `/response-templates` | Template phản hồi |
| `/auto-response` | Mode bật/tắt và safety controls |
| `/audit` | Audit log |

### 8.4 Backend responsibilities

Backend/data access layer chịu trách nhiệm:

- Verify token.
- Resolve `UserProfile`.
- Resolve role và brand memberships.
- Enforce permission policy.
- Scope query theo `brand_id`.
- Enforce data state, ví dụ chỉ brand users thấy `published`.
- Ghi audit log cho action quan trọng.

---

## 9. Role-based routing architecture

### 9.1 Route mapping giữ nguyên cấu trúc hiện tại

| Role | Landing route | Các route chính |
|---|---|---|
| Admin | `/dashboard` với mode Admin | `/dashboard`, `/mentions`, `/profile` và các panel quản trị được bật theo quyền |
| Brand Manager | `/dashboard` với mode Brand Manager | `/dashboard`, `/mentions`, `/alerts`, `/leads`, `/reports`, `/settings/brand` |
| Crisis Employee | `/alerts` hoặc `/dashboard` với focus crisis | `/alerts`, `/mentions`, `/mentions/[id]` trong phạm vi crisis |
| Lead Employee | `/leads` | `/leads` và chi tiết lead nếu có trong route hiện tại |

Giải thích:

- Không cần đổi route sang `/admin/*`, `/brand/*`, `/crisis/*`.
- Route hiện tại được giữ lại, nhưng nội dung và action bên trong phụ thuộc role.
- Nếu chưa có route chi tiết lead hoặc request sửa nhãn, có thể triển khai bằng modal/panel trong route hiện tại trước khi tạo route mới.

### 9.2 Route guard

Route guard cần kiểm tra:

- User đã đăng nhập chưa.
- User có cần đổi mật khẩu không.
- User đã hoàn tất onboarding bắt buộc chưa.
- User có role phù hợp với route không.
- Nếu route có `brand_id`, user có membership hợp lệ không.

Pseudo flow:

```text
request route
-> auth state resolved?
-> must_change_password?
-> onboarding_required?
-> role allowed?
-> brand membership allowed?
-> render page or redirect
```

### 9.3 Sidebar/menu

Sidebar phải được sinh từ permission policy.

Không hard-code cùng một danh sách menu cho mọi vai trò.

Ví dụ trong cấu trúc hiện tại:

- Admin: Dashboard vận hành, hàng chờ review nhãn, phê duyệt tài khoản, crawler health.
- Brand Manager: Dashboard, Mentions, Alerts, Leads, Reports, Brand Settings, Response Settings.
- Crisis Employee: Alerts/Crisis Queue, Mentions liên quan.
- Lead Employee: Leads.

---

## 10. Onboarding architecture

### 10.1 Required fields

User profile cần hỗ trợ:

- `must_change_password`
- `onboarding_completed`
- `onboarding_step`
- `first_login_at`
- `last_login_at`

### 10.2 Onboarding flow

```text
login success
-> resolve user profile
-> if must_change_password = true, redirect change password
-> if onboarding_completed = false, redirect role onboarding
-> redirect role landing page
```

### 10.3 Role-specific guide

| Role | Onboarding focus |
|---|---|
| Admin | Duyệt tài khoản, kiểm duyệt nhãn, xem crawler health |
| Brand Manager | Xác nhận brand, tạo nhân viên, phân quyền, xem request, cấu hình response |
| Crisis Employee | Xem crisis queue, hiểu severity, gửi request sửa nhãn |
| Lead Employee | Xem lead queue, hiểu hot/warm/cold, cập nhật lead status |

### 10.4 Empty state

Empty state là một phần của architecture UX.

Mỗi module cần có:

- Điều kiện không có dữ liệu.
- Thông điệp theo role.
- Next action rõ ràng.
- Link đến guide nếu cần.

---

## 11. Reporting architecture

Report không được đọc dữ liệu raw hoặc nhãn chưa duyệt.

Nguồn dữ liệu hợp lệ cho report:

- Published mentions.
- Active labels đã duyệt.
- Approved relabel history.
- Crisis task status.
- Lead status.
- Response events.
- Audit logs theo phạm vi.

### 11.1 Report by role

| Role | Report scope |
|---|---|
| Admin | Data review volume, AI confidence, label correction rate, crawler health, account approval |
| Brand Manager | Brand health, sentiment trend, negative topics, lead summary, crisis summary, request history, auto-response status |
| Crisis Employee | Negative mentions handled, open crisis tasks, crisis topics, label requests submitted |
| Lead Employee | Leads handled, hot/warm/cold distribution, conversion status, overdue leads |

### 11.2 Report snapshot

Report nên có snapshot để số liệu không thay đổi ngầm sau khi xuất.

`ReportSnapshot` nên lưu:

- `id`
- `brand_id`
- `period_start`
- `period_end`
- `generated_by`
- `generated_at`
- `source_label_version`
- `summary_json`
- `file_url` nếu có export

---

## 12. Auto-response architecture

Auto-response gồm 4 phần:

```text
ResponseTemplate
-> BrandAutoResponseSetting
-> SafetyGate
-> ResponseEvent/AuditLog
```

### 12.1 ResponseTemplate

Template cần được scope theo brand.

Trường chính:

- `id`
- `brand_id`
- `name`
- `sentiment`
- `topic`
- `crisis_level`
- `platform`
- `content`
- `status`
- `created_by`
- `updated_at`

### 12.2 BrandAutoResponseSetting

Mode theo brand:

- `off`
- `suggest_only`
- `auto_safe`
- `manual_review_required`

Mặc định:

- Brand mới: `off`.
- Negative/high/critical: `manual_review_required`.
- Positive/neutral rủi ro thấp: có thể dùng `suggest_only` hoặc `auto_safe` nếu Brand Manager bật.

### 12.3 SafetyGate

SafetyGate kiểm tra trước khi phản hồi:

- Brand có bật auto-response không?
- Template có active không?
- Sentiment/topic/crisis level có nằm trong rule cho phép không?
- Mention có đang trong khủng hoảng high/critical không?
- Có yêu cầu manual review không?
- User/actor có quyền approve không?

### 12.4 Emergency pause

Brand Manager phải có thể pause auto-response ngay.

Khi pause:

- Không gửi response tự động mới.
- Response đang chờ chuyển về manual review hoặc cancelled tùy policy.
- Ghi audit log.

---

## 13. Audit and observability architecture

### 13.1 AuditLog

AuditLog cần lưu:

- `actor_id`
- `actor_role`
- `brand_id`
- `action`
- `entity_type`
- `entity_id`
- `before`
- `after`
- `created_at`
- `request_id` nếu có

### 13.2 Actions cần audit

| Action | Actor |
|---|---|
| Admin approve/reject AI label | Admin |
| Admin sửa nhãn trước publish | Admin |
| Brand Manager duyệt/từ chối request sửa nhãn | Brand Manager |
| Crisis Employee gửi request sửa nhãn | Crisis Employee |
| Brand Manager tạo/sửa/khóa nhân viên | Brand Manager |
| Brand Manager đổi role nhân viên | Brand Manager |
| Brand Manager bật/tắt auto-response | Brand Manager |
| Response event được gửi hoặc bị chặn | System/Brand Manager |
| Lead status thay đổi | Lead Employee |
| Crisis task status thay đổi | Crisis Employee |

### 13.3 Observability

Các metrics cần theo dõi:

- Crawler success/failure rate.
- Số record cào mỗi chu kỳ.
- Số record bị dedup/spam/reject.
- AI confidence distribution.
- Admin review throughput.
- Label correction request rate.
- Auto-response sent/blocked/manual-review count.
- Lead overdue count.
- Crisis unresolved count.

---

## 14. Data access rules

### 14.1 Brand users

Brand users chỉ được query:

- Dữ liệu thuộc `brand_id` trong membership của họ.
- Dữ liệu có trạng thái `published`.
- Module đúng với role.

### 14.2 Admin

Admin được query:

- Dữ liệu đang trong pipeline review.
- Audit/system data.
- User/account approval data.

Admin không được nhận hoặc xử lý brand business tasks như crisis/lead queue.

### 14.3 Crisis Employee

Chỉ được query:

- Published negative/crisis mentions của brand mình.
- Crisis tasks của brand mình.
- Label correction requests do mình tạo hoặc liên quan trong phạm vi cho phép.

Không được query:

- Lead queue.
- Lead detail.
- Auto-response settings.
- User management.

### 14.4 Lead Employee

Chỉ được query:

- Leads của brand mình.
- Mention context liên quan đến lead đó.
- Lead activity của mình/brand mình.

Không được query:

- Crisis queue.
- Crisis task detail.
- Label correction approval.
- Auto-response settings.
- User management.

---

## 15. Migration plan từ baseline hiện tại

### Phase 1 - Role profile và route guard trong cấu trúc hiện tại

- Bổ sung user profile contract.
- Bổ sung role và brand membership contract.
- Cập nhật auth store để giữ `userProfile`, `role`, `memberships`.
- Sinh sidebar theo permission policy.
- Điều hướng sau login theo role nhưng vẫn dùng các route hiện có như `/dashboard`, `/alerts`, `/leads`.

### Phase 2 - API/data guard

- Hoàn thiện auth middleware.
- Hoàn thiện tenant/brand middleware.
- Thêm helper `requireRole`, `requireBrandMembership`, `scopeByBrand`.
- Không để frontend đọc toàn bộ dữ liệu rồi tự lọc cho nghiệp vụ nhạy cảm.
- Mở rộng route/service hiện có thay vì yêu cầu đổi cấu trúc thư mục API.

### Phase 3 - Label lifecycle

- Bổ sung data state.
- Bổ sung Admin review queue.
- Chỉ publish dữ liệu sau Admin review.
- Dashboard/report chỉ đọc published data.

### Phase 4 - Label correction workflow

- Thêm `LabelCorrectionRequest`.
- Crisis Employee tạo request.
- Brand Manager duyệt/từ chối/chỉnh request.
- Cập nhật active label và label history.

### Phase 5 - Role-based dashboard/report

- Giữ route `/dashboard`, tách data widgets theo policy và role.
- Report dùng snapshot và active approved labels.
- Thêm empty state và onboarding theo vai trò.

### Phase 6 - Auto-response safety

- Thêm response templates.
- Thêm brand auto-response setting.
- Thêm safety gate.
- Thêm manual review mode và emergency pause.
- Audit response events.

---

## 16. Architecture acceptance criteria

Kiến trúc Sprint 2 đạt yêu cầu khi:

- User không thể truy cập dữ liệu brand khác bằng UI hoặc API.
- Crisis Employee không thể truy cập lead API hoặc lead route.
- Lead Employee không thể truy cập crisis API hoặc crisis route.
- Admin không có business task queue cho crisis/lead.
- Dữ liệu chưa `published` không xuất hiện trong dashboard/report brand.
- Admin có thể review nhãn trước publish.
- Brand Manager có thể duyệt request sửa nhãn trong brand mình.
- Approved label correction cập nhật active label và report.
- Report không dùng nhãn raw chưa duyệt.
- Auto-response high/critical bị chặn bởi manual review.
- Bật/tắt auto-response được audit.
- Thay đổi role, nhãn, request, lead/crisis status có audit log hoặc event audit-ready.

---

## 17. Rủi ro kiến trúc và khuyến nghị

| Rủi ro | Tác động | Khuyến nghị |
|---|---|---|
| Chỉ ẩn menu ở frontend | User có thể gọi API hoặc đọc dữ liệu ngoài quyền | Enforce ở backend/data access layer |
| Dùng chung dashboard cho mọi role | Người dùng không biết làm gì sau login | Tách landing và widget theo role |
| Dữ liệu AI chưa duyệt đi vào report | Báo cáo sai và mất tin cậy | Chỉ report từ published/approved labels |
| Admin bị lẫn vào nghiệp vụ brand | Sai ownership và sai quy trình vận hành | Tách platform operation khỏi brand operation |
| Auto-response không có safety gate | Rủi ro truyền thông cao | Dùng mode, manual review, emergency pause |
| Không có audit | Không truy vết được quyết định | Audit mọi action quan trọng |

---

## 18. Change Log

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 2.0 | 2026-07-02 | Viết lại kiến trúc mục tiêu Sprint 2 dựa trên SPEC v2: role-based access, brand isolation, label lifecycle, onboarding, reports, audit và auto-response safety. |
