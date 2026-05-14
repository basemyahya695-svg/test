# MyHome Household Bills

MyHome is a working MVP for managing household bills. Users can create an account, sign in, add bills, filter bills by category and frequency, mark bills as paid, view a payment schedule, and send reminder emails for unpaid bills.

## Tools And Technologies

- Frontend: HTML, CSS, and vanilla JavaScript
- Backend: Python, Flask, Flask-CORS, Flask-SQLAlchemy
- Database: SQLite
- Email: SMTP through Python `smtplib`
- Deployment support: `gunicorn` and `render.yaml`

## Project Structure

```text
Home bills S.E/
  Backend/      Flask API, database models, services, and seed script
  Frontend/     Main HTML/CSS/JavaScript frontend
```

## Setup Requirements

Install Python 3.10 or newer. The project does not require Node.js or a frontend build step.

Install backend dependencies:

```powershell
cd "<project-folder>\Home bills S.E\Backend"
python -m pip install -r requirements.txt
```

Replace `<project-folder>` with the folder where you downloaded or cloned the repository.

## Launch Working Prototype / MVP

Open two terminals.

### 1. Run The Backend

```powershell
cd "<project-folder>\Home bills S.E\Backend"
python app.py
```

The backend runs at:

```text
http://127.0.0.1:5000
```

### 2. Run The Frontend

```powershell
cd "<project-folder>\Home bills S.E\Frontend"
python -m http.server 8000
```

Open this URL in a browser:

```text
http://127.0.0.1:8000/Html/Login.html
```

## How To Use The Project

1. Open the Login page.
2. Use the Sign Up tab to create a new account.
3. After logging in, use the sidebar to move between Dashboard, Bills, Schedule, Profile, and Settings.
4. On the Bills page, add bills with a name, category, amount, currency, due date, and frequency.
5. Filter bills by search text, category, or frequency.
6. Mark unpaid bills as paid using the check button.
7. Use the Schedule page to view all scheduled bills and the monthly calendar.
8. Use the email reminder button on the Schedule page to send unpaid bill reminders if email settings are configured.

## Sample Data

For a quick demo, seed a sample account and sample bills:

```powershell
cd "<project-folder>\Home bills S.E\Backend"
python seed_sample_data.py
```

Demo login:

```text
Email: demo@myhome.local
Password: DemoPass123
```

The seed script is safe to run more than once. It creates the demo user if missing and does not duplicate sample bills when that user already has bills.

## Quick Demo With Sample Data

Follow these steps to launch the MVP with the demo account:

1. Seed the sample data:

```powershell
cd "<project-folder>\Home bills S.E\Backend"
python seed_sample_data.py
```

2. Start the backend from the same `Backend` folder:

```powershell
python app.py
```

3. Open a second terminal and start the frontend:

```powershell
cd "<project-folder>\Home bills S.E\Frontend"
python -m http.server 8000
```

4. Open the app in your browser:

```text
http://127.0.0.1:8000/Html/Login.html
```

5. Log in with the demo account:

```text
Email: demo@myhome.local
Password: DemoPass123
```

## Optional Email Setup

Reminder emails use SMTP. Set these environment variables before starting the backend:

```powershell
$env:MAIL_SERVER="smtp.example.com"
$env:MAIL_PORT="587"
$env:MAIL_USERNAME="your-email@example.com"
$env:MAIL_PASSWORD="your-smtp-or-app-password"
$env:MAIL_FROM="your-email@example.com"
$env:MAIL_USE_TLS="true"
python app.py
```

If email settings are not configured, the rest of the app still works.

## Troubleshooting

- If the frontend does not load data, make sure the backend is running at `http://127.0.0.1:5000`.
- If `python` cannot find Flask, run `python -m pip install -r requirements.txt` inside the `Backend` folder.
- If port `8000` is busy, run the frontend on another port, for example `python -m http.server 8001`, then open `http://127.0.0.1:8001/Html/Login.html`.
- If old JavaScript appears in the browser, refresh with `Ctrl+F5`.
