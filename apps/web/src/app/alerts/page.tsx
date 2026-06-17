"use client";

export default function AlertsPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-on-surface">Quản lý Cảnh báo Khủng hoảng</h1>
          <p className="text-base text-on-surface-variant mt-2 max-w-2xl">
            Giám sát chỉ số tiêu cực và cấu hình phản ứng tự động.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="glass-card rounded-xl p-6 flex flex-col gap-3">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
            Tổng cảnh báo hôm nay
          </span>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-on-surface">24</span>
            <span className="text-success text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">trending_down</span>
              -12%
            </span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 flex flex-col gap-3 border-l-4 border-error">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
            Cảnh báo khẩn cấp
          </span>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-error">03</span>
            <span className="bg-error-container text-on-error-container text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
              CẦN XỬ LÝ NGAY
            </span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 flex flex-col gap-3 border-l-4 border-success">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
            Hiệu suất phản hồi (SLA)
          </span>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-on-surface">1m 45s</span>
            <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-bold border border-success/20">
              Đạt chuẩn &lt; 3m
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-8 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl text-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Chọn Workspace: Highlands Coffee</option>
            <option>Phúc Long Coffee &amp; Tea</option>
            <option>The Coffee House</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl text-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Trạng thái: Mới</option>
            <option>Đã xác nhận</option>
            <option>Đã xử lý</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl text-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Mức độ: Tất cả</option>
            <option className="text-error font-bold">Critical (Khẩn cấp)</option>
            <option className="text-warning font-bold">High (Cao)</option>
            <option className="text-slate-700 font-bold">Medium (Trung bình)</option>
            <option className="text-success font-bold">Low (Thấp)</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl text-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Loại tín hiệu: Tất cả</option>
            <option>Spike mentions</option>
            <option>High-reach</option>
            <option>Sensitive topic</option>
          </select>
        </div>
        <button className="px-4 py-3 rounded-xl border border-outline-variant bg-white hover:bg-surface-container-low transition-all">
          <span className="material-symbols-outlined text-lg">filter_alt</span>
        </button>
      </div>

      <div className="space-y-6 mb-8">
        <div className="glass-card rounded-xl overflow-hidden hover:shadow-md transition-shadow border-l-4 border-error">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-error text-on-error text-[10px] font-bold px-2 py-1 rounded uppercase tracking-[0.22em]">CRITICAL</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-on-surface">Highlands Coffee</span>
                    <span className="bg-surface-variant text-[10px] font-bold px-2 py-1 rounded">Facebook</span>
                    <span className="bg-surface-variant text-[10px] font-bold px-2 py-1 rounded">TikTok</span>
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-on-surface">
                  Đột biến nhắc đến tiêu cực: Tăng 4.5x trong 15 phút
                </h2>
              </div>
              <span className="text-sm text-on-surface-variant">2 phút trước</span>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              Phát hiện sự gia tăng đột ngột của các bài đăng phàn nàn về chất lượng vệ sinh tại chi nhánh Quận 1. Đã tiếp cận 45k+ người.
            </p>
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-4 mb-6">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] border-b border-outline-variant pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                TOP 3 NỘI DUNG TIÊU BIỂU
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">public</span>
                  <p className="flex-1 truncate">"Vừa đi Highlands ở chi nhánh X thấy chuột chạy qua bàn..."</p>
                  <a className="text-primary hover:underline font-bold text-[12px]" href="#">Link</a>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">movie</span>
                  <p className="flex-1 truncate">Video TikTok của @ReviewFood phê bình thái độ nhân viên...</p>
                  <a className="text-primary hover:underline font-bold text-[12px]" href="#">Link</a>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                  <p className="flex-1 truncate">Thảo luận sôi nổi trong group "Hội Review Đồ Uống" (120 bình luận)...</p>
                  <a className="text-primary hover:underline font-bold text-[12px]" href="#">Link</a>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                <div className="flex items-center gap-1" title="Telegram: Thành công">
                  <span className="material-symbols-outlined text-[16px] text-success">send</span>
                  <span className="text-[10px] font-bold text-success">TG</span>
                </div>
                <div className="flex items-center gap-1" title="Email: Thành công">
                  <span className="material-symbols-outlined text-[16px] text-success">mail</span>
                  <span className="text-[10px] font-bold text-success">ML</span>
                </div>
                <div className="flex items-center gap-1" title="Zalo: Chờ gửi">
                  <span className="material-symbols-outlined text-[16px] text-outline">chat</span>
                  <span className="text-[10px] font-bold text-outline">ZL</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-xl border border-outline-variant text-sm text-on-surface hover:bg-surface-container-low transition-all">
                  Xác nhận
                </button>
                <button className="px-4 py-2 rounded-xl border border-primary text-primary text-sm hover:bg-primary/10 transition-all">
                  Xem xu hướng
                </button>
                <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm hover:opacity-90 transition-all">
                  Giải quyết
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden hover:shadow-md transition-shadow border-l-4 border-amber-500">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-[0.22em]">HIGH</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-on-surface">Phúc Long Tea</span>
                  <span className="bg-surface-variant text-[10px] font-bold px-2 py-1 rounded">TikTok</span>
                </div>
              </div>
              <span className="text-sm text-on-surface-variant">45 phút trước</span>
            </div>
            <h3 className="text-2xl font-semibold text-on-surface mb-3">
              KOL @HoangMedia chia sẻ nội dung so sánh tiêu cực: Tiếp cận 150k+
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Nội dung video có tính lan truyền cao, lượng share đạt 1.2k lượt trong 1 giờ.
            </p>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <div className="flex items-center gap-1" title="Telegram: Thành công">
                  <span className="material-symbols-outlined text-[16px] text-success">send</span>
                  <span className="text-[10px] font-bold text-success">TG</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-xl border border-outline-variant text-sm text-on-surface hover:bg-surface-container-low transition-all">
                  Xác nhận
                </button>
                <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm hover:opacity-90 transition-all">
                  Giải quyết
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-3 mb-6 border-b border-outline-variant pb-3">
          <span className="material-symbols-outlined text-primary">tune</span>
          <h2 className="text-2xl font-semibold text-on-surface">Cấu hình Ngưỡng (Thresholds) &amp; Phản ứng</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary text-2xl">bolt</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">Quy tắc Kích hoạt (Triggers)</p>
                <p className="text-xs text-on-surface-variant">Phát hiện đột biến và ngưỡng cảnh báo</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-on-surface">Phát hiện Đột biến (Spike %)</p>
                  <p className="text-sm font-bold text-primary">70%</p>
                </div>
                <input type="range" min="0" max="100" defaultValue={70} className="w-full h-2 rounded-full bg-surface-container accent-primary" />
                <p className="text-xs text-on-surface-variant italic">
                  Cảnh báo nếu lượng thảo luận tiêu cực tăng &gt;70% so với trung bình 3 ngày trước.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-on-surface">Ngưỡng tiếp cận tối thiểu (Reach)</p>
                  <p className="text-sm font-bold text-primary">50,000</p>
                </div>
                <input type="range" min="0" max="500000" defaultValue={50000} className="w-full h-2 rounded-full bg-surface-container accent-primary" />
                <p className="text-xs text-on-surface-variant italic">
                  Chỉ cảnh báo với các bài đăng từ KOL/User có tổng tiếp cận dự kiến trên 50k.
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant flex items-center justify-between">
                <p className="text-sm font-semibold text-on-surface">Từ khóa cấm (Sensitive Keywords)</p>
                <button className="text-sm font-semibold text-primary hover:underline">+ Thêm từ khóa</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Ngộ độc', 'Biểu tình', 'Tẩy chay'].map((keyword) => (
                  <span key={keyword} className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-2 text-sm text-on-surface border border-outline-variant">
                    {keyword}
                    <span className="material-symbols-outlined text-[14px] cursor-pointer">close</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary text-2xl">hub</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">Kênh thông báo (Channels)</p>
                <p className="text-xs text-on-surface-variant">Bật/tắt kênh cảnh báo real-time.</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  name: 'Telegram Bot',
                  description: 'Trạng thái: Hoạt động (ID: @IF_Bot)',
                  enabled: true,
                  icon: 'send',
                },
                {
                  name: 'Zalo OA',
                  description: 'Trạng thái: Chưa liên kết',
                  enabled: false,
                  icon: 'chat',
                },
                {
                  name: 'Email Digest',
                  description: 'Định kỳ: Mỗi 1 giờ',
                  enabled: true,
                  icon: 'mail',
                },
              ].map((channel) => (
                <div key={channel.name} className="flex items-center justify-between gap-4 p-4 rounded-3xl border border-outline-variant bg-surface-bright">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary text-xl">
                      <span className="material-symbols-outlined">{channel.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{channel.name}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{channel.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={channel.enabled} readOnly className="sr-only peer" />
                    <div className="w-11 h-6 bg-outline-variant rounded-full peer-checked:bg-primary peer-focus:outline-none relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-outline-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="px-8 py-3 rounded-xl font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-all">
            Hủy bỏ
          </button>
          <button className="px-8 py-3 rounded-xl font-semibold bg-primary text-on-primary shadow-soft hover:opacity-90 transition-all">
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
