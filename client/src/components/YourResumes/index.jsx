import React, { useState } from "react";
import "./index.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const YourResumes = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
    setError("");
  };

  const handleUploadAndAnalyze = async () => {
    try {
      if (!selectedFile) {
        setError("Please select a resume to upload.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in.");
        return;
      }

      setLoading(true);
      setError("");
      setAnalysisResult(null);
      setShowModal(false);

      const formData = new FormData();
      formData.append("resume", selectedFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(errorText || "Resume upload failed.");
      }

      const uploadData = await uploadResponse.json();

      const analyzeResponse = await fetch(`${API_BASE_URL}/resume/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeText: uploadData.text,
          jobDescription:
            "Junior Full Stack Developer. We are looking for a motivated entry-level Full Stack Developer to join our engineering team. You will work on building and maintaining web applications using modern technologies. Requirements: Bachelor's degree in Computer Science or related field. Proficiency in HTML, CSS, JavaScript, and React. Experience with Node.js, Express, and REST APIs. Familiarity with MongoDB or any NoSQL database. Understanding of Git and version control. Strong problem-solving skills and attention to detail. Good communication and teamwork abilities. Nice to Have: Experience with TypeScript, Redux, or Next.js. Exposure to cloud platforms like AWS or Azure. Knowledge of CI/CD pipelines and Docker. Responsibilities: Develop and maintain responsive web applications. Build RESTful APIs and integrate with frontend components. Write clean, maintainable, and well-documented code. Collaborate with designers, product managers, and senior developers. Participate in code reviews and contribute to team best practices. Debug and resolve technical issues across the full stack.",
        }),
      });

      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        throw new Error(errorText || "Resume analysis failed.");
      }

      const analyzeData = await analyzeResponse.json();

      setAnalysisResult(analyzeData.analysis);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-container">
      <h2>Upload Your Resume</h2>

      <input type="file" accept=".pdf" onChange={handleFileChange} />

      <button onClick={handleUploadAndAnalyze} disabled={loading}>
        {loading ? "Processing..." : "Upload & Analyze"}
      </button>

      {analysisResult && (
        <button onClick={() => setShowModal(true)}>View Report</button>
      )}

      {showModal && analysisResult && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>ATS Resume Analysis Report</h2>

            <p>
              <strong>Compatibility Score:</strong>{" "}
              {analysisResult.compatibility_score ?? "N/A"}%
            </p>

            <h3>Resume Skills</h3>
            <ul>
              {analysisResult.resume_skills?.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>

            <h3>Job Description Skills</h3>
            <ul>
              {analysisResult.job_description_skills?.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>

            <h3>Missing Skills (Add to Resume)</h3>
            <ul>
              {analysisResult.missing_skills?.from_job_description_for_resume?.map(
                (skill, index) => <li key={index}>{skill}</li>
              )}
            </ul>

            <h3>Extra Skills (Not Required by Job)</h3>
            <ul>
              {analysisResult.missing_skills?.from_resume_for_job_description?.map(
                (skill, index) => <li key={index}>{skill}</li>
              )}
            </ul>

            <h3>ATS Optimization Tips</h3>
            <ul>
              {analysisResult.ats_optimization_tips?.map((tip, index) => (
                <li key={index}>{tip.replace(/\*\*/g, "")}</li>
              ))}
            </ul>

            <h3>Bullet Point Improvements</h3>
            {analysisResult.ats_optimized_bullet_point_improvements?.map(
              (item, index) => (
                <div key={index} style={{ marginBottom: "15px" }}>
                  <p>
                    <strong>Original:</strong> {item.original_summary}
                  </p>
                  <p>
                    <strong>Reasoning:</strong> {item.reasoning}
                  </p>
                  <strong>Suggested Bullets:</strong>
                  <ul>
                    {item.suggested_bullets?.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              )
            )}

            <h3>Overall Assessment</h3>
            <p>{analysisResult.overall_assessment}</p>

            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default YourResumes;
