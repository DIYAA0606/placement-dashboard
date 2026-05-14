"""
PlacePrep — app.py
Flask backend: Resume Analyzer API
POST /analyze — accepts PDF + job description, returns JSON match results
"""

import os
import re
import uuid
import json
from flask import Flask, request, jsonify, send_from_directory,render_template

# PyPDF2 for PDF text extraction
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

app = Flask(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"pdf"}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH


# ── Skill Taxonomy ─────────────────────────────────────────────────────────────
# Comprehensive list of technical & soft skills used for matching.
# Keys are normalized lowercase; values are display names.
SKILL_TAXONOMY = {
    # Languages
    "python": "Python", "java": "Java", "javascript": "JavaScript",
    "typescript": "TypeScript", "c++": "C++", "c": "C",
    "c#": "C#", "go": "Go", "rust": "Rust", "kotlin": "Kotlin",
    "swift": "Swift", "ruby": "Ruby", "php": "PHP", "scala": "Scala",
    "r": "R", "matlab": "MATLAB",

    # Web / Frontend
    "html": "HTML", "css": "CSS", "react": "React", "vue": "Vue.js",
    "angular": "Angular", "next.js": "Next.js", "redux": "Redux",
    "graphql": "GraphQL", "rest": "REST APIs", "restful": "REST APIs",
    "bootstrap": "Bootstrap", "tailwind": "Tailwind CSS",

    # Backend / Frameworks
    "flask": "Flask", "django": "Django", "fastapi": "FastAPI",
    "spring": "Spring Boot", "express": "Express.js", "node": "Node.js",
    "nodejs": "Node.js", "node.js": "Node.js", "laravel": "Laravel",

    # Databases
    "sql": "SQL", "mysql": "MySQL", "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL", "mongodb": "MongoDB", "redis": "Redis",
    "sqlite": "SQLite", "oracle": "Oracle DB", "firebase": "Firebase",
    "cassandra": "Cassandra", "dynamodb": "DynamoDB",

    # Cloud / DevOps
    "aws": "AWS", "azure": "Azure", "gcp": "GCP", "docker": "Docker",
    "kubernetes": "Kubernetes", "terraform": "Terraform", "ci/cd": "CI/CD",
    "jenkins": "Jenkins", "github actions": "GitHub Actions",
    "linux": "Linux", "bash": "Bash/Shell",

    # ML / Data
    "machine learning": "Machine Learning", "deep learning": "Deep Learning",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch", "keras": "Keras",
    "scikit-learn": "Scikit-learn", "pandas": "Pandas", "numpy": "NumPy",
    "data analysis": "Data Analysis", "nlp": "NLP",
    "computer vision": "Computer Vision", "llm": "LLMs",

    # CS Core
    "data structures": "Data Structures", "algorithms": "Algorithms",
    "os": "Operating Systems", "operating systems": "Operating Systems",
    "dbms": "DBMS", "computer networks": "Computer Networks",
    "networking": "Networking", "oops": "OOP", "oop": "OOP",
    "object oriented": "OOP", "system design": "System Design",
    "distributed systems": "Distributed Systems",

    # Tools
    "git": "Git", "github": "GitHub", "jira": "Jira",
    "agile": "Agile", "scrum": "Scrum",

    # Soft Skills
    "communication": "Communication", "leadership": "Leadership",
    "problem solving": "Problem Solving", "teamwork": "Teamwork",
    "collaboration": "Collaboration",
}
SKILL_WEIGHTS = {

    "python": 3,
    "java": 3,
    "javascript": 3,
    "react": 3,
    "node": 3,
    "machine learning": 3,
    "ai": 3,

    "sql": 2,
    "mongodb": 2,
    "flask": 2,
    "docker": 2,
    "aws": 2,
    "git": 2,
    "github": 2,

    "html": 1,
    "css": 1,
    "communication": 1,
    "teamwork": 1,
    "agile": 1

}


# ── Helpers ────────────────────────────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(filepath: str) -> str:
    """
    Extract plain text from a PDF using PyPDF2.
    Returns empty string on failure (scanned PDFs, encrypted, etc.)
    """
    if PyPDF2 is None:
        return ""
    try:
        text_parts = []
        with open(filepath, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts).strip()
    except Exception:
        return ""


def normalize(text: str) -> str:
    """Lowercase and collapse whitespace for consistent matching."""
    return re.sub(r"\s+", " ", text.lower()).strip()


def extract_skills(text: str) -> set:
    """
    Find all known skills present in the given text.
    Returns a set of display names.
    """
    norm = normalize(text)
    found = set()

    # Sort by length descending so multi-word phrases match before subwords
    sorted_skills = sorted(SKILL_TAXONOMY.keys(), key=len, reverse=True)

    for key in sorted_skills:
        # Use word-boundary-aware regex to avoid partial matches
        pattern = r"(?<![a-z0-9])" + re.escape(key) + r"(?![a-z0-9])"
        if re.search(pattern, norm):
            found.add(SKILL_TAXONOMY[key])

    return found


def build_suggestions(missing: list, found: list, pct: int) -> list:
    """
    Generate actionable suggestions based on matched/missing skills.
    """
    suggestions = []

    if pct < 40:
        suggestions.append(
            "Your resume covers less than 40% of the required skills. "
            "Consider a significant revision to align it with this role."
        )
    elif pct < 65:
        suggestions.append(
            "You match several key skills but there are meaningful gaps. "
            "Prioritize bridging the missing skills with projects or certifications."
        )
    else:
        suggestions.append(
            "Strong match! Focus on quantifying your existing experience "
            "and tailoring your project descriptions to the JD language."
        )

    # Skill-specific suggestions
    if "System Design" in missing:
        suggestions.append(
            "System Design is required — study scalable architecture patterns "
            "(load balancing, caching, database sharding). Practice on Excalidraw."
        )
    if "Docker" in missing or "Kubernetes" in missing:
        suggestions.append(
            "Containerisation skills (Docker / Kubernetes) are expected. "
            "Add a Dockerized project to your GitHub to demonstrate this."
        )
    if any(s in missing for s in ["Machine Learning", "Deep Learning", "TensorFlow", "PyTorch"]):
        suggestions.append(
            "ML/AI skills are listed in the JD. Even a Kaggle project or "
            "a mini-ML pipeline on GitHub would strengthen your profile."
        )
    if "SQL" in missing or "PostgreSQL" in missing or "MySQL" in missing:
        suggestions.append(
            "SQL proficiency is expected. Practice queries on SQLZoo or "
            "LeetCode DB section and mention database experience in your resume."
        )
    if "AWS" in missing or "GCP" in missing or "Azure" in missing:
        suggestions.append(
            "Cloud experience is required. A free-tier AWS or GCP project "
            "with a deployment can demonstrate cloud familiarity."
        )
    if len(missing) > 5:
        suggestions.append(
            f"You're missing {len(missing)} skills from the JD. "
            "Focus on the top 3 most common ones first rather than trying to cover all at once."
        )

    if not suggestions:
        suggestions.append(
            "Tailor your resume bullet points to mirror the exact language "
            "used in the job description for better ATS pass-through."
        )

    return suggestions[:5]  # Cap at 5 suggestions


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    POST /analyze
    Form fields:
      - resume:          PDF file
      - job_description: string

    Returns JSON:
      {
        "percentage":     int (0–100),
        "found_skills":   list[str],
        "missing_skills": list[str],
        "suggestions":    list[str]
      }
    """

    # ── Validate resume file ───────────────────────────────────────────────
    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded."}), 400

    file = request.files["resume"]

    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are accepted. Please upload a .pdf resume."}), 400

    # ── Validate job description ───────────────────────────────────────────
    job_description = request.form.get("job_description", "").strip()
    if not job_description:
        return jsonify({"error": "Job description is required."}), 400

    if len(job_description) < 50:
        return jsonify({"error": "Job description seems too short. Please paste the full JD."}), 400

    # ── Save file with unique name ─────────────────────────────────────────
    unique_name = f"{uuid.uuid4().hex}.pdf"
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)

    try:
        file.save(filepath)
    except Exception:
        return jsonify({"error": "Failed to save uploaded file. Please try again."}), 500

    # ── Extract text ───────────────────────────────────────────────────────
    resume_text = extract_text_from_pdf(filepath)

    # Clean up file after extraction (no need to store it)
    try:
        os.remove(filepath)
    except Exception:
        pass  # Non-critical

    if not resume_text:
        return jsonify({
            "error": (
                "Could not extract text from your PDF. This may be a scanned/image-based resume. "
                "Please use a text-based PDF or copy-paste your resume text."
            )
        }), 422

    # ── Skill extraction ───────────────────────────────────────────────────
    resume_skills = extract_skills(resume_text)
    jd_skills     = extract_skills(job_description)

    if not jd_skills:
        return jsonify({
            "error": (
                "Could not identify any recognizable skills in the job description. "
                "Please paste the full JD text including the requirements section."
            )
        }), 422

    # ── Compute match ──────────────────────────────────────────────────────
    found   = sorted(resume_skills & jd_skills)
    missing = sorted(jd_skills - resume_skills)

    # total_jd_skills = len(jd_skills)
    # percentage = round((len(found) / total_jd_skills) * 100) if total_jd_skills > 0 else 0
    
    total_weight = 0
    matched_weight = 0
    for skill in jd_skills:
        skill_key = skill.lower()
        weight = SKILL_WEIGHTS.get(
        skill_key,
        1
        )
        total_weight += weight
        if skill in found:
            matched_weight += weight
    if total_weight > 0:
        percentage = round((matched_weight / total_weight)* 100)
    else: 
        percentage = 0
    suggestions = build_suggestions(missing, found, percentage)

    return jsonify({
        "percentage":    percentage,
        "found_skills":  found,
        "missing_skills": missing,
        "suggestions":   suggestions,
        "matched_weight": matched_weight,
"total_weight": total_weight,
    })


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if PyPDF2 is None:
        print("\n⚠  PyPDF2 not found. Install it with:  pip install PyPDF2\n")
    app.run(debug=True, port=5000)