# InsightFlow - Đặc tả chức năng sản phẩm

> Phiên bản: 2.0  
> Trạng thái: Bản nháp đặc tả Sprint 2  
> Ngày cập nhật: 2026-07-02  
> Phạm vi: Phân quyền theo nghiệp vụ, luồng gán nhãn, onboarding, báo cáo và auto-response  
> Đối tượng sử dụng tài liệu: Product Owner, đội phát triển, QA, UI/UX và reviewer

---

## 1. Mục đích tài liệu

Tài liệu này đặc tả hành vi sản phẩm InsightFlow trong Sprint 2.

Mục tiêu quan trọng nhất là làm rõ logic nghiệp vụ:

- Ai sử dụng hệ thống.
- Mỗi vai trò cần đạt mục tiêu gì.
- Mỗi vai trò được xem và thao tác những gì.
- Người dùng phải làm gì sau khi đăng nhập.
- Dữ liệu từ lúc được cào đến khi hiển thị cho thương hiệu đi qua các trạng thái nào.
- Nhãn dữ liệu được AI gán, Admin kiểm duyệt, thương hiệu kiểm tra lại và sửa như thế nào.
- Báo cáo tích cực, tiêu cực, khủng hoảng và lead phải hiển thị theo nhu cầu từng vai trò ra sao.
- Onboarding và user guide giúp người dùng biết bước tiếp theo như thế nào.

Tài liệu này là nguồn tham chiếu nghiệp vụ chính cho Sprint 2. Khi thay đổi vai trò, quyền hạn, workflow, trạng thái dữ liệu hoặc acceptance criteria, tài liệu cần được cập nhật trước hoặc cùng lúc với implementation.

---

## 2. Tổng quan sản phẩm

InsightFlow là nền tảng hỗ trợ thương hiệu theo dõi, phân tích và xử lý dữ liệu truyền thông công khai bằng AI.

InsightFlow không chỉ là dashboard hiển thị số liệu. Sản phẩm phải giúp đội ngũ thương hiệu biết:

- Vấn đề nào đang xảy ra.
- Vấn đề đó nghiêm trọng đến đâu.
- Ai là người chịu trách nhiệm xử lý.
- Dữ liệu đã đủ tin cậy để dùng cho báo cáo hay chưa.
- Khi AI gán nhãn sai thì sửa và ghi nhận lịch sử như thế nào.
- Khi nào có thể phản hồi tự động, khi nào bắt buộc con người duyệt.

Luồng giá trị tổng quát:

```text
Cào dữ liệu công khai
-> tiền xử lý dữ liệu
-> AI gán nhãn
-> Admin kiểm duyệt nhãn đầu vào
-> publish dữ liệu cho thương hiệu
-> người dùng theo vai trò xử lý nghiệp vụ
-> báo cáo sức khỏe thương hiệu và kết quả vận hành
```

### 2.1 Bài toán cần giải quyết

Các thương hiệu thường gặp các vấn đề sau:

- Không biết sau khi đăng nhập hệ thống cần làm gì tiếp theo.
- Không phân biệt rõ ai xử lý khủng hoảng, ai xử lý khách hàng tiềm năng, ai duyệt dữ liệu.
- Số liệu tích cực, tiêu cực chỉ là biểu đồ chung, chưa trả lời được vai trò đó cần quyết định điều gì.
- Dữ liệu mention phân tán ở nhiều nguồn và khó ưu tiên.
- AI có thể gán sai nhãn sentiment, topic, mức độ khủng hoảng hoặc lead intent.
- Thiếu workflow gửi request, duyệt request và ghi lịch sử chỉnh sửa nhãn.
- Auto-response có rủi ro truyền thông nếu không có cấu hình bật/tắt và cơ chế an toàn.

### 2.2 Mục tiêu sản phẩm trong Sprint 2

Trong Sprint 2, InsightFlow cần chuyển từ MVP dashboard sang hệ thống vận hành theo vai trò:

- Admin vận hành nền tảng và dữ liệu tin cậy.
- Quản lý thương hiệu vận hành toàn bộ nghiệp vụ của một brand cụ thể.
- Nhân viên xử lý khủng hoảng chỉ xử lý nghiệp vụ khủng hoảng của brand mình, không xử lý lead.
- Nhân viên xử lý khách hàng tiềm năng chỉ xử lý lead của brand mình, không xử lý khủng hoảng.
- Người dùng sau khi đăng nhập được điều hướng đến đúng màn hình và đúng công việc.
- Báo cáo và dashboard phải trả lời câu hỏi nghiệp vụ của từng vai trò.

---

## 3. Phạm vi Sprint 2

### 3.1 Must Have

- Phân quyền theo vai trò nghiệp vụ.
- Điều hướng sau đăng nhập theo vai trò.
- Onboarding hoặc user guide theo vai trò.
- Luồng cào dữ liệu định kỳ 1-2 tiếng/lần ở mức đặc tả nghiệp vụ.
- Luồng tiền xử lý dữ liệu.
- Luồng AI gán nhãn sentiment, topic, crisis level và lead intent.
- Luồng Admin kiểm duyệt nhãn trước khi dữ liệu được publish.
- Luồng nhân viên khủng hoảng gửi request sửa nhãn.
- Luồng Quản lý thương hiệu duyệt, từ chối hoặc chỉnh lại request sửa nhãn.
- Báo cáo và dashboard theo nhu cầu từng vai trò.
- Template phản hồi và cấu hình bật/tắt auto-response.

### 3.2 Should Have

- Audit log cho thay đổi nhãn, thay đổi quyền, bật/tắt auto-response và các thao tác quan trọng.
- Empty state có hướng dẫn hành động tiếp theo.
- Thông báo ưu tiên theo vai trò.
- Lịch sử duyệt request sửa nhãn.

### 3.3 Could Have

- Hàng chờ review nâng cao theo AI confidence.
- Gợi ý phản hồi theo ngữ cảnh.
- Chỉ số SLA xử lý khủng hoảng và lead.

### 3.4 Ngoài phạm vi Sprint 2

- Admin trực tiếp xử lý khủng hoảng thay thương hiệu.
- Admin trực tiếp chăm sóc lead thay thương hiệu.
- Admin quyết định chiến lược phản hồi truyền thông của thương hiệu.
- Auto-response tự động phản hồi mọi tình huống mà không có cấu hình an toàn.
- Cào dữ liệu tin nhắn riêng tư, group kín hoặc dữ liệu không công khai.

---

## 4. Vai trò người dùng

Quy tắc nền tảng:

**Admin không tham gia nhiệm vụ nghiệp vụ thương hiệu. Admin vận hành hệ thống, tài khoản cấp cao và chất lượng dữ liệu đầu vào. Nghiệp vụ thương hiệu thuộc Quản lý thương hiệu và nhân viên của thương hiệu đó.**

### 4.1 Admin

Admin là vai trò vận hành nền tảng và kiểm soát độ tin cậy dữ liệu.

Admin được phép:

- Quản lý người dùng cấp hệ thống.
- Phê duyệt tài khoản Quản lý thương hiệu.
- Xem dữ liệu cào và dữ liệu AI đã gán nhãn trước khi publish.
- Kiểm duyệt nhãn do AI gán.
- Chỉnh nhãn ở bước kiểm duyệt đầu vào.
- Approve hoặc reject dữ liệu trước khi đưa lên hệ thống cho thương hiệu.
- Theo dõi chất lượng gán nhãn, tỷ lệ nhãn bị sửa, trạng thái crawler.

Admin không được xem là người xử lý nghiệp vụ thương hiệu:

- Không xử lý khủng hoảng thay brand.
- Không xử lý khách hàng tiềm năng thay brand.
- Không duyệt phản hồi truyền thông thay brand theo nghĩa nghiệp vụ.
- Không quyết định brand nên phản hồi khách hàng thế nào.
- Không quản lý phân công nhân viên nội bộ của brand, trừ trường hợp hỗ trợ kỹ thuật hoặc vận hành nền tảng.

Admin quan tâm đến:

- Dữ liệu nào đang chờ kiểm duyệt.
- Tài khoản Quản lý thương hiệu nào đang chờ phê duyệt.
- Nguồn cào nào đang lỗi.
- Model gán nhãn có ổn định không.
- Có bao nhiêu nhãn bị sửa trước khi publish.

### 4.2 Quản lý thương hiệu

Quản lý thương hiệu là người chịu trách nhiệm nghiệp vụ cho một brand cụ thể.

Quản lý thương hiệu được phép:

- Sử dụng toàn bộ chức năng trong phạm vi brand mình quản lý.
- Xem dashboard, mentions, alerts, leads, reports và cấu hình brand.
- Kiểm tra lại nhãn của dữ liệu đã publish.
- Tạo và quản lý tài khoản nhân viên thuộc brand.
- Phân quyền nhân viên thành nhân viên xử lý khủng hoảng hoặc nhân viên xử lý khách hàng tiềm năng.
- Duyệt, từ chối hoặc chỉnh lại request sửa nhãn từ nhân viên.
- Tạo và quản lý template phản hồi.
- Bật hoặc tắt auto-response cho brand.
- Theo dõi hiệu quả xử lý khủng hoảng và lead.

Quản lý thương hiệu không được:

- Truy cập dữ liệu brand khác nếu không được gán quyền.
- Phê duyệt tài khoản Quản lý thương hiệu khác.
- Kiểm duyệt dữ liệu AI đầu vào ở phạm vi toàn hệ thống như Admin.

Quản lý thương hiệu quan tâm đến:

- Sức khỏe thương hiệu.
- Xu hướng tiêu cực và tích cực.
- Chủ đề tiêu cực nổi bật.
- Request sửa nhãn đang chờ duyệt.
- Khủng hoảng nào chưa xử lý.
- Lead nào đang cần chăm sóc.
- Auto-response có đang an toàn không.

### 4.3 Nhân viên xử lý khủng hoảng

Nhân viên xử lý khủng hoảng chỉ xử lý nghiệp vụ khủng hoảng trong phạm vi brand được phân công.

Được phép:

- Xem dashboard liên quan đến khủng hoảng của brand mình.
- Xem mentions tiêu cực, cảnh báo, chủ đề rủi ro và mức độ khủng hoảng.
- Xem chi tiết mention cần xử lý.
- Cập nhật trạng thái xử lý trong phạm vi được cho phép.
- Gửi request sửa nhãn nếu phát hiện sentiment, topic hoặc crisis level bị sai.

Không được phép:

- Xem lead queue.
- Xử lý lead.
- Quản lý tài khoản người dùng.
- Duyệt request sửa nhãn.
- Cấu hình auto-response.
- Truy cập dữ liệu brand khác.

Nhân viên xử lý khủng hoảng quan tâm đến:

- Mention tiêu cực nào cần xử lý trước.
- Cảnh báo nào nghiêm trọng nhất.
- Nhãn nào có thể đang sai.
- Việc nào đang được giao cho mình.
- Cần gửi request sửa nhãn hay cần xử lý/escalate.

### 4.4 Nhân viên xử lý khách hàng tiềm năng

Nhân viên xử lý khách hàng tiềm năng chỉ xử lý lead trong phạm vi brand được phân công.

Được phép:

- Xem dashboard liên quan đến lead của brand mình.
- Xem hot lead, warm lead, cold lead.
- Xem nội dung mention tạo ra lead.
- Cập nhật trạng thái chăm sóc lead.
- Ghi chú quá trình liên hệ.
- Theo dõi lead sắp quá hạn.

Không được phép:

- Xem crisis queue.
- Xử lý cảnh báo khủng hoảng.
- Quản lý tài khoản người dùng.
- Duyệt request sửa nhãn.
- Cấu hình auto-response.
- Truy cập dữ liệu brand khác.

Nhân viên xử lý khách hàng tiềm năng quan tâm đến:

- Lead nào nóng nhất.
- Lead nào sắp quá hạn.
- Khách hàng đang có tín hiệu mua gì.
- Lead đến từ nguồn nào.
- Mình cần cập nhật trạng thái xử lý ra sao.

---

## 5. Điều hướng sau đăng nhập

Người dùng không được rơi vào một dashboard chung chung sau khi đăng nhập.

| Vai trò | Màn hình mặc định sau đăng nhập | Câu hỏi cần trả lời |
|---|---|---|
| Admin | Dashboard vận hành dữ liệu và tài khoản | Dữ liệu/tài khoản nào cần kiểm duyệt ngay? |
| Quản lý thương hiệu | Dashboard sức khỏe brand và request chờ duyệt | Brand của tôi đang có vấn đề gì và tôi cần duyệt gì? |
| Nhân viên khủng hoảng | Crisis queue | Vấn đề tiêu cực nào cần xử lý trước? |
| Nhân viên lead | Lead queue | Lead nào cần chăm sóc trước? |

Yêu cầu:

- Sidebar/menu phải thay đổi theo quyền.
- Route không thuộc quyền phải bị chặn.
- Empty state phải hướng dẫn hành động tiếp theo.
- Nếu là lần đăng nhập đầu tiên, hiển thị onboarding theo vai trò trước khi vào luồng chính.

---

## 6. Ma trận phân quyền

Chú thích:

- `Xem`: được xem dữ liệu.
- `Tạo`: được tạo dữ liệu.
- `Sửa`: được cập nhật dữ liệu.
- `Duyệt`: được approve/reject.
- `Không`: không có quyền.

| Module | Admin | Quản lý thương hiệu | NV khủng hoảng | NV lead |
|---|---|---|---|---|
| Quản lý user cấp hệ thống | Xem/Tạo/Sửa | Không | Không | Không |
| Phê duyệt tài khoản Quản lý thương hiệu | Xem/Duyệt | Không | Không | Không |
| Quản lý nhân viên brand | Không mặc định | Xem/Tạo/Sửa trong brand | Không | Không |
| Phân quyền nhân viên brand | Không mặc định | Sửa trong brand | Không | Không |
| Cấu hình brand | Xem metadata hệ thống | Xem/Sửa brand mình | Không | Không |
| Dữ liệu cào thô | Xem để kiểm duyệt | Không mặc định | Không | Không |
| Kiểm duyệt nhãn trước publish | Xem/Sửa/Duyệt | Không | Không | Không |
| Mentions đã publish | Xem audit/hỗ trợ | Xem brand mình | Xem phần khủng hoảng brand mình | Xem khi gắn với lead brand mình |
| Request sửa nhãn | Xem audit | Xem/Duyệt brand mình | Tạo brand mình | Không mặc định |
| Alerts/khủng hoảng | Không theo nghiệp vụ | Xem brand mình | Xem/Sửa phần được giao | Không |
| Lead queue | Không theo nghiệp vụ | Xem brand mình | Không | Xem/Sửa phần được giao |
| Reports | Xem báo cáo vận hành hệ thống | Xem/Xuất brand mình | Xem phần khủng hoảng liên quan | Xem phần lead liên quan |
| Response templates | Không theo nghiệp vụ | Xem/Tạo/Sửa brand mình | Xem gợi ý nếu được cho phép | Không mặc định |
| Bật/tắt auto-response | Không theo nghiệp vụ | Bật/Tắt brand mình | Không | Không |
| Audit logs | Xem toàn hệ thống | Xem brand mình | Xem thao tác của mình | Xem thao tác của mình |

Quy tắc quan trọng:

Admin được kiểm duyệt và chỉnh nhãn trước publish vì đây là quản trị chất lượng dữ liệu. Admin không xử lý khủng hoảng, không xử lý lead và không quyết định phản hồi truyền thông thay thương hiệu.

---

## 7. Luồng gán nhãn và publish dữ liệu

Luồng gán nhãn là nghiệp vụ trọng tâm của Sprint 2.

### 7.1 Luồng tổng quát

```text
Crawler chạy định kỳ 1-2 tiếng/lần
-> thu thập dữ liệu mới
-> tiền xử lý dữ liệu
-> loại bỏ spam, trùng lặp, dữ liệu lỗi
-> model AI gán nhãn
-> Admin kiểm duyệt nhãn
-> Admin approve dữ liệu đủ tin cậy
-> hệ thống publish dữ liệu cho brand
-> nhân viên xử lý nghiệp vụ theo quyền
-> nhân viên khủng hoảng gửi request nếu thấy nhãn sai
-> Quản lý thương hiệu kiểm duyệt request và gán nhãn lại nếu cần
-> hệ thống cập nhật nhãn và ghi audit log
```

### 7.2 Trạng thái dữ liệu

| Trạng thái | Ý nghĩa | Ai thấy |
|---|---|---|
| `raw_collected` | Dữ liệu mới được cào, chưa xử lý | Admin/hệ thống |
| `preprocessed` | Dữ liệu đã chuẩn hóa, lọc lỗi cơ bản | Admin/hệ thống |
| `ai_labeled` | AI đã gán nhãn | Admin/hệ thống |
| `admin_reviewing` | Đang chờ Admin kiểm duyệt | Admin |
| `approved_for_publish` | Admin đã duyệt, sẵn sàng publish | Admin/hệ thống |
| `published` | Đã hiển thị cho brand theo quyền | Người dùng brand có quyền |
| `correction_requested` | Có request sửa nhãn từ nhân viên | Quản lý thương hiệu, người gửi, audit |
| `brand_relabel_approved` | Quản lý thương hiệu đã duyệt sửa nhãn | Brand liên quan, audit |
| `brand_relabel_rejected` | Quản lý thương hiệu từ chối sửa nhãn | Brand liên quan, audit |
| `archived` | Dữ liệu lưu trữ, không còn active | Vai trò có quyền audit |

### 7.3 Các loại nhãn

| Nhãn | Giá trị | Mục đích |
|---|---|---|
| Sentiment | positive, neutral, negative | Đánh giá sức khỏe thương hiệu |
| Topic | quality, price, service, staff, delivery, experience, legal, operation, marketing, competitor, other | Tìm nguyên nhân và nhóm vấn đề |
| Crisis level | none, low, medium, high, critical | Ưu tiên xử lý khủng hoảng |
| Lead intent | none, cold, warm, hot | Phân loại khách hàng tiềm năng |
| Spam flag | true, false | Loại dữ liệu rác |
| Relevance | relevant, irrelevant, uncertain | Xác định có liên quan brand hay không |

### 7.4 Admin kiểm duyệt nhãn

Admin kiểm duyệt nhãn do AI gán trước khi dữ liệu được publish.

Admin có thể:

- Xem nội dung gốc.
- Xem nội dung đã tiền xử lý.
- Xem nhãn AI đề xuất.
- Xem confidence của model.
- Chỉnh sentiment, topic, crisis level, lead intent, spam flag hoặc relevance.
- Approve từng record.
- Bulk approve khi confidence và rule cho phép.
- Reject record không hợp lệ.

Kết quả:

- Record được approve mới có thể publish.
- Record bị reject không hiển thị cho người dùng brand.
- Mọi chỉnh sửa nhãn của Admin phải có audit log.

### 7.5 Request sửa nhãn từ phía thương hiệu

Sau khi dữ liệu đã publish, nhân viên xử lý khủng hoảng có thể phát hiện nhãn sai.

Ví dụ:

- Mention tiêu cực nhưng bị gán neutral.
- Vấn đề dịch vụ nhưng bị gán topic marketing.
- Mention nghiêm trọng nhưng crisis level thấp.
- Câu khen mỉa mai bị AI hiểu thành tích cực.

Nhân viên xử lý khủng hoảng có thể gửi request sửa nhãn cho Quản lý thương hiệu.

Request cần có:

- Mention ID.
- Nhãn hiện tại.
- Nhãn đề xuất.
- Lý do đề xuất sửa.
- Ghi chú hoặc bằng chứng bổ sung nếu có.
- Người gửi request.
- Thời điểm gửi.

Quản lý thương hiệu có thể:

- Duyệt request.
- Từ chối request.
- Chỉnh lại nhãn đề xuất trước khi duyệt.
- Yêu cầu bổ sung thông tin.

Khi request được duyệt:

- Nhãn active được cập nhật.
- Dashboard và report dùng nhãn mới nhất đã được duyệt.
- Lịch sử thay đổi được ghi lại.

---

## 8. Các luồng nghiệp vụ chính

### 8.1 Tài khoản cấp sẵn và đăng nhập lần đầu

Luồng:

```text
Admin phê duyệt/tạo tài khoản Quản lý thương hiệu
-> Quản lý thương hiệu nhận tài khoản tạm thời
-> đăng nhập lần đầu
-> hệ thống bắt buộc đổi mật khẩu
-> hệ thống hiển thị onboarding theo vai trò
-> Quản lý thương hiệu tạo tài khoản nhân viên
-> nhân viên đăng nhập bằng tài khoản tạm thời
-> nhân viên bắt buộc đổi mật khẩu
-> nhân viên thấy onboarding theo vai trò được phân công
```

Yêu cầu:

- Người dùng có mật khẩu tạm thời phải đổi mật khẩu trước khi sử dụng hệ thống.
- Onboarding lần đầu phải hiển thị đúng vai trò.
- Người dùng chỉ thấy menu và route thuộc quyền.

### 8.2 Quản lý nhân viên của brand

Quản lý thương hiệu có thể:

- Tạo tài khoản nhân viên thuộc brand.
- Phân quyền nhân viên là `crisis_employee` hoặc `lead_employee`.
- Khóa hoặc mở khóa tài khoản nhân viên.
- Cập nhật thông tin hiển thị của nhân viên.
- Đổi vai trò nhân viên khi cần.

Không được:

- Quản lý nhân viên của brand khác.
- Tự phê duyệt tài khoản Quản lý thương hiệu khác.
- Truy cập chức năng Admin của nền tảng.

### 8.3 Xử lý khủng hoảng

Luồng:

```text
Mention tiêu cực hoặc alert khủng hoảng được publish
-> nhân viên khủng hoảng thấy item trong crisis queue
-> mở chi tiết để xem ngữ cảnh
-> xử lý hoặc escalate theo quy trình brand
-> nếu phát hiện nhãn sai, gửi request sửa nhãn
-> Quản lý thương hiệu duyệt request
-> hệ thống cập nhật nhãn nếu được duyệt
```

Crisis queue ưu tiên theo:

- Mức độ critical/high.
- Mention mới nhất.
- Nguồn có reach cao.
- Tín hiệu tăng đột biến.
- Item được gán cho nhân viên hiện tại.

### 8.4 Xử lý khách hàng tiềm năng

Luồng:

```text
Mention đã publish có lead intent
-> hệ thống tạo hoặc hiển thị lead trong lead queue
-> nhân viên lead thấy mức độ hot/warm/cold
-> nhân viên xử lý lead được giao
-> cập nhật trạng thái và ghi chú
-> Quản lý thương hiệu theo dõi tiến độ
```

Trạng thái lead:

- `new`
- `assigned`
- `contacting`
- `converted`
- `lost`
- `skipped`
- `expired`

Lead queue ưu tiên theo:

- Hot lead.
- Lead sắp quá hạn.
- Lead có tín hiệu mua rõ.
- Lead được gán cho nhân viên hiện tại.

### 8.5 Auto-response và template phản hồi

InsightFlow hỗ trợ template phản hồi và cấu hình bật/tắt phản hồi tự động.

Quản lý thương hiệu có thể:

- Tạo template phản hồi.
- Chỉnh sửa template.
- Gán template theo sentiment, topic, crisis level, platform hoặc tình huống.
- Bật hoặc tắt auto-response cho brand.
- Tạm dừng auto-response khi có sự kiện nhạy cảm.

Quy tắc an toàn:

- Auto-response mặc định tắt với brand mới.
- Quản lý thương hiệu phải chủ động bật.
- Tình huống khủng hoảng high/critical phải yêu cầu duyệt thủ công trước khi phản hồi công khai.
- Template cho nội dung tiêu cực cần được kiểm soát chặt.
- Mọi hành động phản hồi tự động phải có log.
- Hệ thống phải cho phép tắt hoặc pause ngay lập tức.

Trạng thái template:

- `draft`
- `active`
- `paused`
- `archived`

Chế độ auto-response:

- `off`: không tự động phản hồi.
- `suggest_only`: hệ thống chỉ gợi ý, người dùng gửi thủ công.
- `auto_safe`: tự động phản hồi trong tình huống rủi ro thấp đã được cấu hình.
- `manual_review_required`: hệ thống chuẩn bị phản hồi nhưng chờ duyệt.

Khuyến nghị Sprint 2:

- Dùng `suggest_only` cho phần lớn tình huống.
- Dùng `auto_safe` cho phản hồi tích cực/trung tính rủi ro thấp.
- Dùng `manual_review_required` cho nội dung tiêu cực hoặc có dấu hiệu khủng hoảng.

---

## 9. Dashboard và báo cáo theo vai trò

Dashboard và report phải trả lời câu hỏi nghiệp vụ của từng vai trò, không chỉ hiển thị biểu đồ chung.

### 9.1 Dashboard Admin

Mục tiêu:

Giúp Admin vận hành hệ thống và dữ liệu tin cậy.

Admin cần thấy:

- Số record chờ kiểm duyệt nhãn.
- Phân bố AI confidence.
- Trạng thái crawler.
- Số record bị loại do spam, trùng lặp hoặc lỗi dữ liệu.
- Tài khoản Quản lý thương hiệu chờ phê duyệt.
- Lịch sử chỉnh nhãn gần đây của Admin.

Admin không thấy crisis task hoặc lead task như công việc cần xử lý nghiệp vụ.

Hành động chính:

- Kiểm duyệt nhãn.
- Approve/reject dữ liệu để publish.
- Phê duyệt tài khoản Quản lý thương hiệu.
- Kiểm tra nguồn cào lỗi.

### 9.2 Dashboard Quản lý thương hiệu

Mục tiêu:

Giúp Quản lý thương hiệu hiểu sức khỏe brand và điều phối nghiệp vụ.

Quản lý thương hiệu cần thấy:

- Tỷ lệ sentiment tích cực, trung tính, tiêu cực.
- Xu hướng tiêu cực theo thời gian.
- Chủ đề tiêu cực nổi bật.
- Chủ đề tích cực nổi bật.
- Request sửa nhãn đang chờ duyệt.
- Trạng thái xử lý khủng hoảng.
- Trạng thái xử lý lead.
- Trạng thái auto-response.
- Tóm tắt báo cáo theo khoảng thời gian.

Hành động chính:

- Duyệt request sửa nhãn.
- Theo dõi hoặc phân công nhân viên.
- Kiểm tra chủ đề rủi ro.
- Xem báo cáo.
- Bật, tắt hoặc điều chỉnh auto-response.

### 9.3 Dashboard Nhân viên khủng hoảng

Mục tiêu:

Giúp nhân viên xử lý vấn đề tiêu cực quan trọng nhất trước.

Nhân viên khủng hoảng cần thấy:

- Task khủng hoảng được giao.
- Mention tiêu cực mới.
- Alert high/critical.
- Nguồn, thời gian, sentiment, topic, crisis level.
- Gợi ý phản hồi nếu brand cho phép.
- Nút gửi request sửa nhãn.

Hành động chính:

- Mở item ưu tiên cao nhất.
- Xử lý hoặc escalate.
- Gửi request sửa nhãn nếu cần.

### 9.4 Dashboard Nhân viên lead

Mục tiêu:

Giúp nhân viên lead ưu tiên khách hàng tiềm năng và theo dõi tiến độ.

Nhân viên lead cần thấy:

- Hot leads.
- Warm leads và cold leads.
- Thời hạn xử lý lead.
- Trạng thái lead.
- Tín hiệu intent.
- Ngữ cảnh mention tạo ra lead.
- Lead được giao cho mình.

Hành động chính:

- Liên hệ hot lead.
- Cập nhật trạng thái lead.
- Ghi chú chăm sóc.
- Đánh dấu converted, lost, skipped hoặc expired.

### 9.5 Báo cáo

Báo cáo phải cho biết điều gì đã xảy ra, vì sao quan trọng và vai trò liên quan nên làm gì.

Báo cáo cho Quản lý thương hiệu:

- Tổng quan sức khỏe brand.
- Sentiment trend.
- Chủ đề tích cực nổi bật.
- Chủ đề tiêu cực nổi bật.
- Tóm tắt khủng hoảng.
- Tóm tắt lead.
- Lịch sử request sửa nhãn.
- Trạng thái auto-response.
- Hành động khuyến nghị.

Báo cáo cho Nhân viên khủng hoảng:

- Mention tiêu cực đã xử lý.
- Crisis item còn mở.
- Chủ đề khủng hoảng nổi bật.
- Request sửa nhãn đã gửi.

Báo cáo cho Nhân viên lead:

- Lead đã xử lý.
- Phân bố hot/warm/cold.
- Trạng thái chuyển đổi hoặc kết quả.
- Lead quá hạn.

Báo cáo cho Admin:

- Khối lượng dữ liệu đã kiểm duyệt.
- Tỷ lệ nhãn bị chỉnh.
- Chất lượng và confidence của AI.
- Trạng thái crawler.
- Trạng thái phê duyệt tài khoản.

---

## 10. Onboarding và user guide

Onboarding phải theo vai trò. Không dùng một hướng dẫn chung cho tất cả người dùng.

### 10.1 Onboarding Admin

Checklist:

- Kiểm tra tài khoản Quản lý thương hiệu chờ duyệt.
- Mở hàng chờ dữ liệu AI đã gán nhãn.
- Xem trạng thái crawler.
- Approve hoặc reject dữ liệu để publish.

### 10.2 Onboarding Quản lý thương hiệu

Checklist:

- Xác nhận thông tin brand.
- Tạo tài khoản nhân viên.
- Phân quyền nhân viên.
- Xem dashboard sức khỏe brand.
- Duyệt request sửa nhãn nếu có.
- Tạo template phản hồi.
- Chọn chế độ auto-response.

### 10.3 Onboarding Nhân viên khủng hoảng

Checklist:

- Mở crisis queue.
- Hiểu các mức độ severity.
- Mở chi tiết một mention.
- Gửi request sửa nhãn.
- Xem task được giao.

### 10.4 Onboarding Nhân viên lead

Checklist:

- Mở lead queue.
- Hiểu hot/warm/cold intent.
- Mở chi tiết lead.
- Cập nhật trạng thái lead.
- Ghi chú chăm sóc.

### 10.5 Empty state

Empty state phải gợi ý hành động tiếp theo.

Ví dụ:

- Không có crisis task: "Hiện chưa có task khủng hoảng đang hoạt động cho brand của bạn. Hãy kiểm tra mentions tiêu cực gần đây hoặc chờ alert mới."
- Không có lead: "Hiện chưa có lead được giao cho bạn. Hot lead mới sẽ xuất hiện tại đây khi hệ thống phát hiện."
- Không có request sửa nhãn: "Không có request sửa nhãn nào đang chờ duyệt."
- Không có dữ liệu chờ Admin review: "Tất cả record AI gán nhãn đã được kiểm duyệt."

---

## 11. Thực thể dữ liệu nghiệp vụ

Phần này mô tả thực thể theo nghiệp vụ. Schema kỹ thuật có thể thay đổi miễn vẫn đáp ứng các khái niệm này.

### 11.1 User

Trường chính:

- `id`
- `email`
- `display_name`
- `status`
- `created_at`
- `last_login_at`
- `must_change_password`
- `onboarding_completed`

### 11.2 Role

Role hợp lệ:

- `admin`
- `brand_manager`
- `crisis_employee`
- `lead_employee`

### 11.3 Brand hoặc Workspace

Trường chính:

- `id`
- `name`
- `industry`
- `keywords`
- `status`
- `auto_response_mode`
- `created_at`
- `updated_at`

### 11.4 Brand Membership

Trường chính:

- `id`
- `brand_id`
- `user_id`
- `role`
- `status`
- `created_by`
- `created_at`

### 11.5 Mention

Trường chính:

- `id`
- `brand_id`
- `source_platform`
- `source_url`
- `content`
- `author_display_name`
- `published_at`
- `crawled_at`
- `data_state`

### 11.6 Label

Trường chính:

- `id`
- `mention_id`
- `sentiment`
- `topic`
- `crisis_level`
- `lead_intent`
- `confidence`
- `model_version`
- `review_status`
- `reviewed_by`
- `reviewed_at`

### 11.7 Label Correction Request

Trường chính:

- `id`
- `mention_id`
- `brand_id`
- `requested_by`
- `current_label`
- `proposed_label`
- `reason`
- `status`
- `reviewed_by`
- `reviewed_at`
- `created_at`

### 11.8 Alert

Trường chính:

- `id`
- `brand_id`
- `mention_id`
- `severity`
- `type`
- `status`
- `assigned_to`
- `created_at`
- `resolved_at`

### 11.9 Lead

Trường chính:

- `id`
- `brand_id`
- `mention_id`
- `intent_type`
- `intent_signals`
- `status`
- `assigned_to`
- `expires_at`
- `handled_at`
- `notes`

### 11.10 Response Template

Trường chính:

- `id`
- `brand_id`
- `name`
- `sentiment`
- `topic`
- `crisis_level`
- `content`
- `status`
- `created_by`
- `updated_at`

### 11.11 Audit Log

Trường chính:

- `id`
- `actor_id`
- `actor_role`
- `brand_id`
- `action`
- `entity_type`
- `entity_id`
- `before`
- `after`
- `created_at`

---

## 12. Yêu cầu chức năng

### 12.1 Xác thực và vòng đời tài khoản

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-AUTH-01 | Hệ thống hỗ trợ đăng nhập cho Admin, Quản lý thương hiệu, Nhân viên khủng hoảng và Nhân viên lead. | P0 |
| FR-AUTH-02 | Người dùng được cấp sẵn tài khoản phải đổi mật khẩu tạm thời ở lần đăng nhập đầu tiên. | P0 |
| FR-AUTH-03 | Người dùng được điều hướng đến màn hình mặc định theo vai trò sau đăng nhập. | P0 |
| FR-AUTH-04 | Người dùng không truy cập được route ngoài quyền. | P0 |
| FR-AUTH-05 | Người dùng thấy onboarding theo vai trò nếu là lần đầu đăng nhập hoặc chưa hoàn tất hướng dẫn. | P1 |

### 12.2 Vai trò và phân quyền

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-RBAC-01 | Hệ thống enforce quyền theo vai trò ở các module chính. | P0 |
| FR-RBAC-02 | Quản lý thương hiệu chỉ quản lý nhân viên thuộc brand mình. | P0 |
| FR-RBAC-03 | Nhân viên khủng hoảng không xem hoặc xử lý lead queue. | P0 |
| FR-RBAC-04 | Nhân viên lead không xem hoặc xử lý crisis queue. | P0 |
| FR-RBAC-05 | Admin không vận hành nghiệp vụ khủng hoảng hoặc lead của thương hiệu. | P0 |

### 12.3 Gán nhãn và publish dữ liệu

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-LABEL-01 | Crawler chạy theo chu kỳ, kỳ vọng 1-2 tiếng/lần. | P0 |
| FR-LABEL-02 | Hệ thống tiền xử lý dữ liệu trước khi đưa vào AI labeling. | P0 |
| FR-LABEL-03 | AI model gán sentiment, topic, crisis level và lead intent. | P0 |
| FR-LABEL-04 | Admin kiểm duyệt nhãn AI trước khi dữ liệu được publish cho brand. | P0 |
| FR-LABEL-05 | Chỉ dữ liệu đã approve/publish mới hiển thị cho người dùng nghiệp vụ brand. | P0 |
| FR-LABEL-06 | Mọi thay đổi nhãn phải được ghi audit history. | P0 |

### 12.4 Request sửa nhãn

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-REQ-01 | Nhân viên khủng hoảng có thể gửi request sửa nhãn cho published mention thuộc brand mình. | P0 |
| FR-REQ-02 | Quản lý thương hiệu có thể duyệt, từ chối hoặc chỉnh lại request sửa nhãn của brand mình. | P0 |
| FR-REQ-03 | Request được duyệt sẽ cập nhật nhãn active dùng cho dashboard và report. | P0 |
| FR-REQ-04 | Request bị từ chối giữ nguyên nhãn hiện tại và ghi nhận quyết định. | P0 |

### 12.5 Workflow khủng hoảng

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-CRISIS-01 | Nhân viên khủng hoảng xem được crisis queue và negative mentions của brand mình. | P0 |
| FR-CRISIS-02 | Crisis queue được sắp xếp theo severity, thời gian và phân công. | P0 |
| FR-CRISIS-03 | Nhân viên khủng hoảng cập nhật được trạng thái task trong phạm vi cho phép. | P1 |
| FR-CRISIS-04 | Nhân viên khủng hoảng không truy cập thông tin chỉ dành cho lead. | P0 |

### 12.6 Workflow lead

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-LEAD-01 | Nhân viên lead xem được lead queue của brand mình. | P0 |
| FR-LEAD-02 | Lead queue hiển thị mức ưu tiên hot, warm, cold. | P0 |
| FR-LEAD-03 | Nhân viên lead cập nhật được trạng thái và ghi chú xử lý lead. | P1 |
| FR-LEAD-04 | Nhân viên lead không truy cập thông tin chỉ dành cho khủng hoảng. | P0 |

### 12.7 Auto-response

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-RESP-01 | Quản lý thương hiệu có thể tạo và quản lý response template cho brand mình. | P0 |
| FR-RESP-02 | Quản lý thương hiệu có thể bật hoặc tắt auto-response cho brand mình. | P0 |
| FR-RESP-03 | Auto-response mặc định tắt với brand mới. | P0 |
| FR-RESP-04 | Nội dung khủng hoảng high/critical bắt buộc qua manual review trước khi phản hồi. | P0 |
| FR-RESP-05 | Mọi quyết định auto-response phải được ghi log. | P1 |

### 12.8 Báo cáo

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-REPORT-01 | Báo cáo hiển thị thông tin liên quan đến vai trò người dùng. | P0 |
| FR-REPORT-02 | Báo cáo của Quản lý thương hiệu gồm sức khỏe brand, sentiment, khủng hoảng, lead và request. | P0 |
| FR-REPORT-03 | Báo cáo của Admin tập trung vào kiểm duyệt dữ liệu, chất lượng nhãn, crawler và phê duyệt tài khoản. | P0 |
| FR-REPORT-04 | Báo cáo dùng nhãn đã duyệt mới nhất, không dùng nhãn raw chưa kiểm duyệt. | P0 |

---

## 13. Acceptance Criteria Sprint 2

### 13.1 Vai trò và đăng nhập

- Admin đăng nhập và vào dashboard vận hành dữ liệu/tài khoản.
- Quản lý thương hiệu đăng nhập và vào dashboard brand của mình.
- Nhân viên khủng hoảng đăng nhập và vào crisis queue.
- Nhân viên lead đăng nhập và vào lead queue.
- Người dùng không thấy module ngoài quyền.
- Người dùng được cấp tài khoản tạm thời phải đổi mật khẩu lần đầu.
- Người dùng đăng nhập lần đầu thấy onboarding theo vai trò.

### 13.2 Phân quyền

- Quản lý thương hiệu chỉ quản lý nhân viên của brand mình.
- Nhân viên khủng hoảng không truy cập lead queue.
- Nhân viên lead không truy cập crisis queue.
- Admin không nhận task xử lý khủng hoảng hoặc lead.
- Admin có thể kiểm duyệt nhãn trước publish.

### 13.3 Luồng gán nhãn

- Hệ thống biểu diễn được trạng thái dữ liệu từ raw đến published.
- Dữ liệu AI gán nhãn không hiển thị cho brand user trước khi Admin approve.
- Admin có thể approve hoặc chỉnh nhãn trước publish.
- Dữ liệu published xuất hiện trong dashboard và queue của brand theo quyền.
- Nhân viên khủng hoảng gửi được request sửa nhãn.
- Quản lý thương hiệu duyệt hoặc từ chối request sửa nhãn.
- Request được duyệt cập nhật tính toán dashboard/report.
- Mọi thay đổi nhãn có audit history.

### 13.4 Dashboard và báo cáo

- Mỗi vai trò thấy dashboard phù hợp với công việc.
- Sentiment tích cực/tiêu cực được giải thích theo ngữ cảnh vai trò.
- Quản lý thương hiệu thấy sức khỏe brand và request chờ duyệt.
- Nhân viên khủng hoảng thấy công việc tiêu cực/khủng hoảng, không thấy lead.
- Nhân viên lead thấy công việc lead, không thấy khủng hoảng.
- Admin thấy vận hành hệ thống và kiểm duyệt nhãn, không thấy nghiệp vụ brand như task cần xử lý.

### 13.5 Auto-response

- Quản lý thương hiệu tạo được response template.
- Quản lý thương hiệu bật/tắt được auto-response cho brand mình.
- Auto-response mặc định tắt.
- Nội dung high/critical crisis yêu cầu manual review.
- Hành động auto-response có thể audit.

---

## 14. Definition of Done

Sprint 2 được coi là đạt yêu cầu khi:

- Role được định nghĩa thống nhất trong UI và backend authorization.
- Route quan trọng có kiểm tra quyền.
- Mỗi vai trò có landing page và next action rõ ràng.
- Admin được tách khỏi nghiệp vụ thương hiệu.
- Quản lý thương hiệu quản lý được nhân viên và quyền trong brand mình.
- Quyền của nhân viên khủng hoảng và nhân viên lead được tách rõ.
- Luồng gán nhãn và request sửa nhãn được implement hoặc stub rõ theo acceptance criteria.
- Dashboard/report có nội dung theo vai trò.
- Có onboarding hoặc checklist đăng nhập lần đầu theo vai trò.
- Auto-response có template và cấu hình bật/tắt.
- Các workflow quan trọng có audit log hoặc event sẵn sàng cho audit.
- QA có thể test bằng tài khoản mẫu cho từng vai trò.

---

## 15. Câu hỏi mở cần PO chốt

| ID | Câu hỏi | Đề xuất mặc định |
|---|---|---|
| OQ-01 | Một Quản lý thương hiệu có thể quản lý nhiều brand không? | Không trong Sprint 2, trừ khi được gán rõ. |
| OQ-02 | Nhân viên khủng hoảng có được request sửa nhãn lead intent không? | Không mặc định, vì lead nằm ngoài phạm vi khủng hoảng. |
| OQ-03 | Nhân viên lead có được request sửa lead intent không? | Nên cân nhắc ở sprint sau. |
| OQ-04 | Quản lý thương hiệu có được override nhãn sau Admin review không? | Có, trong phạm vi brand-facing label và phải có audit. |
| OQ-05 | Auto-response có được tự đăng công khai không qua duyệt không? | Chỉ với tình huống rủi ro thấp đã được bật rõ. |

---

## 16. Change Log

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 2.0 | 2026-07-02 | Viết lại SPEC cho Sprint 2, tập trung vào phân quyền nghiệp vụ, luồng gán nhãn, onboarding, báo cáo theo vai trò và auto-response. |
