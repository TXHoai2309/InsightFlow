const fs = require('fs');
const path = require('path');

const localesDir = "c:\\Users\\ad\\Documents\\Word của thu hạ\\if\\InsightFlow\\apps\\web\\src\\locales";
const enPath = path.join(localesDir, 'en.json');
const viPath = path.join(localesDir, 'vi.json');

const updateJSON = (filePath, lang) => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.agentDashboard.mockData) {
    data.agentDashboard.mockData = {};
  }

  if (lang === 'en') {
    data.agentDashboard.mockData = {
      nextTasks: {
        t1: { title: "Negative video about Mixue", time: "20m left" },
        t2: { title: "Delivery complaint", time: "45m left" },
        t3: { title: "Promotion inquiry", time: "14:00" }
      },
      notifications: {
        n1: { title: "New customer", desc: "Nguyen Van A just registered for consultation.", time: "5 mins ago" },
        n2: { title: "Task assigned", desc: "Manager assigned you a new task.", time: "30 mins ago" },
        n3: { title: "Almost overdue", desc: "Task 'Confirm appointment' is expiring soon.", time: "1 hour ago" },
        n4: { title: "New reply", desc: "Customer B just replied to your message.", time: "2 hours ago" }
      },
      kanban: {
        k1: { title: "Negative video about Mixue", trend: "Up 320% mentions in 2 hours", time: "20m left" },
        k2: { title: "VIP customer complaint", trend: "No reply after 1 hour", time: "45m left" },
        k5: { title: "Handle 1-star storm", time: "08:30" },
        k6: { title: "Reply to VIP message", time: "10:15" },
        k7: { title: "Send service quote", time: "13:20" }
      },
      schedule: {
        s1: { title: "Reply morning customers", time: "09:00" },
        s2: { title: "Handle rising complaints", time: "10:30" },
        s3: { title: "Support promotion campaign", time: "14:00" },
        s4: { title: "Compile daily report", time: "16:00" }
      }
    };
  } else {
    data.agentDashboard.mockData = {
      nextTasks: {
        t1: { title: "Video tiêu cực Mixue", time: "Còn 20 phút" },
        t2: { title: "Khiếu nại giao hàng", time: "Còn 45 phút" },
        t3: { title: "Câu hỏi khuyến mãi", time: "14:00" }
      },
      notifications: {
        n1: { title: "Khách hàng mới", desc: "Nguyễn Văn A vừa đăng ký tư vấn.", time: "5 phút trước" },
        n2: { title: "Công việc được giao", desc: "Quản lý đã giao cho bạn 1 công việc mới.", time: "30 phút trước" },
        n3: { title: "Sắp quá hạn", desc: "Nhiệm vụ 'Xác nhận lịch hẹn' sắp hết hạn.", time: "1 giờ trước" },
        n4: { title: "Phản hồi mới", desc: "Khách hàng B vừa trả lời tin nhắn của bạn.", time: "2 giờ trước" }
      },
      kanban: {
        k1: { title: "Video tiêu cực về Mixue", trend: "Tăng 320% lượt đề cập trong 2 giờ", time: "Còn 20 phút" },
        k2: { title: "Khách hàng VIP khiếu nại", trend: "Chưa có phản hồi sau 1 tiếng", time: "Còn 45 phút" },
        k5: { title: "Xử lý bão 1 sao", time: "08:30" },
        k6: { title: "Trả lời tin nhắn khách VIP", time: "10:15" },
        k7: { title: "Gửi báo giá dịch vụ", time: "13:20" }
      },
      schedule: {
        s1: { title: "Trả lời khách hàng ca sáng", time: "09:00" },
        s2: { title: "Xử lý khiếu nại phát sinh", time: "10:30" },
        s3: { title: "Hỗ trợ chương trình khuyến mãi", time: "14:00" },
        s4: { title: "Tổng hợp báo cáo ngày", time: "16:00" }
      }
    };
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${filePath}`);
};

updateJSON(enPath, 'en');
updateJSON(viPath, 'vi');
