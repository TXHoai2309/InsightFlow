# InsightFlow — Changelog

> Changelog này được viết lại theo **thứ tự commit từ cũ đến mới** trên nhánh `main`.
> Mục tiêu của file là ghi nhận quá trình phát triển thực tế của repo, tránh mô tả vượt quá những gì đã được commit.
>
> Quy ước:
>
> - Các commit có message rõ ràng sẽ được diễn giải theo đúng nội dung commit.
> - Các commit message ngắn như `fix`, `done`, `oke`, `a`, `update` được ghi nhận là cập nhật/hoàn thiện chung, không suy diễn quá sâu.
> - Các commit merge vẫn được giữ lại để phản ánh đúng dòng phát triển giữa các nhánh.

---

## Tổng quan lịch sử phát triển

Dự án InsightFlow được phát triển theo hướng web app phục vụ bài toán **AI Media Monitoring / Brand Intelligence**. Lịch sử commit thể hiện quá trình đi từ khởi tạo repo, dựng cấu trúc thư mục, xây dựng giao diện Home/Auth/Dashboard, mở rộng sang các màn hình nghiệp vụ như Mentions, Alerts, Reports, sau đó bổ sung dữ liệu hiển thị, chỉnh phần phân tích AI và sửa lỗi build/deploy.

Các giai đoạn chính:

1. **Khởi tạo nền tảng dự án**: tạo repo, cấu trúc thư mục, tài liệu ban đầu và file cấu hình.
2. **Xây dựng giao diện cơ bản**: Home, Login/Logout, Dashboard.
3. **Mở rộng màn hình nghiệp vụ**: Mentions, Alerts, Reports và các phần điều hướng liên quan.
4. **Hoàn thiện responsive và xử lý merge**: hợp nhất code từ các nhánh thành viên, sửa xung đột, chỉnh layout.
5. **Đưa dữ liệu lên giao diện**: hiển thị dữ liệu ở Mentions và Dashboard.
6. **Hiệu chỉnh phân tích AI và sửa lỗi deploy**: cập nhật logic/hiển thị AI, sửa lỗi TypeScript, union type, field dữ liệu và lỗi Vercel.

---

## 2026-06-16 — Khởi tạo dự án, tài liệu, Home, Auth và Dashboard nền tảng

### Nhóm 1 — Khởi tạo repo và cấu trúc tài liệu

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 01 | `da6fe71` | `first commit` | Tạo commit đầu tiên cho repo InsightFlow. Đây là mốc bắt đầu lịch sử phát triển của dự án trên GitHub. | Repository |
| 02 | `9b59a81` | `feat: initialize project directory structure and placeholder files` | Khởi tạo cấu trúc thư mục ban đầu và các file placeholder. Commit này giúp repo có bộ khung để tách tài liệu, source code app web và các phần cấu hình sau này. | Project structure |
| 03 | `9d846cd` | `Xóa các file thừa` | Dọn bớt file không cần thiết sau giai đoạn khởi tạo, giúp repo gọn hơn và tránh giữ lại các file mẫu không phục vụ sản phẩm. | Cleanup |
| 04 | `ca021e0` | `add CHANGELOG.md` | Thêm file changelog để bắt đầu ghi nhận lịch sử thay đổi của dự án. | Documentation |
| 05 | `8d7ecec` | `add CHANGELOG.md` | Tiếp tục cập nhật/bổ sung changelog. Có thể là chỉnh sửa nội dung hoặc đưa file changelog vào đúng vị trí tài liệu. | Documentation |

#### Kết quả đạt được

- Repo đã có điểm khởi đầu rõ ràng.
- Cấu trúc thư mục cơ bản được tạo để phục vụ phát triển tiếp theo.
- Bắt đầu có tài liệu changelog trong thư mục docs.
- Dự án chuyển từ trạng thái rỗng sang có bộ khung phát triển.

---

### Nhóm 2 — Xây dựng trang Home

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 06 | `28c7339` | `build layout "home"` | Xây dựng layout trang chủ. Đây là màn hình đầu tiên giúp người dùng hiểu sản phẩm InsightFlow, đóng vai trò landing page hoặc entry page của web app. | Home UI |
| 07 | `8d1cf63` | `fix bug layout "home"` | Sửa lỗi layout Home sau khi dựng bản đầu tiên. Commit này giúp giao diện Home ổn định hơn về bố cục, khoảng cách hoặc hiển thị. | Home UI / Fix |

#### Kết quả đạt được

- Có trang Home làm điểm vào cho sản phẩm.
- Layout Home được chỉnh lỗi sau bản dựng đầu tiên.
- Giai đoạn này tập trung vào phần nhìn và trải nghiệm đầu tiên của người dùng.

---

### Nhóm 3 — Login, Logout và session

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 08 | `ce7cd89` | `login, log out` | Bổ sung luồng đăng nhập và đăng xuất. Đây là nền tảng để phân biệt người dùng đã xác thực và người dùng chưa xác thực. | Auth |
| 09 | `30196a8` | `gitignore` | Cập nhật `.gitignore` để loại trừ file không nên đưa lên repo, ví dụ file môi trường, build output hoặc dependency local. | Repo config |
| 10 | `c677e96` | `đẩy code lên` | Đẩy thêm phần code đang phát triển lên repo. Message không mô tả chi tiết nên chỉ ghi nhận là cập nhật chung trong giai đoạn Auth/Home. | General update |
| 11 | `6872c0f` | `Merge branch 'Tan-home' into minh-login` | Gộp nhánh Home vào nhánh Login. Điều này cho thấy phần giao diện trang chủ và phần đăng nhập được tích hợp để chuẩn bị merge vào main. | Merge / Home + Auth |
| 12 | `0a1d56c` | `Merge pull request #1 from TXHoai2309/minh-login` | Merge pull request từ nhánh `minh-login` vào main. Đây là mốc đưa phần login/logout vào nhánh chính. | Merge / Auth |
| 13 | `80f347f` | `fix xung dot` | Sửa xung đột sau quá trình merge. Commit này giúp code từ các nhánh không ghi đè hoặc phá vỡ nhau. | Merge conflict fix |
| 14 | `7929856` | `đăng suất session` | Hoàn thiện/sửa phần session khi đăng xuất. Nội dung commit cho thấy có xử lý trạng thái phiên đăng nhập sau khi user logout. | Auth session |

#### Kết quả đạt được

- Web app bắt đầu có luồng đăng nhập/đăng xuất.
- Code Home và Auth được hợp nhất.
- Có xử lý session logout, giảm khả năng người dùng vẫn giữ trạng thái đăng nhập sai sau khi thoát.
- Xung đột merge được xử lý để main ổn định hơn.

---

### Nhóm 4 — Dashboard bản đầu

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 15 | `7f2050e` | `build giao dien Dashboard` | Xây dựng giao diện Dashboard. Đây là màn hình trung tâm để hiển thị số liệu tổng quan của InsightFlow như mentions, sentiment, alert hoặc chỉ số phân tích thương hiệu. | Dashboard UI |

#### Kết quả đạt được

- Dashboard được tạo ở mức giao diện.
- Dự án bắt đầu có màn hình nghiệp vụ chính thay vì chỉ có Home/Auth.
- Đây là nền tảng để các commit sau đưa dữ liệu thật/mock data lên Dashboard.

---

## 2026-06-17 đến 2026-06-18 — Mở rộng UI nghiệp vụ, Mentions, Alerts, Reports, responsive và deploy

### Nhóm 5 — Merge Dashboard và cập nhật tài liệu

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 16 | `f30c3ee` | `Merge pull request #2 from TXHoai2309/Tan-dashboard` | Merge pull request đưa phần Dashboard từ nhánh `Tan-dashboard` vào main. Đây là mốc xác nhận Dashboard trở thành một phần chính thức của nhánh chính. | Merge / Dashboard |
| 17 | `052225c` | `update Changelog` | Cập nhật changelog sau khi có thêm các thay đổi về Dashboard hoặc tài liệu. | Documentation |
| 18 | `a0e9122` | `update` | Commit cập nhật chung. Message không mô tả chi tiết nên chỉ ghi nhận là thay đổi nhỏ/bổ sung trong giai đoạn Dashboard. | General update |
| 19 | `64ae830` | `Merge branch 'Tan-dashboard'` | Tiếp tục merge nhánh Dashboard. Commit này phản ánh việc đồng bộ code Dashboard giữa các nhánh. | Merge / Dashboard |
| 20 | `0cc17f9` | `Initial commit` | Commit có message “Initial commit” trong nhánh đang merge. Vì không phải commit đầu tiên của toàn repo, ghi nhận đây là mốc khởi tạo/phần nền của một nhánh chức năng. | Branch update |
| 21 | `f3bfc83` | `oke` | Commit cập nhật chung, message không đủ chi tiết để xác định thay đổi cụ thể. | General update |

#### Kết quả đạt được

- Dashboard được đưa vào main qua PR/merge.
- Tài liệu changelog tiếp tục được cập nhật.
- Một số commit trung gian giúp đồng bộ code giữa các nhánh thành viên.

---

### Nhóm 6 — Mentions: tạo layout và hoàn thiện giao diện

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 22 | `0df2eff` | `build layout Mentions` | Xây dựng layout trang Mentions. Đây là màn hình dùng để xem danh sách bài viết/đề cập liên quan đến thương hiệu. | Mentions UI |
| 23 | `7c57634` | `hoàn thiện` | Hoàn thiện thêm phần đang phát triển sau layout Mentions. Message không nêu rõ chi tiết nên ghi nhận là hoàn thiện giao diện/chức năng liên quan. | Mentions / General |
| 24 | `6471528` | `a` | Commit cập nhật rất ngắn, không đủ dữ liệu để diễn giải cụ thể. Ghi nhận là cập nhật nhỏ trong luồng phát triển Mentions/Auth. | General update |
| 25 | `b1b3f06` | `Merge branch 'TXH' into minh-login` | Merge nhánh `TXH` vào `minh-login`, đồng bộ code giữa phần chức năng của TXH và luồng login. | Merge |
| 26 | `87cef3e` | `Merge branch 'TXH' into ThuHaTest` | Merge nhánh `TXH` vào `ThuHaTest`, tiếp tục đồng bộ code giữa các nhánh phát triển. | Merge |
| 27 | `820fade` | `fix` | Commit sửa lỗi. Message không nêu rõ lỗi nên chỉ ghi nhận là fix chung trong giai đoạn merge/phát triển Mentions. | Fix |
| 28 | `7ad391a` | `update layout Mentions` | Cập nhật layout Mentions sau bản dựng đầu tiên. Có thể liên quan đến bố cục, spacing, card, bảng, filter hoặc cách hiển thị danh sách. | Mentions UI |
| 29 | `7b37080` | `fix` | Sửa lỗi sau khi cập nhật Mentions. Message không đủ chi tiết để xác định lỗi cụ thể. | Fix |
| 30 | `0d4a0dd` | `add layout function button` | Thêm layout cho các nút chức năng. Nhiều khả năng liên quan đến các action trên giao diện như lọc, xem chi tiết, thao tác với dữ liệu hoặc điều hướng. | UI actions |

#### Kết quả đạt được

- Trang Mentions được tạo layout.
- Layout Mentions được cập nhật sau vòng đầu.
- Có thêm bố cục cho các nút chức năng, giúp màn hình có hành động rõ hơn thay vì chỉ hiển thị tĩnh.
- Các nhánh thành viên được merge nhiều lần để đồng bộ code.

---

### Nhóm 7 — Alerts và Reports

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 31 | `26f4bc8` | `build layout Alerts` | Xây dựng layout trang Alerts. Đây là màn hình phục vụ việc hiển thị cảnh báo/rủi ro truyền thông hoặc các tín hiệu cần chú ý. | Alerts UI |
| 32 | `a6eda63` | `report` | Bổ sung hoặc cập nhật phần Reports. Đây là bước mở rộng sản phẩm từ theo dõi dữ liệu sang tổng hợp báo cáo. | Reports UI |
| 33 | `93fdd0c` | `done` | Commit hoàn thiện chung sau khi làm Alerts/Reports. Message không đủ chi tiết nên ghi nhận là hoàn thiện phần đang phát triển. | General completion |

#### Kết quả đạt được

- Có thêm màn hình Alerts để phục vụ cảnh báo.
- Có thêm phần Reports để phục vụ báo cáo/tổng hợp.
- Sản phẩm bắt đầu đủ bộ màn hình nghiệp vụ cơ bản: Dashboard, Mentions, Alerts, Reports.

---

### Nhóm 8 — Merge, fix và responsive

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 34 | `12786e9` | `merge code cuar Tan` | Merge code của thành viên Tân vào nhánh đang phát triển. Message cho thấy đây là bước hợp nhất phần Dashboard/UI do Tân phụ trách. | Merge |
| 35 | `863ddb2` | `fix` | Sửa lỗi chung sau quá trình merge/cập nhật giao diện. Không đủ dữ liệu để kết luận lỗi cụ thể. | Fix |
| 36 | `679d2be` | `responsive` | Cập nhật responsive để giao diện hiển thị tốt hơn trên nhiều kích thước màn hình. Đây là bước quan trọng để app dùng được trên desktop và mobile/tablet. | Responsive UI |
| 37 | `8617b75` | `Merge branch 'minh-login' into ThuHaTest` | Merge nhánh login vào `ThuHaTest`, đồng bộ phần auth/session với các màn hình giao diện khác. | Merge / Auth |
| 38 | `6f514ac` | `Merge pull request #3 from TXHoai2309/minh-login` | Merge PR từ nhánh `minh-login` vào main. Đây là mốc đưa các cập nhật login/session mới nhất vào nhánh chính. | Merge / Auth |
| 39 | `59a5dfb` | `Hoài sửa lỗi vercel` | Sửa lỗi build/deploy trên Vercel. Commit này giúp dự án có khả năng build/deploy ổn định hơn sau khi tích hợp nhiều màn hình và TypeScript. | Deploy / Build fix |

#### Kết quả đạt được

- Code từ các nhánh thành viên được hợp nhất.
- Giao diện được chỉnh responsive.
- Login/session được merge lại vào main.
- Lỗi Vercel được xử lý để phục vụ deploy/demo.

---

## 2026-06-19 — Đưa dữ liệu lên giao diện, hiệu chỉnh AI, sửa type/data và merge hoàn thiện

### Nhóm 9 — Dọn file mẫu và đưa dữ liệu lên Mentions

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 40 | `91ebd85` | `Delete file html giao diện mẫu` | Xóa file HTML giao diện mẫu không còn dùng. Điều này giúp repo tránh lẫn giữa prototype tĩnh và code app chính thức. | Cleanup |
| 41 | `f0ca5f3` | `đẩy dữ liệu lên mention` | Đưa dữ liệu lên trang Mentions. Đây là bước chuyển Mentions từ layout tĩnh sang màn hình có dữ liệu hiển thị. | Mentions data |
| 42 | `99095b2` | `update information` | Cập nhật phần thông tin/information. Có thể liên quan đến nội dung giới thiệu, trang thông tin hoặc metadata hiển thị trong app. | Information content |

#### Kết quả đạt được

- Loại bỏ file mẫu không còn cần thiết.
- Mentions bắt đầu có dữ liệu hiển thị thay vì chỉ có layout.
- Nội dung information được cập nhật để sản phẩm đầy đủ hơn.

---

### Nhóm 10 — Hiệu chỉnh phân tích AI và dữ liệu Dashboard

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 43 | `d829027` | `Hiệu chỉnh phân tích AI` | Cập nhật phần phân tích AI. Trong phạm vi repo hiện tại, ghi nhận đây là hiệu chỉnh logic/hiển thị AI ở frontend hoặc dữ liệu phân tích, chưa kết luận là đã có backend/model production hoàn chỉnh. | AI analysis |
| 44 | `a3c1cfa` | `add data tren trang dashboard` | Đưa dữ liệu lên Dashboard. Đây là bước giúp Dashboard hiển thị chỉ số cụ thể thay vì chỉ là giao diện tĩnh. | Dashboard data |
| 45 | `73b9030` | `Merge branch 'minh-mention' into dashboard` | Merge nhánh Mentions vào Dashboard, đồng bộ phần dữ liệu/logic Mentions với màn hình Dashboard. | Merge / Dashboard + Mentions |
| 46 | `ed6c744` | `Merge branch 'dashboard'` | Merge nhánh Dashboard, đưa các cập nhật dữ liệu/giao diện Dashboard vào nhánh chính hoặc nhánh tích hợp. | Merge / Dashboard |

#### Kết quả đạt được

- Phần phân tích AI được hiệu chỉnh ở mức app hiện tại.
- Dashboard bắt đầu hiển thị dữ liệu.
- Mentions và Dashboard được đồng bộ thông qua merge.
- Sản phẩm tiến gần hơn tới bản demo có dữ liệu thật/mock-data thay vì chỉ UI tĩnh.

---

### Nhóm 11 — Sửa lỗi type, field dữ liệu và merge các nhánh cuối

| Thứ tự | Commit | Nội dung commit | Diễn giải chi tiết | Phạm vi ảnh hưởng |
|---:|---|---|---|---|
| 47 | `1259ca0` | `Sửa lỗi marketting không có trong union type topic, poster_at bị thiếu trong 8 mack object` | Sửa lỗi TypeScript liên quan đến topic `marketting` không có trong union type `topic`. Đồng thời bổ sung field thời gian `poster_at`/`posted_at` bị thiếu trong 8 mock object. Đây là lỗi quan trọng vì có thể làm build thất bại hoặc dữ liệu hiển thị thiếu thông tin. | TypeScript / Data model / Build |
| 48 | `624edd0` | `Merge branch 'main' into ha-information` | Merge main vào nhánh `ha-information` để cập nhật nhánh information theo trạng thái mới nhất của main. | Merge |
| 49 | `94f27fa` | `Merge branch 'ThuHaTest'` | Merge nhánh `ThuHaTest`, đưa các cập nhật đã test hoặc giao diện liên quan vào nhánh tích hợp. | Merge |
| 50 | `b577dbc` | `Merge branch 'ha-information'` | Merge nhánh `ha-information`, hoàn tất việc đưa phần information vào main. Đây là commit mới nhất trong chuỗi changelog hiện tại. | Merge / Information |

#### Kết quả đạt được

- Sửa lỗi type `topic`, tránh sai lệch giữa dữ liệu và kiểu dữ liệu trong code.
- Bổ sung field thời gian bị thiếu trong mock object, giúp dữ liệu mention/dashboard nhất quán hơn.
- Các nhánh `ha-information`, `ThuHaTest`, `dashboard`, `minh-mention` được hợp nhất dần về main.
- Main đạt trạng thái mới nhất với các phần Home, Auth, Dashboard, Mentions, Alerts, Reports, Information và dữ liệu hiển thị.

---

## Tổng hợp thay đổi theo module

### 1. Documentation

**Added**

- Thêm `CHANGELOG.md`.
- Bổ sung bộ tài liệu trong thư mục `docs`.
- Ghi nhận lịch sử thay đổi theo từng commit.

**Changed**

- Cập nhật changelog nhiều lần trong quá trình phát triển.
- Điều chỉnh tài liệu để phản ánh đúng tiến độ thực tế của repo.

---

### 2. Project Structure

**Added**

- Khởi tạo cấu trúc thư mục dự án.
- Tạo các file placeholder phục vụ phát triển ban đầu.
- Tách app web và tài liệu thành các khu vực riêng.

**Changed**

- Dọn file thừa sau giai đoạn khởi tạo.
- Cập nhật `.gitignore` để tránh commit các file không cần thiết.

---

### 3. Home / Landing Page

**Added**

- Xây dựng layout Home.
- Tạo điểm vào ban đầu cho người dùng khi truy cập web app.

**Fixed**

- Sửa bug layout Home sau bản dựng đầu.

---

### 4. Auth / Login / Logout

**Added**

- Bổ sung luồng login/logout.
- Có xử lý đăng xuất theo session.

**Changed**

- Merge Auth với Home và các nhánh giao diện khác.
- Đồng bộ luồng login vào main qua pull request.

**Fixed**

- Sửa xung đột merge liên quan đến Auth/Home.
- Sửa/hoàn thiện session logout.

---

### 5. Dashboard

**Added**

- Xây dựng giao diện Dashboard.
- Đưa dữ liệu lên Dashboard ở giai đoạn sau.

**Changed**

- Dashboard được merge nhiều lần từ nhánh chức năng vào main.
- Dashboard được đồng bộ với dữ liệu/logic từ Mentions.

**Result**

- Dashboard chuyển từ layout tĩnh sang màn hình có dữ liệu hiển thị.

---

### 6. Mentions

**Added**

- Xây dựng layout Mentions.
- Thêm dữ liệu hiển thị trên Mentions.
- Bổ sung layout cho các nút chức năng.

**Changed**

- Cập nhật layout Mentions sau bản đầu.
- Merge Mentions vào Dashboard để đồng bộ dữ liệu/luồng hiển thị.

**Fixed**

- Có các commit fix sau khi cập nhật layout Mentions, tuy nhiên message không mô tả chi tiết lỗi.

---

### 7. Alerts

**Added**

- Xây dựng layout Alerts.
- Mở rộng sản phẩm sang phần cảnh báo/rủi ro truyền thông.

**Result**

- InsightFlow có thêm màn hình phục vụ phát hiện và theo dõi cảnh báo.

---

### 8. Reports

**Added**

- Bổ sung/cập nhật phần Reports.
- Mở rộng sản phẩm từ theo dõi mention sang tổng hợp báo cáo.

**Result**

- Sản phẩm có thêm màn hình phục vụ báo cáo, phù hợp với bài toán media monitoring.

---

### 9. Information / Static Content

**Added / Changed**

- Cập nhật phần information.
- Merge nhánh `ha-information` vào main ở cuối lịch sử commit.

**Result**

- Nội dung giới thiệu/thông tin sản phẩm được bổ sung vào app.

---

### 10. AI Analysis

**Changed**

- Hiệu chỉnh phần phân tích AI.

**Note**

- Changelog chỉ ghi nhận đây là hiệu chỉnh AI trong phạm vi repo hiện tại. Không mô tả như hệ thống AI production hoàn chỉnh nếu chưa có commit/code thể hiện rõ backend/model training/deployment.

---

### 11. Responsive UI

**Changed**

- Cập nhật responsive cho giao diện.

**Result**

- App có khả năng hiển thị tốt hơn trên nhiều kích thước màn hình, hỗ trợ demo và trải nghiệm thực tế tốt hơn.

---

### 12. Build / Deploy / TypeScript

**Fixed**

- Sửa lỗi Vercel/build.
- Sửa lỗi union type `topic` khi dữ liệu có topic `marketting` nhưng type chưa khai báo.
- Sửa lỗi thiếu field thời gian trong 8 mock object.

**Result**

- Giảm lỗi khi build/deploy.
- Dữ liệu hiển thị nhất quán hơn với type trong code.
- Hạn chế lỗi runtime/build do thiếu field hoặc sai type.

---

## Tổng hợp theo loại thay đổi

### Added

- Cấu trúc repo InsightFlow.
- File changelog và tài liệu dự án.
- Layout Home.
- Login/logout.
- Dashboard UI.
- Mentions UI.
- Layout nút chức năng trên giao diện.
- Alerts UI.
- Reports UI.
- Dữ liệu hiển thị trên Mentions.
- Dữ liệu hiển thị trên Dashboard.
- Phần information/static content.

### Changed

- Cập nhật layout Home.
- Cập nhật layout Mentions.
- Cập nhật responsive.
- Cập nhật changelog.
- Hiệu chỉnh phần phân tích AI.
- Đồng bộ code giữa nhiều nhánh: `Tan-home`, `minh-login`, `Tan-dashboard`, `TXH`, `ThuHaTest`, `minh-mention`, `dashboard`, `ha-information`.

### Fixed

- Sửa bug layout Home.
- Sửa xung đột merge.
- Sửa session logout.
- Sửa lỗi sau các lần merge/cập nhật layout.
- Sửa lỗi Vercel/build.
- Sửa lỗi topic `marketting` không nằm trong union type.
- Sửa lỗi thiếu field thời gian trong mock object.
- Xóa file HTML giao diện mẫu không còn dùng.

---

## Trạng thái hiện tại sau commit mới nhất

Sau commit `b577dbc`, repo đã có nền tảng web app với các phần chính:

- Home / Landing page.
- Auth route cho đăng nhập/đăng xuất.
- Dashboard hiển thị dữ liệu.
- Mentions hiển thị dữ liệu đề cập.
- Alerts phục vụ cảnh báo.
- Reports phục vụ báo cáo.
- Các route phụ như Leads, Profile, Settings Brand, Ngành, Về chúng tôi ở mức app hiện tại.
- Tài liệu dự án trong thư mục `docs`.
- Cấu hình frontend sử dụng Next.js, React, Firebase, Chart.js/Recharts, Zustand và TailwindCSS.

---

## Ghi chú cho báo cáo/demo

Khi đưa vào báo cáo sprint hoặc demo, có thể gom các commit thành 5 mốc dễ trình bày hơn:

1. **Mốc 1 — Khởi tạo dự án**: tạo repo, cấu trúc thư mục, docs, changelog.
2. **Mốc 2 — Xây dựng UI nền tảng**: Home, Login/Logout, Dashboard.
3. **Mốc 3 — Mở rộng nghiệp vụ**: Mentions, Alerts, Reports, function buttons, responsive.
4. **Mốc 4 — Gắn dữ liệu và AI**: đưa dữ liệu lên Mentions/Dashboard, hiệu chỉnh phân tích AI.
5. **Mốc 5 — Ổn định demo/deploy**: sửa Vercel, sửa TypeScript, sửa field dữ liệu, merge các nhánh cuối.

File changelog trong repo nên giữ chi tiết commit như trên để truy vết; còn khi thuyết trình có thể dùng bản gom nhóm để dễ hiểu hơn.
