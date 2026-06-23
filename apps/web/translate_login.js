const fs = require('fs');

const viPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/vi.json';
const enPath = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/locales/en.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newVi = {
  'auth.errors.userNotFound': 'Email không tồn tại.',
  'auth.errors.wrongPassword': 'Mật khẩu không đúng.',
  'auth.errors.invalidCredential': 'Email hoặc mật khẩu không đúng.',
  'auth.errors.tooManyRequests': 'Quá nhiều lần thử. Vui lòng thử lại sau.',
  'auth.errors.loginFailed': 'Đăng nhập thất bại. Vui lòng thử lại.',
  'auth.errors.googleNotEnabled': 'Đăng nhập bằng Google chưa được bật trong Firebase Console.',
  'auth.errors.popupBlocked': 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng bật lại.',
  'auth.errors.googleFailed': 'Đăng nhập Google thất bại: ',
  'auth.errors.unknown': 'Lỗi không xác định',
  'auth.errors.facebookNotEnabled': 'Đăng nhập bằng Facebook chưa được bật trong Firebase Console.',
  'auth.errors.facebookFailed': 'Đăng nhập Facebook thất bại: ',
  'auth.login.welcome': 'Chào mừng trở lại',
  'auth.login.subtitle': 'Đăng nhập để tiếp tục phân tích dữ liệu của bạn',
  'auth.login.googleBtn': 'Đăng nhập với Google',
  'auth.login.orLoginWith': 'Hoặc đăng nhập với',
  'auth.login.emailLabel': 'Email',
  'auth.login.passwordLabel': 'Mật khẩu',
  'auth.login.loggingIn': 'Đang đăng nhập...',
  'auth.login.loginBtn': 'Đăng nhập',
  'auth.login.forgotPassword': 'Quên mật khẩu?',
  'auth.login.noAccount': 'Chưa có tài khoản?',
  'auth.login.registerNow': 'Đăng ký ngay',
  'auth.system.statusNormal': 'Hệ thống: Hoạt động bình thường'
};

const newEn = {
  'auth.errors.userNotFound': 'Email not found.',
  'auth.errors.wrongPassword': 'Incorrect password.',
  'auth.errors.invalidCredential': 'Invalid email or password.',
  'auth.errors.tooManyRequests': 'Too many attempts. Please try again later.',
  'auth.errors.loginFailed': 'Login failed. Please try again.',
  'auth.errors.googleNotEnabled': 'Google login is not enabled in Firebase Console.',
  'auth.errors.popupBlocked': 'Browser blocked the popup. Please allow it.',
  'auth.errors.googleFailed': 'Google login failed: ',
  'auth.errors.unknown': 'Unknown error',
  'auth.errors.facebookNotEnabled': 'Facebook login is not enabled in Firebase Console.',
  'auth.errors.facebookFailed': 'Facebook login failed: ',
  'auth.login.welcome': 'Welcome back',
  'auth.login.subtitle': 'Log in to continue analyzing your data',
  'auth.login.googleBtn': 'Continue with Google',
  'auth.login.orLoginWith': 'Or log in with',
  'auth.login.emailLabel': 'Email',
  'auth.login.passwordLabel': 'Password',
  'auth.login.loggingIn': 'Logging in...',
  'auth.login.loginBtn': 'Log in',
  'auth.login.forgotPassword': 'Forgot password?',
  'auth.login.noAccount': 'Don\'t have an account?',
  'auth.login.registerNow': 'Sign up now',
  'auth.system.statusNormal': 'System: Operating normally'
};

Object.assign(viData, newVi);
Object.assign(enData, newEn);

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

const targetFile = 'd:/baitap/InsightFlow/InsightFlow/apps/web/src/components/auth/LoginForm.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Add import if not exists
if (!content.includes('useTranslation')) {
  content = content.replace(
    'import { useState } from "react";',
    'import { useState } from "react";\nimport { useTranslation } from "react-i18next";'
  );
}

// Add hook instance
if (!content.includes('const { t } = useTranslation();')) {
  content = content.replace(
    'const router = useRouter();',
    'const router = useRouter();\n  const { t } = useTranslation();'
  );
}

content = content.replace(/"Email không tồn tại\."/g, 't("auth.errors.userNotFound")');
content = content.replace(/"Mật khẩu không đúng\."/g, 't("auth.errors.wrongPassword")');
content = content.replace(/"Email hoặc mật khẩu không đúng\."/g, 't("auth.errors.invalidCredential")');
content = content.replace(/"Quá nhiều lần thử\. Vui lòng thử lại sau\."/g, 't("auth.errors.tooManyRequests")');
content = content.replace(/"Đăng nhập thất bại\. Vui lòng thử lại\."/g, 't("auth.errors.loginFailed")');

content = content.replace(/"Đăng nhập bằng Google chưa được bật trong Firebase Console\."/g, 't("auth.errors.googleNotEnabled")');
content = content.replace(/"Trình duyệt đã chặn cửa sổ bật lên\. Vui lòng bật lại\."/g, 't("auth.errors.popupBlocked")');
content = content.replace(/"Đăng nhập Google thất bại: "/g, 't("auth.errors.googleFailed")');
content = content.replace(/"Lỗi không xác định"/g, 't("auth.errors.unknown")');

content = content.replace(/"Đăng nhập bằng Facebook chưa được bật trong Firebase Console\."/g, 't("auth.errors.facebookNotEnabled")');
content = content.replace(/"Đăng nhập Facebook thất bại: "/g, 't("auth.errors.facebookFailed")');

content = content.replace(
  />\s*Chào mừng trở lại\s*</g,
  '>{t("auth.login.welcome")}<'
);
content = content.replace(
  />\s*Đăng nhập để tiếp tục phân tích dữ liệu của bạn\s*</g,
  '>{t("auth.login.subtitle")}<'
);
content = content.replace(
  />Đăng nhập với Google</g,
  '>{t("auth.login.googleBtn")}<'
);
content = content.replace(
  />\s*Hoặc đăng nhập với\s*</g,
  '>{t("auth.login.orLoginWith")}<'
);
content = content.replace(
  />\s*Email\s*<\/label>/g,
  '>{t("auth.login.emailLabel")}</label>'
);
content = content.replace(
  />\s*Mật khẩu\s*<\/label>/g,
  '>{t("auth.login.passwordLabel")}</label>'
);
content = content.replace(
  />Đang đăng nhập\.\.\.</g,
  '>{t("auth.login.loggingIn")}<'
);
content = content.replace(
  />Đăng nhập</g,
  '>{t("auth.login.loginBtn")}<'
);
content = content.replace(
  />\s*Quên mật khẩu\?\s*</g,
  '>{t("auth.login.forgotPassword")}<'
);
content = content.replace(
  /Chưa có tài khoản\?\s*\{" "\}/g,
  '{t("auth.login.noAccount")} {" "}'
);
content = content.replace(
  />\s*Đăng ký ngay\s*</g,
  '>{t("auth.login.registerNow")}<'
);
content = content.replace(
  />Hệ thống: Hoạt động bình thường</g,
  '>{t("auth.system.statusNormal")}<'
);

fs.writeFileSync(targetFile, content);
console.log('LoginForm translated');
