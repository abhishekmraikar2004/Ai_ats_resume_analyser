import dotenv from "dotenv";
dotenv.config();

const DEFAULT_ANALYSIS = {
  resume_skills: [],
  job_description_skills: [],
  missing_skills: {
    from_resume_for_job_description: [],
    from_job_description_for_resume: [],
  },
  ats_optimized_bullet_point_improvements: [],
  ats_optimization_tips: [],
  compatibility_score: 0,
  overall_assessment: "",
};

const normalizeAnalysis = (input = {}) => {
  const missingSkills = input.missing_skills || {};

  return {
    resume_skills: Array.isArray(input.resume_skills) ? input.resume_skills : [],
    job_description_skills: Array.isArray(input.job_description_skills)
      ? input.job_description_skills
      : [],
    missing_skills: {
      from_resume_for_job_description: Array.isArray(
        missingSkills.from_resume_for_job_description
      )
        ? missingSkills.from_resume_for_job_description
        : [],
      from_job_description_for_resume: Array.isArray(
        missingSkills.from_job_description_for_resume
      )
        ? missingSkills.from_job_description_for_resume
        : [],
    },
    ats_optimized_bullet_point_improvements: Array.isArray(
      input.ats_optimized_bullet_point_improvements
    )
      ? input.ats_optimized_bullet_point_improvements
      : [],
    ats_optimization_tips: Array.isArray(input.ats_optimization_tips)
      ? input.ats_optimization_tips
      : [],
    compatibility_score:
      typeof input.compatibility_score === "number"
        ? input.compatibility_score
        : Number(input.compatibility_score) || 0,
    overall_assessment:
      typeof input.overall_assessment === "string"
        ? input.overall_assessment
        : "",
  };
};

const buildPrompt = (resumeText, jobDescription) => `
You are an ATS resume analyzer.

Return STRICT JSON only.
Do not wrap in markdown.
Do not include backticks.
Do not include explanations.
Return ONLY the analysis object.

Use this exact schema:

{
  "resume_skills": [],
  "job_description_skills": [],
  "missing_skills": {
    "from_resume_for_job_description": [],
    "from_job_description_for_resume": []
  },
  "ats_optimized_bullet_point_improvements": [
    {
      "original_summary": "",
      "suggested_bullets": [],
      "reasoning": ""
    }
  ],
  "ats_optimization_tips": [],
  "compatibility_score": 0,
  "overall_assessment": ""
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

const extractJsonFromText = (text) => {
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Gemini response is not valid JSON");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
};

export const analyzeWithGemini = async (resumeText, jobDescription) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildPrompt(resumeText, jobDescription),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API Error:", data);
    throw new Error(
      data?.error?.message || "Gemini API request failed"
    );
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("No text returned from Gemini");
  }

  const parsed = extractJsonFromText(rawText);

  // Handles both:
  // 1) { ...analysis... }
  // 2) { success: true, analysis: { ...analysis... } }
  const analysis = parsed?.analysis ? parsed.analysis : parsed;

  return normalizeAnalysis(analysis);
};
