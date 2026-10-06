from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.customer_complaints import load_customer_complaints


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