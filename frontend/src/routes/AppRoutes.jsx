import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import CreateInterview from "../pages/CreateInterview";
import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import ForgotPasswordPage from "../pages/ForgotPassword";
import ResetPasswordPage from "../pages/ResetPassword";
import VerifyEmailPage from "../pages/VerifyEmail";
import InterviewSession from "../pages/InterviewSession";
import Results from "../pages/Results";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RegisterPage initialMode="signin" />} />
      <Route path="/register" element={<RegisterPage initialMode="signup" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-interview" element={<CreateInterview />} />
      <Route path="/create" element={<CreateInterview />} />
      <Route path="/interview/:id" element={<InterviewSession />} />
      <Route path="/results/:id" element={<Results />} />
    </Routes>
  );
}

export default AppRoutes;
