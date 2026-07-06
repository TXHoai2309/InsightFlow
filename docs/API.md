# InsightFlow API Documentation\n\nAPI specification placeholder\n
---

## Labeling Tool API va Supabase REST

Module `labeling_tool` hien tai doc/ghi du lieu qua Supabase REST API. Frontend goi truc tiep cac bang trong schema `public` bang `NEXT_PUBLIC_SUPABASE_URL` va `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong moi truong demo.

### Bang doc du lieu

- `posts`: lay noi dung bai viet, metadata, metric va trang thai crawl.
- `comments`: lay comment/reply cua tung post theo `platform + post_id`.
- `labeling_assignments`: lay queue can gan nhan va thread da hoan tat.
- `annotations`: lay nhan da gan de hien thi trang thai `Da gan`, xem lai va chinh sua.

### Bang ghi du lieu

- `annotations`: upsert nhan that cua tung post/comment.
- `annotation_revisions`: insert moi lan gan hoac sua nhan de luu lich su.
- `labeling_assignments`: update trang thai thread sang `completed` hoac `skipped` khi nguoi dung hoan tat.

### Khoa logic

- Post: `platform + post_id`.
- Comment: `platform + post_id + comment_id`.
- Annotation: `entity_key + assignee`.
- Assignment: `assignment_id`, dong thoi lien ket voi `entity_key`.

### Trang thai chinh

- `labeling_assignments.status`:
  - `unassigned`: chua dua vao hoan tat.
  - `updated_review`: du lieu da cap nhat, can xem lai.
  - `completed`: thread da hoan tat.
  - `skipped`: thread da bo qua.
- `annotations.status`:
  - `pending`: co nhan nhung chua du truong.
  - `completed`: nhan day du.
  - `skipped`: item bi bo qua.

### Luu y demo mode

Trong giai do demo, Supabase policy cho phep anon doc queue va ghi nhan. Khi dua vao production, nen dua viec ghi nhan qua backend da xac thuc bang Firebase/InsightFlow de tranh lo anon key va de audit nguoi thao tac.
