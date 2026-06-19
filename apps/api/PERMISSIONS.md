# EduPath AI Role-Based Access Control (RBAC) Permissions Mappings

This document describes the role permissions and allowed endpoints for all user groups: **GUEST**, **STUDENT**, **TEACHER**, **AFFILIATE**, and **ADMIN**.

---

## 1. Authentication & Common Endpoints

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `POST` | GUEST / Any | Authenticate with email & password |
| `/logout` | `POST` | Any | Clear user session / logout |
| `/auth/send-otp` | `POST` | GUEST / Any | Request OTP registration token |
| `/auth/resend-otp` | `POST` | GUEST / Any | Resend registration OTP code |
| `/auth/verify-otp-register` | `POST` | GUEST / Any | Verify OTP and create STUDENT/TEACHER account |
| `/auth/google` | `POST` | GUEST / Any | Google OAuth login / registration check |
| `/auth/google/complete-onboarding` | `POST` | GUEST / Any | Set role & finish Google onboarding |
| `/auth/register-affiliate` | `POST` | GUEST / Any | Direct registration for AFFILIATE role (pending) |
| `/auth/forgot-password` | `POST` | GUEST / Any | Forgot password email/OTP request |
| `/auth/verify-reset-otp` | `POST` | GUEST / Any | Verify password reset OTP |
| `/auth/reset-password` | `POST` | GUEST / Any | Set new password with reset token |
| `/auth/refresh` | `POST` | Any | Exchange refresh token for new access token |
| `/auth/me` | `GET` | STUDENT, TEACHER, AFFILIATE, ADMIN | Fetch current user info from token |
| `/auth/change-password` | `POST` | STUDENT, TEACHER, AFFILIATE, ADMIN | Update password (requires old password) |
| `/auth/role-change-request` | `POST` | STUDENT, TEACHER | Submit request to switch role (e.g. STUDENT <-> TEACHER) |

---

## 2. Student & Exam Endpoints

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/exams` | `GET` | Any | List available exams |
| `/exams/:id` | `GET` | Any | View details of an exam |
| `/exams/:id/questions` | `GET` | Any | Fetch questions for public/guest preview |
| `/exams/attempts` | `GET` | STUDENT, TEACHER, ADMIN | View exam attempts history |
| `/exams/attempts/:attemptId` | `GET` | STUDENT, TEACHER, ADMIN (Owner) | View detailed attempt result (ownsAttempt check) |
| `/exams/:id/attempts` | `POST` | STUDENT, TEACHER, ADMIN | Start new exam attempt |
| `/exams/:id/attempts/:attemptId/submit` | `POST` | STUDENT, TEACHER, ADMIN (Owner) | Submit completed exam attempt |
| `/exam-attempts/start` | `POST` | STUDENT, TEACHER, ADMIN | Start exam attempt (alternative endpoint) |
| `/exam-attempts/:attemptId/save-answer`| `POST` | STUDENT, TEACHER, ADMIN (Owner) | Autosave progress of selected answer |
| `/exam-attempts/:attemptId/submit` | `POST` | STUDENT, TEACHER, ADMIN (Owner) | Submit completed attempt (alternative) |
| `/exam-attempts/:attemptId/result` | `GET` | STUDENT, TEACHER, ADMIN (Owner) | Retrieve exam attempt details & scoring |
| `/exam-attempts/:attemptId/violation`| `POST` | STUDENT, TEACHER, ADMIN (Owner) | Log navigation violation events |
| `/exam-attempts/:attemptId/events` | `POST` | STUDENT, TEACHER, ADMIN (Owner) | Log student telemetry events |
| `/exam-attempts/:attemptId/ai-coach` | `POST` | STUDENT, TEACHER, ADMIN (Owner) | Ask AI Coach for hints/explanations |
| `/exams/:id/smart-retake` | `POST` | STUDENT, TEACHER, ADMIN | Generate a customized retake for weak topics |
| `/users/me/exam-history` | `GET` | STUDENT, TEACHER, ADMIN | View current student's performance charts |
| `/exams/wrong-questions` | `GET` | STUDENT, TEACHER, ADMIN | Fetch list of incorrect answers for review |
| `/enrollments` | `POST` | STUDENT | Purchase course using VNPay |
| `/enrollments/webhook` | `GET` | Public | VNPay payment IPN Callback |
| `/enrollments/status` | `GET` | STUDENT | Check enrollment status of a course |
| `/enrollments/sepay-webhook` | `POST` | Public | Sepay transaction webhook |
| `/users/pro-status` | `GET` | STUDENT | Check if user is PRO subscriber |

---

## 3. Teacher & Course Creation Endpoints

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/courses` | `GET` | Any | View list of courses |
| `/courses/:id` | `GET` | Any | View course description and syllabus |
| `/courses/:id/stats` | `GET` | Any | View public review stats |
| `/courses` | `POST` | TEACHER, ADMIN | Create a new course |
| `/courses/:id` | `PUT` | TEACHER, ADMIN (Owner) | Edit course metadata (ownsCourse check) |
| `/courses/:id` | `DELETE`| TEACHER, ADMIN (Owner) | Delete course (ownsCourse check) |
| `/lessons/:id` | `PUT` | TEACHER, ADMIN (Owner) | Edit lesson details (ownsLesson check) |
| `/lessons/:id` | `DELETE`| TEACHER, ADMIN (Owner) | Delete lesson (ownsLesson check) |
| `/exams/import` | `POST` | TEACHER, ADMIN | Import exam from file |
| `/exams/:id/status` | `PATCH` | TEACHER, ADMIN | Publish or archive an exam |
| `/teacher/materials` | `GET` | TEACHER | View uploaded materials & moderation status |
| `/teacher/materials` | `POST` | TEACHER | Upload document/media (uploadValidation check) |
| `/teacher/materials/:id` | `PUT` | TEACHER (Owner) | Edit uploaded document metadata |
| `/teacher/materials/:id` | `DELETE`| TEACHER (Owner) | Delete uploaded document and clean local disk |
| `/teacher/materials/:id/submit` | `POST` | TEACHER (Owner) | Send document to Admin moderation queue |

---

## 4. Affiliate Portal Endpoints

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/affiliate/track-click/:code` | `GET` | Public | Log referral link clicks & write cookies |
| `/affiliate/leaderboard` | `GET` | Public | Get top 10 affiliate ranking by total income |
| `/affiliate/me` | `GET` | AFFILIATE | Get own profile stats & balances |
| `/affiliate/me` | `PUT` | AFFILIATE | Edit bank credentials & tax IDs |
| `/affiliate/me/referrals` | `GET` | AFFILIATE | View referred user accounts (masked emails) |
| `/affiliate/me/commissions` | `GET` | AFFILIATE | View breakdown of commissions |
| `/affiliate/me/analytics` | `GET` | AFFILIATE | Retrieve last 30-day earnings chart |
| `/affiliate/me/payout-request` | `POST` | AFFILIATE | Cashout balance to bank (respects tier limits) |
| `/affiliate/me/materials` | `GET` | AFFILIATE | Get personal referral banners and text links |
| `/affiliate/me/materials/track` | `POST` | AFFILIATE | Log conversion clicks on materials |

---

## 5. Admin Console Endpoints

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/admin/role-change-requests` | `GET` | ADMIN | View pending role change requests |
| `/admin/role-change-requests/:id/review` | `POST` | ADMIN | Approve/Reject role switch and send emails |
| `/admin/exams/import` | `POST` | ADMIN | Superuser import exam papers |
| `/admin/stats` | `GET` | ADMIN | View system-wide revenue and metric indicators |
| `/admin/users` | `GET` | ADMIN | View and search all registered user profiles |
| `/admin/users/:id/ban` | `POST` | ADMIN | Ban or activate a user account |
| `/admin/leads` | `GET` | ADMIN | View CRM list for student consults |
| `/admin/leads` | `POST` | Any | Guest registration of consult request |
| `/admin/leads/:id/status` | `PUT` | ADMIN | Update CRM lead process status |
| `/admin/features` | `GET` | Any | Fetch state of system-wide Feature Flags |
| `/admin/features/:id/toggle` | `POST` | ADMIN | Toggle feature flags (maintenance mode, etc.) |
| `/admin/affiliates` | `GET` | ADMIN | View/filter affiliate accounts |
| `/admin/affiliates/:id/approve` | `POST` | ADMIN | Approve affiliate registration request |
| `/admin/affiliates/:id/reject` | `POST` | ADMIN | Reject affiliate, clear bank credentials, revert role |
| `/admin/affiliates/:id/tier` | `PUT` | ADMIN | Adjust affiliate tier (Bronze/Silver/Gold/Platinum) |
| `/admin/affiliates/:id/commission-rate` | `PUT` | ADMIN | Set custom percentage commission rate (0% - 100%) |
| `/admin/affiliates/payouts/pending`| `GET` | ADMIN | Get all payouts awaiting processing |
| `/admin/affiliates/payouts/:id/approve`| `POST` | ADMIN | Approve payout request & enter transaction ID |
| `/admin/affiliates/payouts/:id/reject`| `POST` | ADMIN | Reject payout request & refund balance |
| `/admin/affiliates/commissions/auto-approve`| `POST` | ADMIN | Cron trigger to auto-approve commissions older than 7 days |
| `/admin/materials/pending` | `GET` | ADMIN | View teacher materials awaiting moderation |
| `/admin/materials/:id/approve`| `POST` | ADMIN | Approve teacher material for public release |
| `/admin/materials/:id/reject`| `POST` | ADMIN | Reject teacher material, delete files and entry |
