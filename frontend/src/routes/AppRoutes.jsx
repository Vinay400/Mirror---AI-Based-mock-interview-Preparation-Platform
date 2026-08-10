import React from 'react'; // Note: Capitalized 'React' just to keep it standard
import { Routes, Route } from 'react-router-dom'; // Keep this as Route
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import CreateInterview from "../pages/CreateInterview";
import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import InterviewSession from "../pages/InterviewSession";
import Results from "../pages/Results";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RegisterPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-interview" element={<CreateInterview />} />
      <Route path="/create" element={<CreateInterview />} />
      <Route path="/interview/:id" element={<InterviewSession />} />
      <Route path="/results/:id" element={<Results />} />
    </Routes>
  );
}

export default AppRoutes;