# Compliance Agent

A compliance checking and policy analysis system powered by Google Gemini API.

## Project Structure

```
compliance-agent/
├── app/
│   ├── __init__.py
│   ├── main.py            # API entry point & model loading
│   ├── services/
│   │   ├── audit_service.py # Logic for checking database records
│   │   └── llm_service.py   # Interface for Gemini API
│   ├── models/
│   │   └── schemas.py      # Pydantic data models for validation
│   └── utils/
│       └── db_handler.py   # Database connections
├── data/
│   └── bank_data.db        # Your fused SQLite database
├── model_store/
│   └── model.pkl           # Your trained .pkl file
├── config/
│   └── settings.yaml       # Configuration (Port, API Keys, DB Paths)
├── inbox/                  # Folder to drop new PDF policies
├── requirements.txt        # Your dependencies
└── .env                    # Secret keys (not checked into Git)
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` (if exists)
   - Add your Google API key to `.env`:
     ```
     GOOGLE_API_KEY=your_actual_api_key_here
     ```

3. **Replace placeholder files:**
   - Replace `data/bank_data.db` with your actual SQLite database
   - Replace `model_store/model.pkl` with your trained model file

4. **Update configuration:**
   - Edit `config/settings.yaml` to match your setup

## Running the Application

```bash
python -m app.main
```

Or with uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- Additional endpoints to be defined in `main.py`

## Usage

1. Place new PDF policy documents in the `inbox/` folder
2. The system will process and analyze policies using Gemini API
3. Use the audit service to check database records against policies
4. Query the API for compliance status and recommendations

## Development

- Run tests: `pytest`
- Format code: `black .`
- Lint code: `flake8 .`

## Notes

- Do not commit `.env` file to version control
- Keep your API keys secure
- Update `requirements.txt` if adding new dependencies
