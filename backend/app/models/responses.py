"""
Response models for API endpoints
"""

from pydantic import BaseModel
from typing import List, Optional


class JobResponse(BaseModel):
    job_id: str
    status: str


class StatusResponse(BaseModel):
    id: str
    status: str
    progress: float
    current_page: int
    total_pages: int
    orders_found: int
    elapsed_seconds: int
    eta_seconds: int
    files: List[dict]
    groups: dict
    error: Optional[str] = None
    recent_log: List[dict]


class MergeResponse(BaseModel):
    job_id: str
    status: str
    output_file: str
    file_size: int
    download_url: str


class SplitResponse(BaseModel):
    job_id: str
    status: str
    output_files: List[str]
    file_count: int
    download_url: str


class CompressResponse(BaseModel):
    job_id: str
    status: str
    output_file: str
    original_size: int
    compressed_size: int
    compression_ratio: float
    download_url: str


class ConvertResponse(BaseModel):
    job_id: str
    status: str
    output_file: str
    file_size: int
    download_url: str
