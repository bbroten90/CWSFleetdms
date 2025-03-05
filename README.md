# Fleet DMS (Fleet Data Management System)

A comprehensive fleet management system built with FastAPI backend and React frontend. This application helps manage vehicles, work orders, maintenance, and parts inventory.

## Features

- Vehicle management
- Work order tracking
- Maintenance scheduling
- Parts inventory management
- Samsara integration
- Reporting and analytics
- User authentication and authorization

## Architecture

- **Backend**: FastAPI (Python)
- **Frontend**: React (TypeScript) with Vite
- **Database**: PostgreSQL
- **Containerization**: Docker
- **Deployment**: Google Cloud Run
- **CI/CD**: GitHub Actions

## Development Setup

### Option 1: Using the Setup Scripts

#### Windows

```bash
.\setup.ps1
```

#### Linux/macOS

```bash
chmod +x setup.sh
./setup.sh
```

These scripts will:
1. Set up Python virtual environment
2. Install backend dependencies
3. Install frontend dependencies
4. Start both servers (optional)

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit this file with your environment variables
python -m uvicorn main:app --reload
```

#### Frontend Setup

```bash
cd fleet-dms-frontend
npm install
npm run dev
```

## Containerized Development

You can also use Docker for development:

### Backend

```bash
cd backend
docker build -t fleet-dms-backend:dev .
docker run -p 8000:8000 -e DATABASE_URL=postgresql://user:password@host/db -e SECRET_KEY=your-secret-key fleet-dms-backend:dev
```

### Frontend

```bash
cd fleet-dms-frontend
docker build -t fleet-dms-frontend:dev .
docker run -p 5173:80 fleet-dms-frontend:dev
```

## Cloud Deployment

This project is configured for deployment to Google Cloud Run through GitHub Actions CI/CD pipeline. See the [backend/cloud_deployment_guide.md](backend/cloud_deployment_guide.md) for detailed instructions.

### Required GitHub Secrets for CI/CD

- `GCP_SA_KEY`: Google Cloud Service Account key (JSON)
- `GCP_PROJECT_ID`: Google Cloud Project ID
- `DATABASE_URL`: PostgreSQL connection URL
- `SECRET_KEY`: JWT secret key
- `SAMSARA_API_KEY`: Samsara API key (if using Samsara integration)
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `BACKEND_API_URL`: URL of the backend API for frontend to connect to

## API Documentation

Once the backend is running, API documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Repository Structure

```
fleet-dms/
├── .github/workflows/     # CI/CD configuration
├── backend/               # FastAPI backend
│   ├── App/               # Application code
│   │   ├── Api/           # API endpoints
│   │   ├── models.py      # Database models
│   │   └── schemas.py     # Pydantic schemas
│   ├── database/          # Database migrations and schema
│   ├── Dockerfile         # Backend containerization
│   └── requirements.txt   # Python dependencies
├── fleet-dms-frontend/    # React frontend
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── assets/        # Static assets
│   ├── Dockerfile         # Frontend containerization
│   └── package.json       # Node.js dependencies
├── setup.ps1              # Windows setup script
└── setup.sh               # Linux/macOS setup script
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request
