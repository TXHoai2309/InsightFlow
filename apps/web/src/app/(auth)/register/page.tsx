// apps/web/src/app/(auth)/register/page.tsx

import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký — InsightFlow",
  description: "Tạo tài khoản InsightFlow miễn phí và bắt đầu theo dõi thương hiệu của bạn",
};

export default function RegisterPage() {
  return <RegisterForm />;
}