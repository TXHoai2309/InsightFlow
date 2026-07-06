# Labeling Tool - Cac Sua Doi Da Thuc Hien

Tai lieu nay ghi lai cac thay doi chinh cua `labeling_tool` khi tich hop vao InsightFlow.

## Tich Hop Vao InsightFlow

- Them route rieng `/labeling_tool` de test va demo tool ma khong anh huong cac man hinh chinh.
- Dong bo giao dien voi layout InsightFlow: sidebar, header, light/dark mode va style control.
- Bo cac nut/phan khong can thiet trong ban demo rieng nhu chon person va load file local.
- Doi nut `Supabase` thanh `Tai data / Load data` de dung nghia thao tac hon.

## Load Du Lieu Tu Supabase

- Them load queue truc tiep tu Supabase theo nen tang.
- Ho tro cac nen tang: Facebook, Threads, TikTok, YouTube, Google Maps, BeFood, News.
- Ho tro chon so thread can tai moi lan.
- Ho tro hai che do:
  - `Can gan`: load cac assignment `unassigned` va `updated_review`.
  - `Da gan`: load cac assignment da hoan tat de xem lai/sua nhan.
- Them loading state ro rang khi dang tai data.

## Loc Theo Ngay

- Them bo loc ngay `Tu` va `Den`.
- Voi assignment kieu post, ngay loc dua tren `posts.posted_at`.
- Voi assignment kieu comment, ngay loc dua tren `comments.posted_at`.
- Mot post cu van co the hien ra neu trong post do co comment moi thuoc khoang ngay dang loc.
- Hien tai loc ngay co the cham voi khoang ngay rong vi tool phai quet assignment va doi chieu comment.

## Gan Nhan Va Sua Nhan

- Ghi nhan that vao bang `annotations`.
- Luu lich su sua nhan vao `annotation_revisions`.
- Ho tro xem lai cac item da gan va chinh sua nhan.
- Trang thai gan nhan cua tung item duoc xac dinh dua tren `annotations`, khong chi dua vao `labeling_assignments`.

## Queue Va Trang Thai

- `labeling_assignments` duoc giu vai tro dieu phoi queue/thread.
- `annotations` la nguon dung de biet item nao da co nhan that.
- Khi hoan tat mot thread, tool cap nhat cac assignment lien quan cua post sang `completed` hoac `skipped`.
- Da sua loi trung lap thread khi mot post co nhieu comment assignment.

## Thong Ke Trong Sidebar

- Bo phan hien thi phim tat trong sidebar.
- Them card `Hang cho toan bo` theo nen tang dang chon.
- Card hien:
  - Post chua gan
  - Comment chua gan
  - Post da gan
  - Comment da gan
  - Tong con lai
  - Tong da gan
  - Thread hoan tat
- Cac so trong card la thong ke toan bo theo nen tang, khong phu thuoc limit thread dang load.

## Import Va Sync Du Lieu

- Du lieu crawl duoc import vao SQLite truoc.
- Pipeline upsert post/comment theo khoa on dinh, khong dung URL lam ID.
- Du lieu cu duoc giu lai, metric moi duoc cap nhat va ghi vao lich su.
- Queue gan nhan chi tao/cap nhat cho du lieu moi hoac du lieu can xem lai.
- Supabase sync day cac bang can thiet tu SQLite len Supabase.

## Luu Y Van Hanh

- Khi chi test nhanh, nen de limit nho nhu 5 hoac 10 thread.
- Khi loc theo ngay, nen chon khoang ngay hep de tranh load cham.
- Khi can doi chieu nhan, xem bang `annotations`.
- Khi can doi chieu thread da hoan tat, xem bang `labeling_assignments`.
- Trong production, nen them cot ngay sap xep/loc truc tiep vao `labeling_assignments` de load nhanh hon.
