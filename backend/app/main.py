"""
4uPDF FastAPI Application
Main entry point for the backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from contextlib import asynccontextmanager

from .routes import router
from .auth_routes import router as auth_router
from .stripe_routes import router as stripe_router
from .database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    await init_db()
    yield


app = FastAPI(
    title="4uPDF API",
    description="PDF tools API for merge, split, compress, convert operations",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router)
app.include_router(auth_router)
app.include_router(stripe_router)

Path("uploads").mkdir(exist_ok=True)
Path("output").mkdir(exist_ok=True)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": "4uPDF API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "merge": "/api/merge",
            "split": "/api/split",
            "split_ocr": "/api/split-ocr",
            "compress": "/api/compress",
            "pdf_to_word": "/api/pdf-to-word",
            "word_to_pdf": "/api/word-to-pdf",
            "jpg_to_pdf": "/api/jpg-to-pdf",
            "pdf_to_jpg": "/api/pdf-to-jpg"
        }
    }


if __name__ == "__main__":
    import uvicorn
    print("Starting 4uPDF API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
