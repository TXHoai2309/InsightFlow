# InsightFlow — Functional Specification

> Phiên bản: 1.1  
> Trạng thái: Cập nhật theo lịch sử commit `main`  
> Mốc tham chiếu: 50 commits trên nhánh `main`, giai đoạn 16/06/2026 → 19/06/2026  
> Phạm vi tài liệu: phản ánh phần **đã có trong repo hiện tại**, không mô tả quá xa như Kafka/Kubernetes/PostgreSQL nếu chưa được triển khai trong commit.

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả phạm vi chức năng hiện tại của InsightFlow theo đúng trình tự phát triển trong commit history:

1. Khởi tạo cấu trúc dự án.
2. Xây dựng giao diện trang chủ.
3. Xây dựng đăng nhập, đăng xuất và session.
4. Xây dựng dashboard.
5. Xây dựng các trang nghiệp vụ: Mentions, Alerts, Reports, Leads, Profile, Settings Brand, Ngành, Về chúng tôi.
6. Kết nối và hiển thị dữ liệu từ Firebase/Firestore.
7. Hiệu chỉnh phân tích AI và sửa lỗi build/deploy.
8. Cập nhật tài liệu theo trạng thái thực tế của repo.

---

## 2. Tổng quan sản phẩm

InsightFlow là nền tảng theo dõi và phân tích thương hiệu, tập trung vào việc hiển thị dữ liệu truyền thông/mention theo cách dễ quan sát cho người dùng.

Ở trạng thái hiện tại, sản phẩm đang ở mức **MVP Web Dashboard**:

- Có giao diện trang chủ giới thiệu sản phẩm.
- Có luồng đăng nhập/đăng xuất cơ bản.
- Có dashboard tổng quan dữ liệu thương hiệu.
- Có các màn hình nghiệp vụ chính phục vụ demo: Mentions, Alerts, Reports, Leads.
- Có kết nối Firebase/Firestore để lấy dữ liệu thật hiển thị lên giao diện.
- Có xử lý hiển thị chỉ số, biểu đồ, bộ lọc và phân tích AI ở mức giao diện/dữ liệu đã chuẩn hóa.

---

## 3. Người dùng & vai trò hiện tại

| Vai trò | Mục đích sử dụng | Trạng thái trong MVP |
|---|---|---|
| Người dùng/Brand User | Truy cập hệ thống, xem dashboard, mentions, alerts, reports | Đang hỗ trợ qua giao diện web |
| Analyst/Marketing | Theo dõi dữ liệu mention, sentiment, nguồn, chủ đề, cảnh báo | Đang hỗ trợ qua các trang dashboard/mentions/alerts |
| Admin hệ thống | Quản lý tenant/user nâng cao | Chưa triển khai đầy đủ trong commit hiện tại |
| Sales/Lead Handler | Xem và xử lý lead | Có route/trang Leads, chưa xác nhận đủ workflow xử lý lead end-to-end |

---

## 4. Phạm vi chức năng theo thứ tự commit

### SP-00 — Khởi tạo dự án và cấu trúc thư mục

**Nguồn commit liên quan:**

- `da6fe71` — first commit
- `9b59a81` — feat: initialize project directory structure and placeholder files
- `9d846cd` — Xóa các file thừa
- `30196a8` — gitignore

**Mô tả:**  
Khởi tạo repo InsightFlow theo mô hình monorepo, có thư mục `apps/web`, `docs`, `services`, `shared`, `scripts`, `infrastructure`, `database`.

**Yêu cầu chức năng:**

- FE chính nằm trong `apps/web`.
- Tài liệu dự án nằm trong `docs`.
- Các service backend/AI/crawler/alert/lead/report được đặt placeholder trong `services` để mở rộng sau.
- Cấu hình workspace/package được chuẩn hóa để chạy bằng npm/turbo.

**Acceptance Criteria:**

- AC-1: Repo có cấu trúc thư mục rõ ràng.
- AC-2: Có file cấu hình npm/turbo cho monorepo.
- AC-3: Có `.gitignore` để tránh commit file thừa.
- AC-4: Có thư mục `docs` chứa tài liệu dự án.

---

### SP-01 — Trang chủ giới thiệu sản phẩm

**Nguồn commit liên quan:**

- `28c7339` — build layout "home"
- `8d1cf63` — fix bug layout "home"
- `6872c0f` — Merge branch 'Tan-home' into minh-login

**Mô tả:**  
Xây dựng trang chủ/landing page của InsightFlow để giới thiệu sản phẩm, định vị nền tảng và dẫn người dùng vào luồng chính.

**Yêu cầu chức năng:**

- Hiển thị thông điệp thương hiệu InsightFlow.
- Có bố cục landing page gồm header, nội dung chính và các section giới thiệu.
- Có responsive layout ở mức cơ bản.
- Header/điều hướng thống nhất với các trang khác.

**Acceptance Criteria:**

- AC-1: Người dùng truy cập `/` thấy trang chủ.
- AC-2: Trang chủ hiển thị đúng nhận diện sản phẩm InsightFlow.
- AC-3: Layout không vỡ trên desktop.
- AC-4: Các lỗi layout đã được sửa theo commit fix.

---

### SP-02 — Đăng nhập, đăng xuất và session

**Nguồn commit liên quan:**

- `ce7cd89` — login, log out
- `c677e96` — đẩy code lên
- `0a1d56c` — Merge pull request #1 from TXHoai2309/minh-login
- `7929856` — đăng suất session
- `b1b3f06` — Merge branch 'TXH' into minh-login
- `8617b75` — Merge branch 'minh-login' into ThuHaTest
- `6f514ac` — Merge pull request #3 from TXHoai2309/minh-login

**Mô tả:**  
Bổ sung nhóm màn hình và logic đăng nhập/đăng xuất để người dùng có thể truy cập hệ thống theo phiên làm việc.

**Yêu cầu chức năng:**

- Có nhóm route `(auth)` cho các màn hình xác thực.
- Người dùng có thể đăng nhập vào hệ thống.
- Người dùng có thể đăng xuất để kết thúc phiên.
- Session được xử lý để tránh trạng thái đăng nhập sai sau khi logout.

**Acceptance Criteria:**

- AC-1: Có màn hình đăng nhập trong nhóm route auth.
- AC-2: Sau khi đăng nhập, người dùng có thể truy cập các trang dashboard/nghiệp vụ.
- AC-3: Sau khi đăng xuất, session không còn được giữ như người dùng đang đăng nhập.
- AC-4: Luồng login/logout không làm vỡ layout trang chủ và dashboard.

---

### SP-03 — Dashboard tổng quan

**Nguồn commit liên quan:**

- `7f2050e` — build giao dien Dashboard
- `f30c3ee` — Merge pull request #2 from TXHoai2309/Tan-dashboard
- `64ae830` — Merge branch 'Tan-dashboard'
- `a3c1cfa` — add data tren trang dashboard
- `ed6c744` — Merge branch 'dashboard'

**Mô tả:**  
Xây dựng dashboard trung tâm để người dùng theo dõi tổng quan dữ liệu brand monitoring.

**Yêu cầu chức năng:**

- Hiển thị tổng số mentions.
- Hiển thị sentiment tích cực/trung lập/tiêu cực.
- Hiển thị xu hướng sentiment theo thời gian.
- Hiển thị top sources.
- Hiển thị top topics.
- Hiển thị hot leads/cảnh báo ở mức tổng quan nếu có dữ liệu.
- Hỗ trợ bộ lọc dashboard theo workspace, thời gian và platform.
- Tính toán lại dữ liệu hiển thị khi filter thay đổi.

**Acceptance Criteria:**

- AC-1: Người dùng truy cập `/dashboard` thấy dashboard tổng quan.
- AC-2: Các card chỉ số không còn dùng dữ liệu tĩnh nếu Firestore đã có dữ liệu.
- AC-3: Biểu đồ sentiment nhận dữ liệu đã lọc.
- AC-4: Top sources và top topics được tính từ dữ liệu mention.
- AC-5: Khi filter thay đổi, số liệu dashboard được cập nhật lại.
- AC-6: Dashboard build không lỗi type liên quan đến filter/topic.

---

### SP-04 — Mentions

**Nguồn commit liên quan:**

- `0df2eff` — build layout Mentions
- `7ad391a` — update layout Mentions
- `f0ca5f3` — đẩy dữ liệu lên mention
- `73b9030` — Merge branch 'minh-mention' into dashboard

**Mô tả:**  
Xây dựng trang danh sách mention để người dùng xem các nội dung được hệ thống thu thập/phân tích.

**Yêu cầu chức năng:**

- Có route `/mentions`.
- Hiển thị danh sách mention.
- Mỗi mention cần có các thông tin chính: nội dung, nguồn/platform, thời gian, sentiment, topic/AI analysis nếu có.
- Có trạng thái dữ liệu lấy từ Firestore thay vì chỉ layout tĩnh.
- Layout được cập nhật để phù hợp với dashboard.

**Acceptance Criteria:**

- AC-1: Người dùng mở `/mentions` thấy danh sách mention.
- AC-2: Mention hiển thị dữ liệu thật khi Firestore có dữ liệu.
- AC-3: Mention có thông tin sentiment/topic phục vụ phân tích.
- AC-4: Giao diện Mentions đồng bộ với layout chung.

---

### SP-05 — Alerts

**Nguồn commit liên quan:**

- `0d4a0dd` — add layout function button
- `26f4bc8` — build layout Alerts

**Mô tả:**  
Xây dựng trang Alerts để hiển thị các cảnh báo truyền thông/rủi ro cần người dùng chú ý.

**Yêu cầu chức năng:**

- Có route `/alerts`.
- Hiển thị danh sách cảnh báo.
- Có layout thẻ/bảng giúp phân biệt mức độ cảnh báo.
- Có các nút chức năng phục vụ thao tác trên giao diện.

**Acceptance Criteria:**

- AC-1: Người dùng truy cập `/alerts` thấy trang cảnh báo.
- AC-2: Alert có thông tin mô tả, mức độ và thời gian nếu dữ liệu có sẵn.
- AC-3: Giao diện Alerts không bị lệch so với layout dashboard.

---

### SP-06 — Reports

**Nguồn commit liên quan:**

- `a6eda63` — report
- `93fdd0c` — done

**Mô tả:**  
Xây dựng trang Reports để người dùng xem/tổng hợp báo cáo từ dữ liệu theo dõi thương hiệu.

**Yêu cầu chức năng:**

- Có route `/reports`.
- Có giao diện danh sách hoặc khối báo cáo.
- Báo cáo thể hiện các chỉ số tổng hợp phục vụ demo.

**Acceptance Criteria:**

- AC-1: Người dùng mở `/reports` thấy giao diện báo cáo.
- AC-2: Báo cáo có bố cục rõ ràng, dễ đọc.
- AC-3: Reports dùng cùng hệ thống layout với các trang nghiệp vụ khác.

---

### SP-07 — Leads, Profile, Settings Brand, Ngành, Về chúng tôi

**Nguồn commit liên quan:**

- `7c57634` — hoàn thiện
- `6471528` — a
- `12786e9` — merge code cuar Tan
- `679d2be` — responsive
- `99095b2` — update information

**Mô tả:**  
Bổ sung và hoàn thiện các route/phần giao diện phụ để sản phẩm có đủ khung demo.

**Yêu cầu chức năng:**

- Có route `/leads` để hiển thị lead.
- Có route `/profile` để hiển thị thông tin người dùng.
- Có route `/settings/brand` để quản lý/cấu hình thương hiệu ở mức giao diện.
- Có route `/nganh` để giới thiệu/nhóm ngành.
- Có route `/ve-chung-toi` để giới thiệu đội ngũ/sản phẩm.
- Giao diện responsive tốt hơn sau commit `responsive`.

**Acceptance Criteria:**

- AC-1: Các route chính không trả lỗi 404.
- AC-2: Layout các trang đồng bộ header/sidebar/footer nếu có.
- AC-3: Trang hiển thị tốt hơn trên nhiều kích thước màn hình sau commit responsive.

---

### SP-08 — Firebase/Firestore Data Foundation

**Nguồn commit liên quan:**

- `a3c1cfa` — add data tren trang dashboard
- `f0ca5f3` — đẩy dữ liệu lên mention
- `1259ca0` — Sửa lỗi marketting không có trong union type topic, poster_at bị thiếu trong 8 mack object
- `59a5dfb` — Hoài sửa lỗi vercel

**Mô tả:**  
Chuẩn hóa việc lấy và hiển thị dữ liệu từ Firebase/Firestore cho dashboard và mentions.

**Yêu cầu chức năng:**

- Cấu hình Firebase client trong app web.
- Lấy dữ liệu mention/dashboard từ Firestore.
- Có service/hook/store để đưa dữ liệu vào UI.
- Dữ liệu mention cần có field thời gian `posted_at` hoặc trường tương đương để chart và list hoạt động ổn định.
- Topic phải nằm trong union type đã định nghĩa để tránh lỗi build TypeScript.

**Acceptance Criteria:**

- AC-1: Dữ liệu Firestore hiển thị được trên dashboard.
- AC-2: Dữ liệu Firestore hiển thị được trên mentions.
- AC-3: Không lỗi build do thiếu `posted_at`.
- AC-4: Không lỗi build do topic ngoài union type.
- AC-5: Vercel build được sau khi sửa lỗi type/config.

---

### SP-09 — Hiệu chỉnh phân tích AI

**Nguồn commit liên quan:**

- `d829027` — Hiệu chỉnh phân tích AI

**Mô tả:**  
Cập nhật phần hiển thị/logic liên quan đến phân tích AI để dashboard và mention phản ánh dữ liệu phân tích rõ hơn.

**Yêu cầu chức năng:**

- Hiển thị kết quả phân tích AI gắn với dữ liệu mention.
- Phân tích có thể bao gồm sentiment, topic, insight hoặc nhãn hỗ trợ dashboard.
- Dữ liệu phân tích cần phù hợp với type đang dùng ở frontend.

**Acceptance Criteria:**

- AC-1: UI không hiển thị sai field phân tích AI.
- AC-2: Các chỉ số/chủ đề dùng cho dashboard tính toán được từ dữ liệu hiện có.
- AC-3: Không phát sinh lỗi type khi build.

---

### SP-10 — Sửa lỗi, merge nhánh và ổn định bản demo

**Nguồn commit liên quan:**

- `80f347f` — fix xung dot
- `820fade` — fix
- `7b37080` — fix
- `863ddb2` — fix
- `91ebd85` — Delete file html giao diện mẫu
- `94f27fa` — Merge branch 'ThuHaTest'
- `624edd0` — Merge branch 'main' into ha-information
- `b577dbc` — Merge branch 'ha-information'

**Mô tả:**  
Giai đoạn ổn định repo, xử lý xung đột, xóa file demo không cần thiết, merge các nhánh chức năng vào `main`.

**Acceptance Criteria:**

- AC-1: Repo không còn file HTML mẫu không dùng.
- AC-2: Các nhánh dashboard/login/mention/information được merge vào `main`.
- AC-3: Không còn lỗi build rõ ràng do xung đột code hoặc type thiếu.
- AC-4: Tài liệu phản ánh đúng hiện trạng code.

---

## 5. Luồng nghiệp vụ hiện tại

### 5.1 Luồng xem dữ liệu dashboard

```text
Người dùng đăng nhập
→ Mở Dashboard
→ App đọc dữ liệu Firestore qua Firebase client/service
→ Store/hook nhận dữ liệu mentions, alerts, leads, workspaces
→ Dashboard tính toán stats, top sources, top topics, sentiment trend
→ Người dùng đổi filter
→ UI tính toán lại dữ liệu đã lọc
```

### 5.2 Luồng xem mentions

```text
Người dùng mở Mentions
→ App lấy danh sách mention từ Firestore/dữ liệu đã chuẩn hóa
→ Hiển thị nội dung, platform, thời gian, sentiment/topic
→ Người dùng quan sát dữ liệu phục vụ phân tích thương hiệu
```

### 5.3 Luồng cảnh báo/báo cáo ở MVP

```text
Dữ liệu cảnh báo/báo cáo có sẵn hoặc được mock/chuẩn hóa
→ UI Alerts/Reports hiển thị theo layout
→ Dashboard có thể tổng hợp một phần chỉ số nếu dữ liệu liên quan tồn tại
```

---

## 6. API/Data Contract ở trạng thái hiện tại

Hiện repo web ưu tiên dùng Firebase/Firestore ở frontend. Các endpoint REST backend chưa phải phần được xác nhận hoàn chỉnh trong commit hiện tại.

### 6.1 Entity: Mention

Các field nên có để FE hoạt động ổn định:

| Field | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| `id` | string | ID document/mention |
| `content` hoặc `text` | string | Nội dung mention |
| `platform` | string | Nguồn: facebook/tiktok/news/youtube/threads hoặc nguồn tương đương |
| `source` | string | Tên nguồn/trang/tài khoản |
| `sentiment` | `positive` / `neutral` / `negative` | Dùng cho chart và filter |
| `topic` | union type hợp lệ | Không dùng topic ngoài type để tránh lỗi build |
| `posted_at` | string/date/timestamp | Bắt buộc để trend theo thời gian ổn định |
| `created_at` | string/date/timestamp | Thời điểm dữ liệu vào hệ thống |
| `ai_summary` | string | Tùy chọn, phục vụ phân tích AI |

### 6.2 Entity: DashboardStats

| Field | Ý nghĩa |
|---|---|
| `total_mentions` | Tổng lượt nhắc đến |
| `positive_count` | Số mention tích cực |
| `neutral_count` | Số mention trung lập |
| `negative_count` | Số mention tiêu cực |
| `net_sentiment` | Điểm sentiment tổng hợp |
| `hot_leads_today` | Số hot leads trong ngày nếu có dữ liệu |
| `alerts_count` | Số cảnh báo nếu có dữ liệu |

---

## 7. Quy tắc nghiệp vụ hiện tại

| BR | Quy tắc |
|---|---|
| BR-01 | Dữ liệu hiển thị trên dashboard phải ưu tiên lấy từ Firestore thay vì hard-code. |
| BR-02 | Mọi mention dùng cho biểu đồ thời gian phải có `posted_at` hoặc field ngày tương đương. |
| BR-03 | Topic phải nằm trong danh sách type hợp lệ ở frontend. |
| BR-04 | Filter dashboard không được làm sai tổng số liệu đã hiển thị. |
| BR-05 | Các trang nghiệp vụ dùng layout thống nhất để demo liền mạch. |
| BR-06 | File tài liệu không mô tả các service chưa triển khai như chức năng đã hoàn thành. |

---

## 8. Ngoài phạm vi MVP hiện tại

Các phần dưới đây là định hướng phát triển sau, chưa nên ghi như chức năng đã hoàn thành trong SPEC hiện tại:

- Kafka event streaming.
- PostgreSQL/Elasticsearch production data layer.
- Kubernetes deployment.
- NLP service train/fine-tune độc lập.
- Crawler đa nền tảng chạy real-time hoàn chỉnh.
- Alert push qua Telegram/Zalo/Email end-to-end.
- Export PDF/Excel production.
- Multi-tenant RBAC hoàn chỉnh.
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

## 9. Tiêu chí nghiệm thu tổng cho bản hiện tại

- Trang chủ, login/logout, dashboard, mentions, alerts, reports, leads và các trang phụ truy cập được.
- Dashboard đọc được dữ liệu Firestore và tính toán chỉ số cơ bản.
- Mentions hiển thị dữ liệu từ Firestore.
- Không lỗi build do thiếu field `poster_at/posted_at` hoặc topic ngoài union type.
- Changelog, spec và architecture phản ánh đúng thứ tự commit từ khởi tạo → UI → auth → dashboard → mentions → AI/data → fix/merge.
## 10. Corrections 2026-06-29

Các ghi chú dưới đây cập nhật phạm vi chức năng theo trạng thái repo hiện tại và được ưu tiên hơn các mô tả cũ nếu có chênh lệch:

### 10.1 Mentions

- Module `mentions` hiện gồm hai màn hình chính:
  - `/mentions`: danh sách đề cập
  - `/mentions/[id]`: trang chi tiết đề cập
- Trang chi tiết đề cập hiện hỗ trợ:
  - hiển thị bài viết gốc, metadata, sentiment summary và độ tin cậy AI
  - bộ lọc bình luận theo sắc thái, cấp bình luận và từ khóa
  - cảnh báo khi comment mục tiêu bị ẩn bởi filter
  - nút quay về đầu trang
  - panel thông tin bên phải đã được nén gọn để dễ xem đủ chỉ số hơn

### 10.2 Platform logo behavior

- Logo nền tảng đã được chuẩn hóa qua shared component `PlatformLogo`.
- `TikTok` và `Threads` dùng màu đen ở giao diện sáng và tự đổi sang màu trắng ở giao diện tối theo theme token của ứng dụng.

### 10.3 Settings Brand route note

- Route `/settings/brand` vẫn tồn tại trong app shell hiện tại.
- Các mô tả cũ về `Settings Brand` trong tài liệu này tiếp tục có hiệu lực cho phạm vi frontend hiện có.
