
from pathlib import Path
import re

import pandas as pd


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

CUSTOMER_DATA_DIR = (
    BASE_DIR
    / "data"
    / "customer_complaints"
)


# ---------------------------------------------------------
# LOCATION MAPPING
# ---------------------------------------------------------

LOCATION_MAP = {
    "pune": "PUN",
    "pun": "PUN",
    "lkn": "LKN",
    "jsr": "JSR",
}


# ---------------------------------------------------------
# HEADER PREPROCESSING
# ---------------------------------------------------------

def normalize_header_key(value) -> str:
    """
    Normalize headers by ignoring case, spaces, punctuation,
    underscores, brackets, and line breaks.
    """
    return re.sub(
        r"[^a-z0-9]",
        "",
        str(value).strip().lower(),
    )


# Each recognized source header maps to a stable internal key.
HEADER_ALIASES = {
    # Serial number
    "srno": "sr_no",
    "serialno": "sr_no",
    "serialnumber": "sr_no",

    # Date
    "date": "date",

    # Part details
    "partno": "part_no_clean",
    "partnumber": "part_no_clean",
    "partnum": "part_no_clean",
    "partname": "part_name_clean",
    "partdescription": "part_name_clean",

    # Defect details
    "defect": "defect",
    "defects": "defect",
    "typeofdefect": "defect",
    "defectdropdown": "defect",
    "defectsdropdowntypeofdefects": "defect",
    "defectdescription": "defect_description",

    # Rejection quantity
    "rejectionqty": "rejection quantity",
    "rejectionquantity": "rejection quantity",
    "rejectedquantity": "rejection quantity",
    "noofpartsrejected": "rejection quantity",
    "rejectionquantitynopartsrejected": "rejection quantity",
    "rejectionquantitynoofpartsrejected": "rejection quantity",

    # Sale quantity
    "saleqty": "sale quantity",
    "salequantity": "sale quantity",
    "salesquantity": "sale quantity",
    "noofpartsdispatched": "sale quantity",
    "salequantitynopartsdispatched": "sale quantity",
    "salequantitynoofpartsdispatched": "sale quantity",

    # Costs
    "cost": "cost per part",
    "costperpart": "cost per part",
    "individualpartcost": "cost per part",
    "costperpartindividualpartcost": "cost per part",

    "rejectioncost": "rejection cost",
    "rejectioncostrejectionquantityxcostperpart": "rejection cost",

    "debitcost": "debit cost",
    "debit": "debit cost",
    "penaltyfrombuyer": "debit cost",
    "debitcostpenaltyfrombuyer": "debit cost",

    "totalrejectioncost": "total rejection cost",
    "totalrejectioncostrejectioncostdebitcost": "total rejection cost",

    # Process and location details
    "process": "process",
    "processtype": "process",
    "processdropdown": "process",
    "processdropdowntypeofprocess": "process",
    "processdescription": "process_description",

    "unit": "unit_location",
    "unitlocation": "unit_location",
    "unitname": "unit_location",

    "machine": "machine",
    "location": "location",
}


REQUIRED_FIELDS = {
    "date",
    "part_no_clean",
    "part_name_clean",
    "rejection quantity",
    "sale quantity",
}


# ---------------------------------------------------------
# STANDARDIZE HEADERS
# ---------------------------------------------------------

def preprocess_customer_headers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize recognized column names while preserving data.

    If multiple source columns map to the same field, combine
    their non-empty values instead of silently losing information.
    """
    if df is None:
        raise ValueError("No worksheet data was provided.")

    result = df.copy()
    result.columns = [str(column).strip() for column in result.columns]

    grouped_columns = {}

    for column in result.columns:
        key = normalize_header_key(column)
        canonical = HEADER_ALIASES.get(key, None)

        # Unknown columns are retained for debugging/future use.
        output_name = canonical if canonical else column

        grouped_columns.setdefault(output_name, []).append(column)

    output = pd.DataFrame(index=result.index)

    for output_name, source_columns in grouped_columns.items():
        combined = result[source_columns[0]].copy()

        for source_column in source_columns[1:]:
            candidate = result[source_column]

            empty = (
                combined.isna()
                | combined.astype(str).str.strip().str.lower().isin(
                    ["", "nan", "none", "nat"]
                )
            )

            combined = combined.where(~empty, candidate)

        output[output_name] = combined

    return output


# ---------------------------------------------------------
# CHECK WHETHER SHEET IS COMPLAINT DATA
# ---------------------------------------------------------

def is_customer_complaint_sheet(df: pd.DataFrame) -> bool:
    """
    Validate after preprocessing, so different source headers
    are treated consistently.
    """
    if df is None or df.empty:
        return False

    try:
        cleaned = preprocess_customer_headers(df)
    except Exception:
        return False

    return REQUIRED_FIELDS.issubset(set(cleaned.columns))


# ---------------------------------------------------------
# FIND ALL EXCEL FILES
# ---------------------------------------------------------

def find_excel_files():
    """
    Find Excel files in each customer complaint location folder.
    """
    files = []

    if not CUSTOMER_DATA_DIR.exists():
        return files

    for location_folder in CUSTOMER_DATA_DIR.iterdir():
        if not location_folder.is_dir():
            continue

        for file_path in location_folder.iterdir():
            if (
                file_path.is_file()
                and file_path.suffix.lower() in {".xlsx", ".xls", ".xlsm"}
                and not file_path.name.startswith("~$")
            ):
                files.append(file_path)

    return sorted(files)


# ---------------------------------------------------------
# NORMALIZE ONE DATAFRAME
# ---------------------------------------------------------

def normalize_customer_complaints(
    df: pd.DataFrame,
    location_code: str,
    source_file: str,
    sheet_name: str,
) -> pd.DataFrame:
    """
    Convert a complaint worksheet into the existing InsightEdge
    normalized schema.
    """
    df = preprocess_customer_headers(df)

    required_after_preprocessing = {
        "date",
        "part_no_clean",
        "part_name_clean",
        "rejection quantity",
        "sale quantity",
    }

    missing = required_after_preprocessing - set(df.columns)

    if missing:
        raise ValueError(
            "Missing required fields after header preprocessing: "
            + ", ".join(sorted(missing))
        )

    # -----------------------------------------------------
    # Date preprocessing
    # -----------------------------------------------------

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce",
        dayfirst=True,
    )

    # -----------------------------------------------------
    # Numeric preprocessing
    # -----------------------------------------------------

    numeric_columns = [
        "rejection quantity",
        "sale quantity",
        "cost per part",
        "rejection cost",
        "debit cost",
        "total rejection cost",
    ]

    for column in numeric_columns:
        if column not in df.columns:
            df[column] = 0.0

        # Handles comma-separated numbers and currency symbols
        # without changing ordinary numeric values.
        values = (
            df[column]
            .astype("string")
            .str.strip()
            .str.replace(",", "", regex=False)
            .str.replace("₹", "", regex=False)
            .str.replace("Rs.", "", regex=False)
            .str.replace("Rs", "", regex=False)
        )

        df[column] = pd.to_numeric(
            values,
            errors="coerce",
        ).fillna(0).round(2)

    # -----------------------------------------------------
    # Optional text fields
    # -----------------------------------------------------

    text_defaults = {
        "sr_no": "",
        "part_no_clean": "",
        "part_name_clean": "",
        "defect": "",
        "defect_description": "",
        "process": "",
        "process_description": "",
        "unit_location": "",
        "machine": "",
    }

    for column, default in text_defaults.items():
        if column not in df.columns:
            df[column] = default

        df[column] = (
            df[column]
            .fillna("")
            .astype(str)
            .str.strip()
        )

    # -----------------------------------------------------
    # Remove blank and summary rows
    # -----------------------------------------------------

    part_number = df["part_no_clean"].str.strip()

    df = df[
        df["date"].notna()
        & part_number.ne("")
        & part_number.str.lower().ne("nan")
        & part_number.str.lower().ne("none")
    ].copy()

    # -----------------------------------------------------
    # Clean part numbers
    # -----------------------------------------------------

    df["part_no_clean"] = (
        df["part_no_clean"]
        .str.replace(r"\.0$", "", regex=True)
        .str.strip()
    )

    # -----------------------------------------------------
    # Location
    # -----------------------------------------------------

    # The location folder is the source of truth.
    df["location"] = location_code

    # -----------------------------------------------------
    # Month start
    # -----------------------------------------------------

    df["month_start"] = (
        df["date"]
        .dt.to_period("M")
        .dt.to_timestamp()
    )

    # -----------------------------------------------------
    # Source metadata
    # -----------------------------------------------------

    df["source_file"] = source_file
    df["source_sheet"] = sheet_name

    return df


# ---------------------------------------------------------
# LOAD CUSTOMER COMPLAINTS
# ---------------------------------------------------------

def load_customer_complaints() -> pd.DataFrame:
    """
    Load complaint worksheets across locations.

    Every worksheet is preprocessed before validation and
    normalization, preventing header variations from breaking
    the dashboard loader.
    """
    excel_files = find_excel_files()

    if not excel_files:
        raise FileNotFoundError(
            "No Customer Complaint Excel files were found in "
            f"{CUSTOMER_DATA_DIR}."
        )

    all_dataframes = []
    rejected_sheets = []

    for file_path in excel_files:
        folder_name = file_path.parent.name.lower()

        location_code = LOCATION_MAP.get(
            folder_name,
            folder_name.upper(),
        )

        try:
            with pd.ExcelFile(file_path) as workbook:
                sheet_names = list(workbook.sheet_names)

                for sheet_name in sheet_names:
                    try:
                        raw_df = pd.read_excel(
                            workbook,
                            sheet_name=sheet_name,
                        )

                        if raw_df.empty:
                            continue

                        # Preprocess before checking validity.
                        df = preprocess_customer_headers(raw_df)

                        if not is_customer_complaint_sheet(df):
                            rejected_sheets.append(
                                f"{file_path.name} / {sheet_name}"
                            )
                            continue

                        normalized_df = normalize_customer_complaints(
                            df=df,
                            location_code=location_code,
                            source_file=file_path.name,
                            sheet_name=sheet_name,
                        )

                        if not normalized_df.empty:
                            all_dataframes.append(normalized_df)

                    except Exception as error:
                        print(
                            f"Could not process {file_path.name} / "
                            f"{sheet_name}: {error}"
                        )

        except Exception as error:
            print(
                f"Could not open {file_path.name}: {error}"
            )

    # -----------------------------------------------------
    # No valid complaint sheets
    # -----------------------------------------------------

    if not all_dataframes:
        details = ""

        if rejected_sheets:
            details = (
                " Worksheets skipped because required fields "
                "were not recognized: "
                + "; ".join(rejected_sheets[:10])
            )

        raise ValueError(
            "Excel files were found, but no valid Customer "
            "Complaint data sheets were found. Check that each "
            "data sheet contains Date, Part No., Part Name, "
            "Rejection Quantity, and Sale Quantity after "
            "header preprocessing."
            + details
        )

    # -----------------------------------------------------
    # Combine all locations and worksheets
    # -----------------------------------------------------

    combined_df = pd.concat(
        all_dataframes,
        ignore_index=True,
        sort=False,
    )

    # -----------------------------------------------------
    # Sort
    # -----------------------------------------------------

    combined_df = combined_df.sort_values(
        by=["date", "location"],
        kind="stable",
    ).reset_index(drop=True)

    return combined_df
