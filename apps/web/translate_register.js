const fs = require('fs');

const viPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/vi.json';
const enPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/en.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newVi = {
  'auth.register.passwordWeak': 'Yếu',
  'auth.register.passwordMedium': 'Trung bình',
  'auth.register.passwordStrong': 'Mạnh',
  'auth.register.emailInUse': 'Tài khoản này đã tồn tại. Hãy quay lại đăng nhập.',
  'auth.register.invalidEmail': 'Email không hợp lệ.',
  'auth.register.weakPassword': 'Mật khẩu phải có ít nhất 6 ký tự.',
  'auth.register.tooManyRequests': 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
  'auth.register.nameRequired': 'Vui lòng nhập họ và tên.',
  'auth.register.passwordMismatch': 'Mật khẩu xác nhận không khớp.',
  'auth.register.registerFailed': 'Đăng ký thất bại. Vui lòng thử lại.',
  'auth.register.googleFailed': 'Đăng ký với Google thất bại.',
  'auth.register.title': 'Tạo tài khoản mới',
  'auth.register.subtitle': 'Bắt đầu hành trình phân tích dữ liệu của bạn ngay hôm nay.',
  'auth.register.nameLabel': 'Họ và tên',
  'auth.register.namePlaceholder': 'Nguyễn Văn A',
  'auth.register.emailLabel': 'Email',
  'auth.register.passwordLabel': 'Mật khẩu',
  'auth.register.confirmLabel': 'Xác nhận',
  'auth.register.registering': 'Đang tạo tài khoản...',
  'auth.register.registerBtn': 'Đăng ký',
  'auth.register.orRegisterWith': 'Hoặc đăng ký bằng',
  'auth.register.googleBtn': 'Đăng ký với Google',
  'auth.register.hasAccount': 'Đã có tài khoản?',
  'auth.register.loginNow': 'Đăng nhập ngay',
  'auth.register.heroTitle1': 'Khám phá sức mạnh của ',
  'auth.register.heroTitle2': 'dữ liệu thông minh',
  'auth.register.heroDesc': 'Tham gia cùng hàng nghìn chuyên gia đang tối ưu hóa quy trình làm việc và đưa ra quyết định dựa trên dữ liệu thực tế.',
  'auth.register.trustedBy': 'người dùng đã tin tưởng',
  'auth.register.footerCopyright': '© 2025 InsightFlow. Bảo lưu mọi quyền.',
  'auth.register.footerTerms': 'Điều khoản dịch vụ',
  'auth.register.footerPrivacy': 'Chính sách bảo mật',
  'auth.register.footerSupport': 'Trung tâm hỗ trợ'
};

const newEn = {
  'auth.register.passwordWeak': 'Weak',
  'auth.register.passwordMedium': 'Medium',
  'auth.register.passwordStrong': 'Strong',
  'auth.register.emailInUse': 'This account already exists. Please log in.',
  'auth.register.invalidEmail': 'Invalid email.',
  'auth.register.weakPassword': 'Password must be at least 6 characters.',
  'auth.register.tooManyRequests': 'Too many requests. Please try again later.',
  'auth.register.nameRequired': 'Please enter your full name.',
  'auth.register.passwordMismatch': 'Passwords do not match.',
  'auth.register.registerFailed': 'Registration failed. Please try again.',
  'auth.register.googleFailed': 'Google registration failed.',
  'auth.register.title': 'Create a new account',
  'auth.register.subtitle': 'Start your data analysis journey today.',
  'auth.register.nameLabel': 'Full Name',
  'auth.register.namePlaceholder': 'John Doe',
  'auth.register.emailLabel': 'Email',
  'auth.register.passwordLabel': 'Password',
  'auth.register.confirmLabel': 'Confirm Password',
  'auth.register.registering': 'Creating account...',
  'auth.register.registerBtn': 'Sign Up',
  'auth.register.orRegisterWith': 'Or sign up with',
  'auth.register.googleBtn': 'Sign up with Google',
  'auth.register.hasAccount': 'Already have an account?',
  'auth.register.loginNow': 'Log in now',
  'auth.register.heroTitle1': 'Discover the power of ',
  'auth.register.heroTitle2': 'smart data',
  'auth.register.heroDesc': 'Join thousands of professionals optimizing workflows and making data-driven decisions.',
  'auth.register.trustedBy': 'users trust us',
  'auth.register.footerCopyright': '© 2025 InsightFlow. All rights reserved.',
  'auth.register.footerTerms': 'Terms of Service',
  'auth.register.footerPrivacy': 'Privacy Policy',
  'auth.register.footerSupport': 'Support Center'
};

Object.assign(viData, newVi);
Object.assign(enData, newEn);

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

const targetFile = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/auth/RegisterForm.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

if (!content.includes('useTranslation')) {
  content = content.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter } from "next/navigation";\nimport { useTranslation } from "react-i18next";'
  );
}

if (!content.includes('const { t } = useTranslation();')) {
  content = content.replace(
    'const router = useRouter();',
    'const router = useRouter();\n  const { t } = useTranslation();'
  );
}

// Pass `t` to getPasswordStrength
content = content.replace(
  'function getPasswordStrength(pw: string): { label: string; color: string; width: string } {',
  'function getPasswordStrength(pw: string, t: any): { label: string; color: string; width: string } {'
);
content = content.replace(
  /return \{ label: "Yếu"/g,
  'return { label: t("auth.register.passwordWeak")'
);
content = content.replace(
  /return \{ label: "Trung bình"/g,
  'return { label: t("auth.register.passwordMedium")'
);
content = content.replace(
  /return \{ label: "Mạnh"/g,
  'return { label: t("auth.register.passwordStrong")'
);
content = content.replace(
  'const pwStrength = getPasswordStrength(password);',
  'const pwStrength = getPasswordStrength(password, t);'
);

content = content.replace(
  /"Tài khoản này đã tồn tại\. Hãy quay lại đăng nhập\."/g,
  't("auth.register.emailInUse")'
);
content = content.replace(/"Email không hợp lệ\."/g, 't("auth.register.invalidEmail")');
content = content.replace(/"Mật khẩu phải có ít nhất 6 ký tự\."/g, 't("auth.register.weakPassword")');
content = content.replace(/"Quá nhiều yêu cầu\. Vui lòng thử lại sau\."/g, 't("auth.register.tooManyRequests")');
content = content.replace(/"Vui lòng nhập họ và tên\."/g, 't("auth.register.nameRequired")');
content = content.replace(/"Mật khẩu xác nhận không khớp\."/g, 't("auth.register.passwordMismatch")');
content = content.replace(/"Đăng ký thất bại\. Vui lòng thử lại\."/g, 't("auth.register.registerFailed")');
content = content.replace(/"Đăng ký với Google thất bại\."/g, 't("auth.register.googleFailed")');

content = content.replace(
  />\s*Khám phá sức mạnh của\{" "\}\s*<span className="text-\[#4648d4\]">dữ liệu thông minh<\/span>\.\s*<\/h2>/g,
  '>{t("auth.register.heroTitle1")} <span className="text-[#4648d4]">{t("auth.register.heroTitle2")}</span>.</h2>'
);
content = content.replace(
  />\s*Tham gia cùng hàng nghìn chuyên gia đang tối ưu hóa quy trình làm việc và đưa ra quyết định dựa trên dữ liệu thực tế\.\s*</g,
  '>{t("auth.register.heroDesc")}<'
);
content = content.replace(
  />\s*<span className="font-bold text-\[#111c2d\]">\+10,000<\/span> người dùng đã tin tưởng\s*<\/p>/g,
  '><span className="font-bold text-[#111c2d]">+10,000</span> {t("auth.register.trustedBy")}</p>'
);

content = content.replace(
  />\s*Tạo tài khoản mới\s*</g,
  '>{t("auth.register.title")}<'
);
content = content.replace(
  />\s*Bắt đầu hành trình phân tích dữ liệu của bạn ngay hôm nay\.\s*</g,
  '>{t("auth.register.subtitle")}<'
);
content = content.replace(
  />\s*Họ và tên\s*<\/label>/g,
  '>{t("auth.register.nameLabel")}</label>'
);
content = content.replace(
  /placeholder="Nguyễn Văn A"/g,
  'placeholder={t("auth.register.namePlaceholder")}'
);
content = content.replace(
  />\s*Email\s*<\/label>/g,
  '>{t("auth.register.emailLabel")}</label>'
);
content = content.replace(
  />\s*Mật khẩu\s*<\/label>/g,
  '>{t("auth.register.passwordLabel")}</label>'
);
content = content.replace(
  />\s*Xác nhận\s*<\/label>/g,
  '>{t("auth.register.confirmLabel")}</label>'
);
content = content.replace(
  />Đang tạo tài khoản\.\.\.<\/span>/g,
  '>{t("auth.register.registering")}</span>'
);
content = content.replace(
  />Đăng ký<\/span>/g,
  '>{t("auth.register.registerBtn")}</span>'
);
content = content.replace(
  />\s*Hoặc đăng ký bằng\s*<\/span>/g,
  '>{t("auth.register.orRegisterWith")}</span>'
);
content = content.replace(
  /Đăng ký với Google\s*<\/button>/g,
  '{t("auth.register.googleBtn")}</button>'
);
content = content.replace(
  /Đã có tài khoản\?\s*\{" "\}/g,
  '{t("auth.register.hasAccount")} {" "}'
);
content = content.replace(
  />\s*Đăng nhập ngay\s*</g,
  '>{t("auth.register.loginNow")}<'
);
content = content.replace(
  />\s*© 2025 InsightFlow\. Bảo lưu mọi quyền\.\s*</g,
  '>{t("auth.register.footerCopyright")}<'
);

content = content.replace(
  /\["Điều khoản dịch vụ", "Chính sách bảo mật", "Trung tâm hỗ trợ"\]\.map\(\(label\)/g,
  '[t("auth.register.footerTerms"), t("auth.register.footerPrivacy"), t("auth.register.footerSupport")].map((label)'
);

// We also have to fix FIREBASE_ERRORS array, which is defined outside the component.
// We can't use `t` outside the component, so we will pass `t` when resolving the error.
content = content.replace(
  'const FIREBASE_ERRORS: Record<string, string> = {',
  'const FIREBASE_ERRORS_KEYS: Record<string, string> = {'
);
content = content.replace(
  /"Tài khoản này đã tồn tại\. Hãy quay lại đăng nhập\."/g,
  '"auth.register.emailInUse"'
);
content = content.replace(/"Email không hợp lệ\."/g, '"auth.register.invalidEmail"');
content = content.replace(/"Mật khẩu phải có ít nhất 6 ký tự\."/g, '"auth.register.weakPassword"');
content = content.replace(/"Quá nhiều yêu cầu\. Vui lòng thử lại sau\."/g, '"auth.register.tooManyRequests"');

content = content.replace(
  'FIREBASE_ERRORS\\[err\\.code\\] \\?\\?',
  'FIREBASE_ERRORS_KEYS[err.code] ? t(FIREBASE_ERRORS_KEYS[err.code]) :'
);

fs.writeFileSync(targetFile, content);
console.log('RegisterForm translated');
