# Contract Analysis and Knowledge Graph Platform

This project consists of two main components:
1. A FastAPI backend for contract analysis and knowledge graph generation
2. A React frontend for document upload and metadata management

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Start the FastAPI server:
   ```
   python main.py
   ```
   
   Or with uvicorn directly:
   ```
   uvicorn api.main:app --reload
   ```

The API will be available at http://localhost:8000. You can view the API documentation at http://localhost:8000/docs.

### Frontend Setup

1. Navigate to the drafter directory:
   ```
   cd drafter
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The frontend will be available at http://localhost:3000.

## Integration Testing

1. Start both the backend and frontend servers.
2. Upload a document through the frontend interface.
3. Fill in the metadata form.
4. Submit the form to send data to the backend.

## API Endpoints

- `POST /process/`: Upload and process a document
- `POST /metadata/`: Submit metadata for a processed document
- `GET /health`: Health check endpoint 