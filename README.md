# Recruiting Match Tool

AI-powered candidate-to-role matching tool built for recruiters and staffing agencies. Paste a client's job description and a candidate's resume/screen notes to get an instant fit score, risk flags, and a ready-to-send client email paragraph.

## Features

- **Role Input**: Paste the client firm name, role title, and full job description
- **Candidate Input**: Paste resume text and your screening notes
- **Match Scoring**: Automatic scoring across 5 dimensions (skills, experience, seniority, practice area, culture fit)
- **Risk Flags**: Surface concerns like job hopping, skill gaps, or overqualification
- **Client Email Draft**: Auto-generates a one-paragraph recruiter email to send to the client about the candidate
- **No backend required**: Runs entirely in the browser (vanilla HTML/CSS/JS)

## How to Use

1. Open `index.html` in your browser
2. Fill in the **Client & Role** section (firm name, role title, job description)
3. Fill in the **Candidate** section (name, resume text, screening notes)
4. Click **Evaluate Match**
5. Review the match score, breakdown, and generated client email
6. Copy the email and send to your client

## File Structure

```
recruiting-match-tool/
  index.html          # Main app UI
  style.css           # Styling
  app.js              # Match logic + email generator
  sample-data.json    # Example role and candidate for testing
  .gitignore          # Git ignore rules
  README.md           # This file
```

## Future Enhancements

- Connect to OpenAI / Claude API for smarter matching
- Integrate with AppSheet or Airtable for candidate tracking
- Add bulk candidate evaluation mode
- Export match reports as PDF
- Connect to LinkedIn or Apollo for candidate enrichment

## Tech Stack

- Vanilla HTML, CSS, JavaScript (no dependencies)
- Designed to be extended with any LLM API

## License

MIT
