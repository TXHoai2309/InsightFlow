export type Priority = "Khẩn cấp" | "Cao" | "Trung bình";
export type Status = "Chưa xử lý" | "Đang xử lý" | "Chờ phản hồi";

export interface OpsCase {
  id: string;
  title: string;
  description: string;
  platform: "tiktok" | "facebook" | "threads" | "zalo" | "web";
  brand: string;
  brandLogo: string;
  priority: Priority;
  time: string;
  assignee: string; // URL of avatar
  status: Status;
  isToday: boolean;
}

export const cases: OpsCase[] = [
  // Việc hôm nay
  {
    id: "1",
    title: "Video tiêu cực về sản phẩm của Mixue",
    description: "Tăng 320% lượt đề cập trong 2 giờ",
    platform: "tiktok",
    brand: "Mixue",
    brandLogo: "MX", // Text placeholder since we don't have images
    priority: "Khẩn cấp",
    time: "11:30",
    assignee: "https://i.pravatar.cc/150?u=1",
    status: "Chưa xử lý",
    isToday: true,
  },
  {
    id: "2",
    title: "Khách hàng phàn nàn về giao hàng chậm",
    description: "120 bình luận tiêu cực",
    platform: "facebook",
    brand: "Highlands Coffee",
    brandLogo: "HC",
    priority: "Cao",
    time: "10:45",
    assignee: "https://i.pravatar.cc/150?u=2",
    status: "Đang xử lý",
    isToday: true,
  },
  {
    id: "3",
    title: "Câu hỏi về chương trình khuyến mãi",
    description: "Đang nhận được nhiều tương tác",
    platform: "threads",
    brand: "The Coffee House",
    brandLogo: "TCH",
    priority: "Trung bình",
    time: "14:00",
    assignee: "https://i.pravatar.cc/150?u=3",
    status: "Chờ phản hồi",
    isToday: true,
  },
  {
    id: "4",
    title: "Bài viết tích cực về trải nghiệm sản phẩm",
    description: "Khách hàng khen ngợi chất lượng",
    platform: "facebook",
    brand: "Phúc Long",
    brandLogo: "PL",
    priority: "Trung bình",
    time: "15:30",
    assignee: "https://i.pravatar.cc/150?u=4",
    status: "Chưa xử lý",
    isToday: true,
  },
  {
    id: "5",
    title: "Influencer review sản phẩm mới",
    description: "Video đạt 2M lượt xem",
    platform: "tiktok",
    brand: "Trà Sữa Tocotoco",
    brandLogo: "TC",
    priority: "Cao",
    time: "16:00",
    assignee: "https://i.pravatar.cc/150?u=5",
    status: "Chưa xử lý",
    isToday: true,
  },
  // Việc tồn đọng (hôm qua)
  {
    id: "6",
    title: "Khách hàng chưa phản hồi",
    description: "8 khách hàng đang chờ phản hồi",
    platform: "facebook",
    brand: "Highlands Coffee",
    brandLogo: "HC",
    priority: "Cao",
    time: "Hôm qua",
    assignee: "https://i.pravatar.cc/150?u=6",
    status: "Chờ phản hồi",
    isToday: false,
  },
  {
    id: "7",
    title: "Vụ việc đang điều tra",
    description: "Nghi vấn về chất lượng sản phẩm",
    platform: "threads",
    brand: "Gong Cha",
    brandLogo: "GC",
    priority: "Cao",
    time: "Hôm qua",
    assignee: "https://i.pravatar.cc/150?u=7",
    status: "Đang xử lý",
    isToday: false,
  },
  {
    id: "8",
    title: "Ticket chưa đóng",
    description: "3 ticket cần cập nhật thông tin",
    platform: "facebook",
    brand: "Phúc Long",
    brandLogo: "PL",
    priority: "Trung bình",
    time: "Hôm qua",
    assignee: "https://i.pravatar.cc/150?u=8",
    status: "Chưa xử lý",
    isToday: false,
  }
];

export const PRIORITY_COLORS: Record<Priority, { text: string, bg: string, border: string }> = {
  "Khẩn cấp": { text: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
  "Cao": { text: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  "Trung bình": { text: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" }
};

export const STATUS_COLORS: Record<Status, { text: string, bg: string, border: string }> = {
  "Chưa xử lý": { text: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
  "Đang xử lý": { text: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  "Chờ phản hồi": { text: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" }
};

export const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "ti-brand-tiktok",
  facebook: "ti-brand-facebook",
  threads: "ti-brand-threads", // fallback or use something else if not exists, ti-at is close for threads
  zalo: "ti-messages",
  web: "ti-world"
};
