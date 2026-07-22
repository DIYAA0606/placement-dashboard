# Placement Dashboard 📊

A full-stack placement preparation dashboard combining resume management, DSA tracking, and study planning — built with a Python/Flask backend and a JavaScript frontend.

**Live:** https://placement-dashboard-theta.vercel.app

## Features

- **Resume Upload & Storage** – Users can upload and store their resumes for easy access and management
- **Resume Parsing/Analysis** – Backend parses uploaded resumes to extract and analyze content
- **Authentication** – Student login system to keep data secure and personalized per user
- **DSA Tracker** – Track solved/unsolved DSA problems to monitor prep progress
- **Study Planner** – Plan and organize study schedules for placement prep
- **Light/Dark Mode** – Toggle between light and dark themes for user preference

## Tech Stack

**Backend:** Python, Flask
**Frontend:** JavaScript, HTML, CSS
**Deployment:** Vercel

## Project Structure

placement-dashboard/
├── app.py # Flask backend — routes, auth, resume parsing
├── requirements.txt # Python dependencies
├── templates/ # HTML templates
├── static/ # CSS, JS, static assets
├── uploads/ # Stored resume uploads


## Getting Started

1. Clone the repo
```bash
   git clone https://github.com/DIYAA0606/placement-dashboard.git
   cd placement-dashboard
```
2. Install dependencies
```bash
   pip install -r requirements.txt
```
3. Run the app
```bash
   python app.py
```
4. Open `http://localhost:5000` in your browser

## Why I Built This

Placement prep involves juggling resumes, DSA practice, and study schedules across separate tools. This dashboard brings resume management, problem tracking, and planning into a single Flask-powered app — with actual backend logic handling resume parsing, not just static pages.
