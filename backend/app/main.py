from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path
from typing import Literal

from fastapi import UploadFile, File, HTTPException

from app.services.customer_complaints import load_customer_complaints

from app.services.dataset_manager import (
    load_combined_dataset,
)

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"

UPLOAD_DIRECTORIES = {
    "customer_complaints": {
        "pune": DATA_DIR / "customer_complaints" / "pune",
        "lkn": DATA_DIR / "customer_complaints" / "lkn",
        "jsr": DATA_DIR / "customer_complaints" / "jsr",
    },
    "internal_rejections": {
        "pune": DATA_DIR / "internal_rejections" / "pune",
        "lkn": DATA_DIR / "internal_rejections" / "lkn",
        "jsr": DATA_DIR / "internal_rejections" / "jsr",
    },
}




app = FastAPI(
    title="InsightEdge Quality Intelligence API",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "InsightEdge backend is running"
    }



@app.post("/api/upload")
async def upload_dataset_file(
    source: Literal[
        "customer_complaints",
        "internal_rejections",
    ],
    location: Literal[
        "pune",
        "lkn",
        "jsr",
    ],
    file: UploadFile = File(...),
):
    """
    Upload one location-specific Excel file.

    Example:
    source=customer_complaints
    location=pune
    """

    allowed_extensions = {
        ".xlsx",
        ".xls",
        ".csv",
    }

    original_name = file.filename or ""

    extension = Path(
        original_name
    ).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Upload .xlsx, .xls or .csv files."
            ),
        )

    destination_dir = (
        UPLOAD_DIRECTORIES[source][location]
    )

    destination_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    # Prevent path traversal.
    safe_name = Path(
        original_name
    ).name

    if not safe_name:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename.",
        )

    destination = (
        destination_dir / safe_name
    )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    destination.write_bytes(
        file_content
    )

    return {
        "success": True,
        "source": source,
        "location": location,
        "filename": safe_name,
        "path": str(
            destination.relative_to(
                BASE_DIR
            )
        ),
        "size_bytes": len(file_content),
        "message": (
            f"{location.upper()} "
            f"{source.replace('_', ' ').title()} "
            "file uploaded successfully."
        ),
    }
    
    
@app.get("/api/datasets/{source}/preview")
def preview_dataset(source: str):
    if source not in {"customer_complaints", "internal_rejections"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported dataset source."
        )

    data = load_combined_dataset(source)

    # Convert NaN and Infinity to None for valid JSON
    preview = data.head(20).copy()
    preview = preview.astype(object)
    preview = preview.where(pd.notna(preview), None)
    preview = preview.replace([float("inf"), float("-inf")], None)

    # Convert pandas/numpy values to JSON-safe Python values
    records = preview.to_dict(orient="records")

    import math
    from datetime import date, datetime

    def make_json_safe(value):
        if value is None:
            return None

        if hasattr(value, "item"):
            value = value.item()

        if isinstance(value, float) and not math.isfinite(value):
            return None

        if isinstance(value, (pd.Timestamp, datetime, date)):
            return value.isoformat()

        return value

    records = [
        {key: make_json_safe(value) for key, value in row.items()}
        for row in records
    ]

    return {
        "source": source,
        "rows": len(data),
        "columns": data.columns.tolist(),
        "locations": (
            sorted(data["Location"].dropna().unique().tolist())
            if "Location" in data.columns
            else []
        ),
        "data": records,
    }
    
    
    
# ---------------------------------------------------------
# CUSTOMER COMPLAINTS - HEALTH / TEST
# ---------------------------------------------------------

@app.get("/api/customer-complaints/test")
def customer_complaints_test():

    df = load_customer_complaints()

    location_summary = (
        df.groupby("location")
        .agg(
            records=("location", "size"),
            rejection_quantity=("rejection quantity", "sum"),
            sale_quantity=("sale quantity", "sum"),
        )
        .reset_index()
    )

    return {
        "data_source": "customer_complaints",

        "rows": len(df),

        "columns": list(df.columns),

        "locations": sorted(
            df["location"]
            .dropna()
            .unique()
            .tolist()
        ),

        "date_min": (
            df["date"].min().strftime("%Y-%m-%d")
            if not df.empty
            else None
        ),

        "date_max": (
            df["date"].max().strftime("%Y-%m-%d")
            if not df.empty
            else None
        ),

        "total_rejection_quantity": round(
            float(df["rejection quantity"].sum()),
            2
        ),

        "total_sale_quantity": round(
            float(df["sale quantity"].sum()),
            2
        ),

        "location_summary": (
            location_summary
            .round(2)
            .to_dict(orient="records")
        ),
    }


# ---------------------------------------------------------
# CUSTOMER COMPLAINTS - COMPLETE DATA
# ---------------------------------------------------------

@app.get("/api/customer-complaints")
def customer_complaints():

    df = load_customer_complaints()

    # Convert dates to JSON-safe strings
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    df["month_start"] = df["month_start"].dt.strftime("%Y-%m-%d")

    # Replace NaN / NaT
    df = df.fillna("")

    records = df.to_dict(orient="records")

    return {
        "data_source": "customer_complaints",
        "rows": len(records),
        "data": records,
    }


# ---------------------------------------------------------
# CUSTOMER COMPLAINTS - SUMMARY
# ---------------------------------------------------------

@app.get("/api/customer-complaints/summary")
def customer_complaints_summary():

    df = load_customer_complaints()

    location_summary = (
        df.groupby("location")
        .agg(
            records=("location", "size"),
            rejection_quantity=("rejection quantity", "sum"),
            sale_quantity=("sale quantity", "sum"),
        )
        .reset_index()
    )

    return {
        "data_source": "customer_complaints",

        "total_records": len(df),

        "locations": sorted(
            df["location"]
            .dropna()
            .unique()
            .tolist()
        ),

        "total_rejection_quantity": round(
            float(df["rejection quantity"].sum()),
            2
        ),

        "total_sale_quantity": round(
            float(df["sale quantity"].sum()),
            2
        ),

        "location_summary": (
            location_summary
            .round(2)
            .to_dict(orient="records")
        ),
    }