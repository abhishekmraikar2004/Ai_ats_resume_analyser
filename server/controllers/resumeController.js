import { parseResume } from "../utils/resumeParser.js";
import { analyzeWithGemini } from "../utils/aiAnalyzer.js";

export const uploadResume = async (req, res) => {
  try {
    console.log("UPLOAD API CALLED");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const uint8Array = new Uint8Array(req.file.buffer);
    const text = await parseResume(uint8Array);

    console.log("EXTRACTED TEXT LENGTH:", text?.length);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "No text extracted from PDF",
      });
    }

    return res.status(200).json({
      success: true,
      preview: text.substring(0, 500),
      text,
    });
  } catch (err) {
    console.error("UPLOAD RESUME ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Failed to upload resume",
    });
  }
};

export const analyzeResume = async (req, res) => {
  try {
    console.log("ANALYZE API CALLED");

    const { resumeText, jobDescription } = req.body;

    console.log("RESUME TEXT:", resumeText?.substring(0, 200));
    console.log("JOB DESCRIPTION:", jobDescription?.substring(0, 200));

    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: "resumeText and jobDescription are required",
      });
    }

    const analysis = await analyzeWithGemini(resumeText, jobDescription);

    console.log(
      "FINAL ANALYSIS RESPONSE:",
      JSON.stringify(analysis, null, 2)
    );

    if (!analysis) {
      return res.status(500).json({
        success: false,
        message: "No analysis returned from Gemini",
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (err) {
    console.error("ANALYZE RESUME ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to analyze resume",
    });
  }
};
