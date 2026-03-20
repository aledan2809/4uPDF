# 4uPDF Technical Specifications

## Stack

Backend Python FastAPI PyMuPDF RapidOCR

Frontend Next.js React TailwindCSS

------------------------------------------------------------------------

## File Processing

Upload → temporary storage → processing → download → auto delete

Max file size by plan:

Free: 50MB Bronze: 150MB Silver: 300MB Gold: 500MB

------------------------------------------------------------------------

## Feature Requirements

Each tool must support:

-   drag and drop upload
-   progress indicator
-   error handling
-   secure deletion

------------------------------------------------------------------------

## SEO Requirements

-   unique URL per tool
-   structured metadata
-   FAQ schema
-   sitemap.xml

------------------------------------------------------------------------

## Scalability

Future architecture:

Frontend → API → processing queue → workers → storage

Recommended:

Redis queue Object storage (S3 compatible) CDN
