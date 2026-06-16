// apps/web/src/app/(auth)/login/page.tsx

import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập — InsightFlow",
  description: "Đăng nhập vào InsightFlow để theo dõi và phân tích thương hiệu của bạn",
};

export default function LoginPage() {
  return <LoginForm />;
}