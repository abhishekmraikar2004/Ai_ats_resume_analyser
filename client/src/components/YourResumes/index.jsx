import React, { useState } from "react";
import "./index.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const YourResumes = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError("");
  };

  const handleUploadAndAnalyze = async () => {
    try {
      if (!selectedFile) {
        setError("Please upload a resume.");
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first.");
        return;
      }

      setLoading(true);
      setError("");

      // =========================
      // STEP 1 - UPLOAD RESUME
      // =========================

      const formData = new FormData();
      formData.append("resume", selectedFile);

      const uploadResponse = await fetch(
        `${API_BASE_URL}/resume/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Resume upload failed");
      }

      const uploadData = await uploadResponse.json();

      console.log("UPLOAD DATA:", uploadData);

      // =========================
      // STEP 2 - ANALYZE RESUME
      // =========================

      const analyzeResponse = await fetch(
        `${API_BASE_URL}/resume/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resumeText: uploadData.text,
            jobDescription: `
Junior Full Stack Developer

Requirements:
- React
- Node.js
- Express
- MongoDB
- REST APIs
- Git
- JavaScript
- HTML
- CSS
- Problem Solving
            `,
          }),
        }
      );

      if (!analyzeResponse.ok) {
        throw new Error("Resume analysis failed");
      }

      const analyzeData = await analyzeResponse.json();

      console.log("ANALYZE DATA:", analyzeData);

      // IMPORTANT FIX
      setAnalysisResult(analyzeData.analysis);

      setShowModal(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-container">
      <h2>ATS Resume Analyzer</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
      />

      <button
        onClick={handleUploadAndAnalyze}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>

      {error && (
        <p className="error-message">{error}</p>
      )}

      {analysisResult && (
        <button onClick={() => setShowModal(true)}>
          View Report
        </button>
      )}

      {showModal && analysisResult && (
        <div className="modal-overlay">
          <div className="modal">

            <h2>ATS Resume Analysis Report</h2>

            <p>
              <strong>Compatibility Score:</strong>{" "}
              {analysisResult.compatibility_score}%
            </p>

            <h3>Resume Skills</h3>
            <ul>
              {analysisResult.resume_skills?.map(
                (skill, index) => (
                  <li key={index}>{skill}</li>
                )
              )}
            </ul>

            <h3>Job Description Skills</h3>
            <ul>
              {analysisResult.job_description_skills?.map(
                (skill, index) => (
                  <li key={index}>{skill}</li>
                )
              )}
            </ul>

            <h3>Missing Skills</h3>
            <ul>
              {analysisResult.missing_skills?.from_job_description_for_resume?.map(
                (skill, index) => (
                  <li key={index}>{skill}</li>
                )
              )}
            </ul>

            <h3>ATS Optimization Tips</h3>
            <ul>
              {analysisResult.ats_optimization_tips?.map(
                (tip, index) => (
                  <li key={index}>{tip}</li>
                )
              )}
            </ul>

            <h3>Overall Assessment</h3>
            <p>{analysisResult.overall_assessment}</p>

            <button
              onClick={() => setShowModal(false)}
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default YourResumes;
