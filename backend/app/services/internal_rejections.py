from pathlib import Path

import pandas as pd


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

INTERNAL_DATA_DIR = (
    BASE_DIR / "data" / "internal_rejections"
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
# COLUMN MAPPING
# ---------------------------------------------------------

COLUMN_MAP = {
    "Sr. No.": "sr_no",

    "Date": "date",

    "Part No.": "part_no_clean",

    "Part Name": "part_name_clean",

    "Defects Dropdown (Type of Defects)": "defect",

    "Defect Description": "defect_description",

    "Rejection Quantity (No. of parts rejected)": "rejection quantity",

    "Production Quantity": "production quantity",

    "Sale Quantity (No. of parts dispatched)": "sale quantity",

    "Cost per part (Individual part cost)": "cost per part",

    "Rejection Cost (Rejection quantity x Cost per part)": "rejection cost",

    "Debit cost (Penalty from buyer)": "debit cost",

    "Total Rejection Cost (Rejection Cost + Debit Cost)": "total rejection cost",

    "Process Dropdown (Type of Process)": "process",

    "Process Description": "process_description",

    "Unit Location": "unit_location",

    "Machine": "machine",

    "Location": "location",
}


# ---------------------------------------------------------
# FIND EXCEL FILES
# ---------------------------------------------------------

def find_internal_files():
    """
    Find all Internal Rejection Excel files inside:

        data/internal_rejections/
            pune/
            lkn/
            jsr/
    """

    if not INTERNAL_DATA_DIR.exists():
        raise FileNotFoundError(
            f"Internal rejection data directory does not exist: "
            f"{INTERNAL_DATA_DIR}"
        )

    files = []

    for location_dir in INTERNAL_DATA_DIR.iterdir():

        if not location_dir.is_dir():
            continue

        for file in location_dir.iterdir():

            if file.suffix.lower() in [".xlsx", ".xls"]:
                files.append(file)

    return sorted(files)


# ---------------------------------------------------------
# DETECT LOCATION
# ---------------------------------------------------------

def detect_location(file_path: Path):

    folder_name = (
        file_path.parent.name
        .lower()
        .strip()
    )

    return LOCATION_MAP.get(folder_name)


# ---------------------------------------------------------
# READ ONE INTERNAL REJECTION FILE
# ---------------------------------------------------------

def read_internal_file(file_path: Path):

    location = detect_location(file_path)

    if location is None:
        raise ValueError(
            f"Could not determine location for file: "
            f"{file_path}"
        )

    try:

        df = pd.read_excel(
            file_path,
            sheet_name="Sheet1"
        )

    except ValueError as exc:

        raise ValueError(
            f"Sheet 'Sheet1' was not found in "
            f"{file_path.name}"
        ) from exc

    if df.empty:
        return pd.DataFrame()

    # -----------------------------------------------------
    # REMOVE COMPLETELY EMPTY ROWS
    # -----------------------------------------------------

    df = df.dropna(
        how="all"
    ).copy()

    # -----------------------------------------------------
    # CLEAN COLUMN NAMES
    # -----------------------------------------------------

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    # -----------------------------------------------------
    # NORMALIZE COLUMN NAMES
    # -----------------------------------------------------

    df = df.rename(
        columns=COLUMN_MAP
    )

    # -----------------------------------------------------
    # DATE
    # -----------------------------------------------------

    if "date" not in df.columns:

        raise ValueError(
            f"'Date' column is missing in "
            f"{file_path.name}"
        )

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    # -----------------------------------------------------
    # NUMERIC COLUMNS
    # -----------------------------------------------------

    numeric_columns = [
        "rejection quantity",
        "production quantity",
        "sale quantity",
        "cost per part",
        "rejection cost",
        "debit cost",
        "total rejection cost",
    ]

    for column in numeric_columns:

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            ).fillna(0)

            df[column] = df[column].round(2)

    # -----------------------------------------------------
    # REMOVE SUMMARY / NON-DATA ROWS
    # -----------------------------------------------------

    if "part_no_clean" in df.columns:

        df = df[
            df["date"].notna()
            & df["part_no_clean"].notna()
        ].copy()

    # -----------------------------------------------------
    # TEXT COLUMNS
    # -----------------------------------------------------

    text_columns = [
        "part_no_clean",
        "part_name_clean",
        "defect",
        "defect_description",
        "process",
        "process_description",
        "unit_location",
        "machine",
    ]

    for column in text_columns:

        if column in df.columns:

            df[column] = (
                df[column]
                .fillna("")
                .astype(str)
                .str.strip()
            )

    # -----------------------------------------------------
    # CLEAN PART NUMBER
    # -----------------------------------------------------

    if "part_no_clean" in df.columns:

        df["part_no_clean"] = (
            df["part_no_clean"]
            .str.replace(
                r"\.0$",
                "",
                regex=True
            )
        )

    # -----------------------------------------------------
    # LOCATION
    # -----------------------------------------------------

    # Folder location is treated as the source of truth.
    df["location"] = location

    # -----------------------------------------------------
    # MONTH
    # -----------------------------------------------------

    df["month_start"] = (
        df["date"]
        .dt.to_period("M")
        .dt.to_timestamp()
    )

    # -----------------------------------------------------
    # SOURCE FILE
    # -----------------------------------------------------

    df["source_file"] = file_path.name

    return df


# ---------------------------------------------------------
# LOAD ALL INTERNAL REJECTION FILES
# ---------------------------------------------------------

def load_internal_rejections():

    files = find_internal_files()

    if not files:

        raise FileNotFoundError(
            "No Internal Rejection Excel files were found."
        )

    dataframes = []

    for file_path in files:

        print(
            f"Reading internal rejection: "
            f"{file_path}"
        )

        df = read_internal_file(
            file_path
        )

        if not df.empty:
            dataframes.append(df)

    if not dataframes:

        raise ValueError(
            "Internal Rejection files were found, "
            "but they contain no data."
        )

    combined = pd.concat(
        dataframes,
        ignore_index=True
    )

    # -----------------------------------------------------
    # SORT
    # -----------------------------------------------------

    combined = combined.sort_values(
        by=[
            "date",
            "location",
        ],
        na_position="last"
    ).reset_index(
        drop=True
    )

    return combined