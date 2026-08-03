import React, { useState } from 'react';
import { 
  FaBriefcase, 
  FaGraduationCap, 
  FaCogs, 
  FaListOl, 
  FaUserTie, 
  FaTags, 
  FaRocket,
  FaExclamationTriangle
} from 'react-icons/fa';
import '../styles/CreateInterview.css';
import { useNavigate } from 'react-router-dom';
import { startInterview } from '../api/interviewApi';
import { getToken } from '../utils/auth';
import { SkeletonFormOverlay } from '../components/Skeletons';

export default function CreateInterview() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jobRole: '',
    experienceLevel: '',
    difficulty: '',
    numQuestions: '',
    interviewType: '',
    additionalSkills: '',
  });

  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error dynamically as the user types/selects
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.jobRole.trim()) newErrors.jobRole = 'Job role is required';
    if (!formData.experienceLevel) newErrors.experienceLevel = 'Please select your experience level';
    if (!formData.difficulty) newErrors.difficulty = 'Please select a difficulty level';
    if (!formData.numQuestions) newErrors.numQuestions = 'Please select the number of questions';
    if (!formData.interviewType) newErrors.interviewType = 'Please select an interview type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (validate()) {
      handleStart();
    }
  };

  const handleStart = async () => {
    const token = getToken();
    if (!token) {
      alert("You are not logged in! Redirecting to login page...");
      navigate("/login");
      return;
    }
    try {
      setIsGenerating(true);
      setApiError(null);
      const response = await startInterview(formData);
      console.log("Interview created successfully!", response.data);
      navigate(`/interview/${response.data._id}`);
    } catch (err) {
      console.error("Failed to generate interview:", err);
      setApiError(
        err.response?.data?.message || err.message || "Failed to generate interview questions. Please try again."
      );
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return <SkeletonFormOverlay />;
  }

  return (
    <div className="interview-container">
      <div className="interview-card">
        <header className="interview-header">
          <h1>Create New AI Mock Interview</h1>
          <p>Configure your interview and let AI generate personalized interview questions.</p>
        </header>

        {apiError && (
          <div className="error-detail-text" style={{ marginBottom: "1.5rem" }}>
            <FaExclamationTriangle style={{ marginRight: "0.5rem" }} />
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="interview-form" noValidate>
          {/* Job Role */}
          <div className="form-group">
            <label htmlFor="jobRole">
              <FaBriefcase className="input-icon" /> Job Role <span className="required">*</span>
            </label>
            <input
              type="text"
              id="jobRole"
              name="jobRole"
              value={formData.jobRole}
              onChange={handleChange}
              placeholder="e.g. Frontend Developer"
              className={errors.jobRole ? 'input-error' : ''}
            />
            {errors.jobRole && <span className="error-message">{errors.jobRole}</span>}
          </div>

          {/* Grid Layout for Row 1 */}
          <div className="form-row">
            {/* Experience Level */}
            <div className="form-group">
              <label htmlFor="experienceLevel">
                <FaGraduationCap className="input-icon" /> Experience Level <span className="required">*</span>
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className={errors.experienceLevel ? 'input-error' : ''}
              >
                <option value="">Select Experience</option>
                <option value="Fresher">Fresher</option>
                <option value="0-1 Years">0-1 Years</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
              {errors.experienceLevel && <span className="error-message">{errors.experienceLevel}</span>}
            </div>

            {/* Difficulty */}
            <div className="form-group">
              <label htmlFor="difficulty">
                <FaCogs className="input-icon" /> Difficulty <span className="required">*</span>
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className={errors.difficulty ? 'input-error' : ''}
              >
                <option value="">Select Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              {errors.difficulty && <span className="error-message">{errors.difficulty}</span>}
            </div>
          </div>

          {/* Grid Layout for Row 2 */}
          <div className="form-row">
            {/* Number of Questions */}
            <div className="form-group">
              <label htmlFor="numQuestions">
                <FaListOl className="input-icon" /> Number of Questions <span className="required">*</span>
              </label>
              <select
                id="numQuestions"
                name="numQuestions"
                value={formData.numQuestions}
                onChange={handleChange}
                className={errors.numQuestions ? 'input-error' : ''}
              >
                <option value="">Select Count</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
              {errors.numQuestions && <span className="error-message">{errors.numQuestions}</span>}
            </div>

            {/* Interview Type */}
            <div className="form-group">
              <label htmlFor="interviewType">
                <FaUserTie className="input-icon" /> Interview Type <span className="required">*</span>
              </label>
              <select
                id="interviewType"
                name="interviewType"
                value={formData.interviewType}
                onChange={handleChange}
                className={errors.interviewType ? 'input-error' : ''}
              >
                <option value="">Select Type</option>
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
                <option value="Mixed">Mixed</option>
              </select>
              {errors.interviewType && <span className="error-message">{errors.interviewType}</span>}
            </div>
          </div>

          {/* Additional Skills */}
          <div className="form-group">
            <label htmlFor="additionalSkills">
              <FaTags className="input-icon" /> Additional Skills / Keywords
            </label>
            <textarea
              id="additionalSkills"
              name="additionalSkills"
              value={formData.additionalSkills}
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB, Express..."
              rows="3"
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn">
            <FaRocket className="btn-icon" /> Generate Interview
          </button>
        </form>
      </div>
    </div>
  );
};