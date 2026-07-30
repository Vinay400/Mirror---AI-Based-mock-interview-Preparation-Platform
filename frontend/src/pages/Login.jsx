import React, { useState } from 'react'; // FIX: Added missing useState import
import { useNavigate } from 'react-router-dom';
import { login } from "../api/authApi";
import { setToken } from "../utils/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


  const handleLogin = async () => {
    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });
      setToken(response.data.token);
      console.log("Logged in successfully!");
      alert(`Welcome back, ${formData.name || 'User'}!`);
      
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Please check your credentials.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Login / Register</h2>
   

        {/* Email Input */}
        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            style={styles.input}
          />
        </div>

        {/* Password Input */}
        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            style={styles.input}
          />
        </div>

        {/* Submit Button */}
        <button type="submit" style={styles.button}>
          Submit
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  form: { backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title: { textAlign: 'center', marginBottom: '2rem', color: '#333' },
  inputGroup: { marginBottom: '1.5rem' },
  label: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#555' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
};


export default LoginPage;