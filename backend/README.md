# 4uPDF Backend API

FastAPI backend for PDF processing tools.

## Features

- **Merge PDF**: Combine multiple PDFs into one
- **Split PDF**: Split PDF by pages or ranges
- **Split OCR**: Intelligent splitting by order number using OCR
- **Compress PDF**: Reduce file size with quality control
- **PDF ↔ Word**: Convert between PDF and Word formats
- **JPG ↔ PDF**: Convert between images and PDF

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
python -m app.main
```

Or with uvicorn:

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/merge` - Merge PDFs
- `POST /api/split` - Split PDF by pages/ranges
- `POST /api/split-ocr` - Split PDF by OCR (async)
- `GET /api/status/{job_id}` - Check OCR job status
- `POST /api/compress` - Compress PDF
- `POST /api/pdf-to-word` - Convert PDF to Word
- `POST /api/word-to-pdf` - Convert Word to PDF
- `POST /api/jpg-to-pdf` - Convert images to PDF
- `POST /api/pdf-to-jpg` - Convert PDF to images
- `GET /api/download/{filename}` - Download file
- `GET /api/download-zip/{job_id}` - Download multiple files as ZIP
- `GET /api/jobs` - List all jobs

## Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── routes.py            # API route handlers
│   ├── models/
│   │   ├── responses.py     # Pydantic response models
│   │   └── __init__.py
│   ├── services/
│   │   ├── pdf_processor.py # Core PDF operations
│   │   ├── ocr_splitter.py  # OCR-based splitting
│   │   └── __init__.py
│   └── __init__.py
├── requirements.txt
└── README.md
```
