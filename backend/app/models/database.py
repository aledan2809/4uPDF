"""
Database models for 4uPDF application
Tracks user activity, file processing jobs, and usage analytics
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ..database import Base


class UserTier(str, enum.Enum):
    """User subscription tier"""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class JobStatus(str, enum.Enum):
    """Processing job status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ToolType(str, enum.Enum):
    """Available PDF tools"""
    MERGE = "merge"
    SPLIT = "split"
    SPLIT_OCR = "split_ocr"
    COMPRESS = "compress"
    PDF_TO_WORD = "pdf_to_word"
    WORD_TO_PDF = "word_to_pdf"
    JPG_TO_PDF = "jpg_to_pdf"
    PDF_TO_JPG = "pdf_to_jpg"


class User(Base):
    """User account model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    tier = Column(Enum(UserTier), default=UserTier.FREE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))

    usage_limit_daily = Column(Integer, default=10)
    usage_limit_monthly = Column(Integer, default=100)

    stripe_customer_id = Column(String(255), unique=True, index=True)
    stripe_subscription_id = Column(String(255))

    jobs = relationship("ProcessingJob", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")


class ProcessingJob(Base):
    """PDF processing job tracker"""
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(36), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    tool_type = Column(Enum(ToolType), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)

    input_filename = Column(String(500), nullable=False)
    input_size_bytes = Column(Integer, nullable=False)
    input_pages = Column(Integer)

    output_filenames = Column(JSON)
    output_size_bytes = Column(Integer)
    output_count = Column(Integer, default=0)

    processing_time_seconds = Column(Float)
    error_message = Column(Text)

    config = Column(JSON)
    job_metadata = Column("metadata", JSON)

    ip_address = Column(String(45))
    user_agent = Column(String(500))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="jobs")


class UsageLog(Base):
    """Daily usage tracking for rate limiting"""
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    tool_type = Column(Enum(ToolType), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    pages_processed = Column(Integer, default=0)
    files_processed = Column(Integer, default=1)

    ip_address = Column(String(45), index=True)
    session_id = Column(String(36), index=True)

    user = relationship("User", back_populates="usage_logs")


class FileCleanupLog(Base):
    """Track file cleanup for security compliance"""
    __tablename__ = "file_cleanup_logs"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String(1000), nullable=False)
    file_size_bytes = Column(Integer)

    created_at = Column(DateTime(timezone=True), nullable=False)
    deleted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    reason = Column(String(255))


class AnalyticsEvent(Base):
    """General analytics and tracking"""
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    event_data = Column(JSON)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String(36), index=True)
    ip_address = Column(String(45))

    page_url = Column(String(500))
    referrer = Column(String(500))
    user_agent = Column(String(500))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
