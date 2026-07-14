# Sprint 3 - User Story: Trang tổng quan công việc trong ngày theo vai trò

## 1. Thông tin User Story

| Thuộc tính | Nội dung |
|---|---|
| Mã User Story | `US-S3-01` |
| Tên | Thiết kế giao diện tổng quan công việc trong ngày cho nhân viên nghiệp vụ |
| Epic | Role-based Dashboard / Daily Work Center |
| Độ ưu tiên | P0 - Must have |
| Vai trò | Nhân viên xử lý khủng hoảng (`crisis_employee`) và Nhân viên xử lý khách hàng tiềm năng (`lead_employee`) |
| Phạm vi | Brand của người dùng đang đăng nhập và các công việc được giao cho người dùng đó |

## 2. User Story

**Là** nhân viên xử lý khủng hoảng hoặc nhân viên xử lý khách hàng tiềm năng,  
**tôi muốn** có một trang tổng quan dạng To-do hiển thị công việc cần làm hôm nay, công việc còn dở từ hôm qua, trạng thái phản hồi của khách hàng và các tín hiệu tích cực/tiêu cực liên quan đến vai trò của tôi,  
**để** tôi biết việc nào cần ưu tiên, tiếp tục xử lý đúng ngữ cảnh và không bỏ sót khách hàng hoặc sự cố quan trọng.

## 3. Mục tiêu nghiệp vụ

- Cung cấp một điểm bắt đầu chung sau khi nhân viên đăng nhập.
- Trả lời nhanh bốn câu hỏi: Hôm nay cần làm gì? Hôm qua còn việc gì? Khách hàng đã phản hồi chưa? Việc nào cần ưu tiên ngay?
- Dùng chung cấu trúc giao diện nhưng cá nhân hóa nội dung và hành động theo vai trò.
- Giảm bỏ sót công việc quá hạn, xử lý trùng và thời gian chuyển qua lại giữa nhiều trang.
- Cho phép nhân viên cập nhật tiến độ ngay trên dashboard hoặc mở nhanh màn hình nghiệp vụ chi tiết.

## 4. Nguyên tắc phân quyền

- Nhân viên khủng hoảng chỉ thấy task khủng hoảng, alert, mention tiêu cực và contact liên quan trong brand của mình.
- Nhân viên lead chỉ thấy lead và lịch sử chăm sóc lead trong brand của mình.
- Hai vai trò dùng chung layout/component, nhưng không được nhìn thấy dữ liệu nghiệp vụ không thuộc quyền.
- Chỉ hiển thị công việc được giao cho người dùng hiện tại; có thể thêm mục “Chưa phân công” nếu cấu hình brand cho phép nhân viên tự nhận việc.
- Mọi thay đổi trạng thái phải lưu người thực hiện, thời gian và giá trị trước/sau để phục vụ audit.

## 5. Thiết kế giao diện chung

### 5.1 Thanh đầu trang

- Lời chào, ngày hiện tại và ca làm việc.
- Thời điểm đồng bộ dữ liệu gần nhất và nút làm mới.
- Bộ lọc: Hôm nay / Tuần này, mức ưu tiên, trạng thái và nguồn.
- Nút “Bắt đầu việc ưu tiên nhất”.

### 5.2 Các thẻ tổng quan

- Việc cần làm hôm nay.
- Việc tồn từ hôm qua.
- Việc quá hạn hoặc sắp quá SLA.
- Khách hàng đã phản hồi / đang chờ phản hồi.
- Chỉ số tích cực và tiêu cực hôm nay.
- Số việc đã hoàn thành hôm nay.

Các thẻ phải bấm được để lọc danh sách To-do tương ứng.

### 5.3 Danh sách To-do chính

Mỗi task hiển thị tối thiểu:

- Tiêu đề và loại công việc.
- Khách hàng/contact hoặc nguồn phát sinh.
- Mức ưu tiên và hạn xử lý/SLA.
- Trạng thái hiện tại.
- Thời điểm cập nhật gần nhất.
- Trạng thái phản hồi: chưa liên hệ, đã liên hệ, chờ phản hồi, đã phản hồi.
- Ghi chú gần nhất và bước tiếp theo.
- Hành động nhanh phù hợp với vai trò.

Danh sách được chia thành:

1. **Khẩn cấp / cần làm ngay**: quá hạn, sắp vi phạm SLA, critical/high hoặc hot lead.
2. **Cần làm hôm nay**: task có hạn trong ngày hoặc lịch follow-up hôm nay.
3. **Còn dở từ hôm qua**: task chưa hoàn tất được chuyển tiếp sang ngày hiện tại.
4. **Đang chờ khách hàng phản hồi**: chưa cần hành động ngay nhưng phải có thời điểm nhắc lại.
5. **Đã hoàn thành hôm nay**: mặc định thu gọn, cho phép mở để kiểm tra.

### 5.4 Tóm tắt diễn biến hôm nay

- So sánh số tín hiệu tích cực/tiêu cực với ngày hôm qua.
- Hiển thị chủ đề nổi bật, nguồn phát sinh và thay đổi bất thường.
- Chỉ hiển thị dữ liệu có ý nghĩa với vai trò; không biến dashboard nhân viên thành báo cáo quản lý đầy đủ.
- Cho phép mở nhanh danh sách dữ liệu tạo nên chỉ số, tránh chỉ hiển thị con số không có ngữ cảnh.

### 5.5 Khu vực cần chú ý

- Task không có người phụ trách hoặc thiếu hạn xử lý.
- Task không được cập nhật quá lâu.
- Khách hàng phản hồi mới nhưng chưa được đọc/xử lý.
- Dữ liệu thiếu thông tin liên hệ.
- Task có dấu hiệu xử lý trùng bởi người khác.

## 6. Nội dung tùy chỉnh theo vai trò

| Thành phần | Nhân viên xử lý khủng hoảng | Nhân viên xử lý khách hàng tiềm năng |
|---|---|---|
| Việc ưu tiên | Alert critical/high, mention tiêu cực mới, sự cố sắp quá SLA | Hot lead, lead sắp quá hạn, lịch follow-up hôm nay |
| Việc còn dở | Sự cố đang tiếp nhận/đang xử lý từ hôm qua | Lead ở trạng thái assigned/contacting từ hôm qua |
| Phản hồi khách hàng | Có phản hồi mới sau khi xử lý, phản hồi tiếp tục tiêu cực hay đã dịu xuống | Đã trả lời hay chưa, mức quan tâm mới, thời điểm cần liên hệ lại |
| Tích cực hôm nay | Số sự cố đã hạ mức, phản hồi chuyển từ tiêu cực sang trung tính/tích cực | Lead mới, lead tăng mức intent, lead converted |
| Tiêu cực hôm nay | Mention tiêu cực tăng, alert mới, sự cố quá SLA hoặc bị escalate | Lead mất quan tâm, lost/expired, không phản hồi, thiếu thông tin liên hệ |
| Người cần liên hệ | Contact có ảnh hưởng cao hoặc liên tục đăng nội dung tiêu cực | Danh sách khách có tín hiệu mua: ưu tiên hot, sau đó warm và cold |
| Hành động nhanh | Tiếp nhận, xử lý tiếp, escalate, mở nguồn gốc, gửi yêu cầu sửa nhãn | Gọi/nhắn/email, cập nhật trạng thái, thêm ghi chú, đặt lịch follow-up, converted/lost |
| Điều hướng chi tiết | `/alerts` hoặc mention liên quan | `/leads` hoặc chi tiết lead |

## 7. Quy tắc ưu tiên đề xuất

### 7.1 Với nhân viên khủng hoảng

1. Critical đã quá hoặc sắp quá SLA.
2. High có reach/influence cao hoặc tín hiệu tăng đột biến.
3. Khách hàng vừa phản hồi tiêu cực trở lại.
4. Task đang xử lý từ hôm qua.
5. Mention tiêu cực mới còn lại.

### 7.2 Với nhân viên lead

1. Hot lead đã quá hoặc sắp đến hạn liên hệ.
2. Lead vừa phản hồi và có tín hiệu mua rõ.
3. Lịch follow-up đến hạn hôm nay.
4. Lead đang liên hệ từ hôm qua nhưng chưa có kết quả.
5. Warm lead, sau đó cold lead.

Nếu hai task cùng mức ưu tiên, task có hạn gần hơn đứng trước; nếu vẫn bằng nhau, task cập nhật mới hơn đứng trước.

## 8. Trạng thái và hành vi chính

### 8.1 Trạng thái phản hồi khách hàng dùng chung

- `not_contacted`: Chưa liên hệ.
- `contacted`: Đã liên hệ.
- `waiting_response`: Đang chờ khách hàng phản hồi.
- `responded`: Khách hàng đã phản hồi.
- `follow_up_due`: Đến hạn liên hệ lại.
- `no_response`: Không phản hồi sau số lần/thời gian quy định.

### 8.2 Chuyển việc sang ngày mới

- Task chưa hoàn thành cuối ngày không bị mất khỏi dashboard.
- Sang ngày mới, task được gắn nhãn “Tồn từ hôm qua”; vẫn giữ nguyên ngày tạo và lịch sử xử lý.
- Task quá hạn phải được đẩy lên nhóm khẩn cấp và hiển thị thời gian quá hạn.
- Task đang chờ phản hồi chỉ chuyển thành việc cần làm khi tới thời điểm follow-up hoặc có phản hồi mới.

### 8.3 Empty state

- Không có việc hôm nay: “Bạn chưa có công việc cần xử lý hôm nay. Hãy theo dõi dữ liệu mới hoặc kiểm tra các mục đang chờ phản hồi.”
- Không có việc tồn: “Tuyệt vời, bạn không còn công việc tồn từ hôm qua.”
- Không có phản hồi mới: “Chưa có phản hồi mới từ khách hàng.”
- Không có dữ liệu xu hướng: “Chưa đủ dữ liệu để tổng hợp diễn biến hôm nay.”

## 9. Acceptance Criteria

### AC01 - Giao diện chung và cá nhân hóa vai trò

**Given** người dùng đăng nhập bằng tài khoản nhân viên hợp lệ  
**When** mở `/dashboard`  
**Then** hệ thống hiển thị cùng một bố cục Daily Work Center nhưng chỉ tải widget, dữ liệu và hành động đúng với vai trò của người dùng.

### AC02 - Hiển thị việc cần làm hôm nay

**Given** người dùng có task được giao với hạn xử lý hoặc lịch follow-up trong ngày  
**When** dashboard tải xong  
**Then** task xuất hiện trong “Cần làm hôm nay”, có mức ưu tiên, hạn xử lý, trạng thái phản hồi và bước tiếp theo.

### AC03 - Chuyển tiếp việc chưa hoàn thành

**Given** task của ngày trước chưa ở trạng thái hoàn thành  
**When** người dùng mở dashboard vào ngày mới  
**Then** task xuất hiện trong “Còn dở từ hôm qua” và được đẩy vào “Khẩn cấp” nếu đã quá hạn.

### AC04 - Theo dõi phản hồi khách hàng

**Given** task đã được liên hệ hoặc phản hồi  
**When** trạng thái giao tiếp thay đổi  
**Then** dashboard cập nhật trạng thái phản hồi, thời gian phản hồi gần nhất và hành động tiếp theo mà không tạo task trùng.

### AC05 - Tóm tắt tích cực và tiêu cực

**Given** có dữ liệu phát sinh trong ngày của brand  
**When** dashboard hiển thị phần diễn biến hôm nay  
**Then** người dùng thấy số liệu tích cực/tiêu cực phù hợp vai trò và có thể bấm để xem các item tạo nên số liệu đó.

### AC06 - Danh sách người cần liên hệ

**Given** có contact/lead đủ điều kiện ưu tiên  
**When** người dùng xem nhóm cần liên hệ  
**Then** danh sách được sắp theo quy tắc ưu tiên của vai trò, hiển thị lý do ưu tiên và phương thức liên hệ khả dụng.

### AC07 - Cập nhật nhanh task

**Given** người dùng có quyền xử lý task  
**When** thực hiện hành động nhanh trên dashboard  
**Then** trạng thái, ghi chú và thời gian cập nhật được lưu; số liệu tổng quan và các nhóm To-do được cập nhật tương ứng.

### AC08 - Cập nhật realtime và chống xử lý trùng

**Given** cùng một task đang được mở ở nhiều phiên làm việc  
**When** một nhân viên nhận hoặc cập nhật task  
**Then** các phiên còn lại nhận thay đổi gần realtime và hiển thị người đang xử lý/khóa hành động nếu cần.

### AC09 - Bảo mật dữ liệu

**Given** người dùng là `crisis_employee` hoặc `lead_employee`  
**When** truy cập dashboard hoặc gọi API  
**Then** hệ thống chỉ trả về dữ liệu đúng brand, đúng quyền và đúng phạm vi phân công; việc ẩn bằng giao diện không thay thế kiểm tra quyền tại API.

### AC10 - Trải nghiệm và khả năng sử dụng

**Given** dashboard ở trạng thái tải, lỗi hoặc không có dữ liệu  
**When** người dùng truy cập bằng desktop hoặc mobile  
**Then** giao diện có loading skeleton, error/retry, empty state phù hợp, responsive và có thể thao tác bằng bàn phím.

## 10. Chia task triển khai

### Task 1 - Phân tích nghiệp vụ và thiết kế UX/UI

- Chốt định nghĩa “việc hôm nay”, “tồn hôm qua”, “quá hạn”, “đã phản hồi”, “tích cực” và “tiêu cực”.
- Xác định deadline, SLA, lịch follow-up, điều kiện hoàn thành và quy tắc ưu tiên cho từng vai trò.
- Thiết kế wireframe/prototype desktop và mobile cho header, thẻ tổng quan, các nhóm To-do, xu hướng và khu vực cần chú ý.
- Thiết kế loading, error, empty state, overdue, bộ lọc và hành động nhanh.
- **Đầu ra:** business rule, user flow và prototype cho hai vai trò được Product Owner duyệt.

### Task 2 - Xây dựng dữ liệu và API Daily Work Center

- Chuẩn hóa model công việc với các trường assignee, deadline, priority, status, response status, next action và lịch sử cập nhật.
- Mapping Alert/Mention/Lead sang view model chung nhưng vẫn tách quyền nghiệp vụ.
- Xây API summary, danh sách task, cập nhật task và bộ lọc theo ngày, brand, vai trò, người phụ trách.
- Xử lý việc hôm nay, việc tồn, task quá hạn, task chờ phản hồi và task đã hoàn thành theo múi giờ `Asia/Ho_Chi_Minh`.
- Áp dụng RBAC tại backend, phân trang, sắp xếp và trả về lý do ưu tiên.
- **Đầu ra:** schema/migration, API contract và service có unit test.

### Task 3 - Xây dựng giao diện chung và Dashboard nhân viên khủng hoảng

- Tạo các component dùng chung: thẻ tổng quan, nhóm To-do, thẻ công việc, trạng thái phản hồi, mức ưu tiên và tóm tắt xu hướng.
- Đảm bảo responsive, accessibility và cập nhật bộ lọc từ các thẻ tổng quan.
- Với nhân viên khủng hoảng: hiển thị alert critical/high, mention tiêu cực, task còn dở, contact rủi ro và SLA.
- Bổ sung hành động tiếp nhận, xử lý tiếp, escalate, xem nguồn gốc và gửi yêu cầu sửa nhãn.
- Hiển thị tín hiệu tích cực/tiêu cực trong ngày và lý do ưu tiên của từng task.
- **Đầu ra:** Dashboard khủng hoảng hoàn chỉnh theo Acceptance Criteria.

### Task 4 - Xây dựng Dashboard nhân viên lead và theo dõi phản hồi

- Tái sử dụng layout/component chung, chỉ tải dữ liệu và hành động đúng quyền nhân viên lead.
- Hiển thị hot/warm/cold lead, lead tồn hôm qua, lịch follow-up, lead sắp quá hạn và danh sách người cần liên hệ.
- Bổ sung gọi/nhắn/email, ghi chú, đặt lịch và cập nhật trạng thái converted/lost/skipped/expired.
- Theo dõi khách đã phản hồi hay chưa, thời điểm phản hồi cuối, số lần liên hệ và bước tiếp theo.
- Đưa task về hàng ưu tiên khi có phản hồi mới hoặc đến hạn follow-up; hiển thị thông báo và chống tạo trùng.
- **Đầu ra:** Dashboard lead và luồng response/follow-up hoạt động end-to-end.

### Task 5 - Realtime, kiểm thử và nghiệm thu

- Đồng bộ task và số liệu tổng quan gần realtime; hiển thị người đang xử lý và ngăn cập nhật xung đột.
- Ghi audit log cho nhận việc, thay đổi trạng thái, ghi chú, liên hệ và hoàn thành.
- Thực hiện unit test, integration test và E2E cho hai vai trò, RBAC, việc tồn, phản hồi mới, SLA và empty state.
- Kiểm tra responsive, accessibility, hiệu năng và tình huống nhiều phiên người dùng.
- Chuẩn bị dữ liệu demo, hướng dẫn sử dụng và UAT checklist; Product Owner nghiệm thu theo Acceptance Criteria.
- **Đầu ra:** test report, tài liệu hướng dẫn và xác nhận UAT/Definition of Done.

## 11. Đề xuất bổ sung để tránh thiếu nghiệp vụ

- **Lý do ưu tiên:** mỗi task cần nói rõ vì sao nằm trên đầu danh sách, ví dụ “Hot lead sắp quá hạn 20 phút”.
- **Bước tiếp theo bắt buộc:** task đang xử lý phải có next action hoặc thời gian follow-up để tránh bị treo.
- **Nhắc việc và SLA:** cảnh báo trước hạn, khi quá hạn và khi khách phản hồi mới.
- **Ghi chú bàn giao ca:** nhân viên ghi tóm tắt để ca sau tiếp tục mà không mất ngữ cảnh.
- **Snooze có kiểm soát:** cho phép hoãn đến một thời điểm cụ thể, bắt buộc nhập lý do.
- **Tìm kiếm và bộ lọc đã lưu:** hữu ích khi danh sách lớn nhưng không làm thay đổi phân quyền.
- **Chỉ số hoàn thành cá nhân:** số task hoàn thành và đúng SLA; tránh biến thành bảng xếp hạng gây sai động lực trong Sprint 3.
- **Theo dõi dữ liệu thiếu:** số điện thoại/email trống, task thiếu assignee hoặc deadline.
- **Khả năng truy vết:** từ mọi KPI phải mở được danh sách item nguồn và lịch sử thay đổi.

## 12. Ngoài phạm vi Sprint 3

- Dashboard quản trị đầy đủ cho Brand Manager hoặc Admin.
- AI tự động quyết định phản hồi công khai cho khủng hoảng high/critical.
- Hệ thống KPI thưởng/phạt hoặc xếp hạng nhân viên.
- Tự động gọi điện/gửi tin nhắn nếu chưa có tích hợp kênh và sự đồng ý phù hợp.
- Cho nhân viên xem hoặc xử lý dữ liệu ngoài brand/ngoài vai trò của mình.

## 13. Definition of Done

- Hoàn thành và demo được cả hai biến thể vai trò trên cùng layout.
- Đạt toàn bộ Acceptance Criteria và test RBAC ở cả UI lẫn API.
- Không làm rò rỉ crisis data sang lead employee hoặc lead data sang crisis employee.
- Hoạt động đúng với múi giờ Việt Nam, bao gồm chuyển việc qua ngày mới.
- Có loading, error, empty state, responsive và accessibility cơ bản.
- Có audit log và không tạo task/thông báo trùng khi dữ liệu realtime cập nhật.
- Tài liệu API, hướng dẫn sử dụng và UAT checklist đã được cập nhật.
