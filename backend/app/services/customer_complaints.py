from pathlib import Path

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
# SOURCE COLUMN -> NORMALIZED COLUMN
# ---------------------------------------------------------

COLUMN_MAP = {
    "Sr. No.": "sr_no",
    "Date": "date",
    "Part No.": "part_no_clean",
    "Part Name": "part_name_clean",

    "Defects Dropdown (Type of Defects)": "defect",
    "Defect Description": "defect_description",

    "Rejection Quantity (No. of parts rejected)": "rejection quantity",
    "Sale Quantity (No. of parts dispatched)": "sale quantity",

    "Cost per part (Individual part cost)": "cost per part",

    "Rejection Cost (Rejection quantity x Cost per part)": (
        "rejection cost"
    ),

    "Debit cost (Penalty from buyer)": "debit cost",

    "Total Rejection Cost (Rejection Cost + Debit Cost)": (
        "total rejection cost"
    ),

    "Process Dropdown (Type of Process)": "process",
    "Process Description": "process_description",

    "Unit Location": "unit_location",
    "Machine": "machine",
    "Location": "location",
}


# ---------------------------------------------------------
# REQUIRED COLUMNS
# ---------------------------------------------------------

REQUIRED_COLUMNS = {
    "Date",
    "Part No.",
    "Part Name",
    "Rejection Quantity (No. of parts rejected)",
    "Sale Quantity (No. of parts dispatched)",
}


# ---------------------------------------------------------
# FIND ALL EXCEL FILES
# ---------------------------------------------------------

def find_excel_files():
    """
    Find every Excel file inside:

    customer_complaints/
        pune/
        lkn/
        jsr/

    """

    files = []

    if not CUSTOMER_DATA_DIR.exists():
        return files

    for location_folder in CUSTOMER_DATA_DIR.iterdir():

        if not location_folder.is_dir():
            continue

        for file_path in location_folder.iterdir():

            if file_path.suffix.lower() in {".xlsx", ".xls"}:
                files.append(file_path)

    return sorted(files)


# ---------------------------------------------------------
# CHECK WHETHER SHEET IS COMPLAINT DATA
# ---------------------------------------------------------

def is_customer_complaint_sheet(df):
    """
    A worksheet is considered a complaint-data sheet only
    if it contains the core complaint columns.

    This automatically ignores sheets such as:
        Defects
        Process
        lookup/reference sheets
    """

    columns = {
        str(column).strip()
        for column in df.columns
    }

    return REQUIRED_COLUMNS.issubset(columns)


# ---------------------------------------------------------
# NORMALIZE ONE DATAFRAME
# ---------------------------------------------------------

def normalize_customer_complaints(
    df,
    location_code,
    source_file,
    sheet_name,
):
    """
    Convert one complaint worksheet into the common
    InsightEdge format.
    """

    # -----------------------------------------------------
    # Clean column names
    # -----------------------------------------------------

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    # -----------------------------------------------------
    # Rename columns
    # -----------------------------------------------------

    df = df.rename(
        columns=COLUMN_MAP
    )

    # -----------------------------------------------------
    # Date
    # -----------------------------------------------------

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce",
        dayfirst=True,
    )

    # -----------------------------------------------------
    # Numeric columns
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

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce",
            ).fillna(0)

            df[column] = df[column].round(2)

    # -----------------------------------------------------
    # Remove blank / summary rows
    # -----------------------------------------------------
    #
    # A valid complaint record must have:
    #
    #   date
    #   part number
    #
    # This removes Excel summary/formula rows.
    # -----------------------------------------------------

    df = df[
        df["date"].notna()
        & df["part_no_clean"].notna()
    ].copy()

    # -----------------------------------------------------
    # Clean text columns
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
    # Clean part numbers
    # -----------------------------------------------------
    #
    # Excel sometimes converts numeric part numbers into:
    #
    # 508846100102.0
    #
    # Convert that back to:
    #
    # 508846100102
    # -----------------------------------------------------

    df["part_no_clean"] = (
        df["part_no_clean"]
        .str.replace(
            r"\.0$",
            "",
            regex=True,
        )
    )

    # -----------------------------------------------------
    # LOCATION
    # -----------------------------------------------------
    #
    # Folder location is the source of truth.
    #
    # pune -> PUN
    # lkn  -> LKN
    # jsr  -> JSR
    # -----------------------------------------------------

    df["location"] = location_code

    # -----------------------------------------------------
    # MONTH START
    # -----------------------------------------------------

    df["month_start"] = (
        df["date"]
        .dt.to_period("M")
        .dt.to_timestamp()
    )

    # -----------------------------------------------------
    # SOURCE FILE
    # -----------------------------------------------------

    df["source_file"] = source_file

    # -----------------------------------------------------
    # SOURCE SHEET
    # -----------------------------------------------------

    df["source_sheet"] = sheet_name

    return df


# ---------------------------------------------------------
# LOAD CUSTOMER COMPLAINTS
# ---------------------------------------------------------

def load_customer_complaints():

    excel_files = find_excel_files()

    if not excel_files:

        raise FileNotFoundError(
            "No Customer Complaint Excel files were found."
        )

    all_dataframes = []

    # -----------------------------------------------------
    # Process every Excel file
    # -----------------------------------------------------

    for file_path in excel_files:

        # Folder name tells us the location
        folder_name = file_path.parent.name.lower()

        location_code = LOCATION_MAP.get(
            folder_name,
            folder_name.upper(),
        )

        # -------------------------------------------------
        # Read workbook
        # -------------------------------------------------

        try:

            workbook = pd.ExcelFile(
                file_path
            )

        except Exception as error:

            print(
                f"Could not open {file_path.name}: {error}"
            )

            continue

        # -------------------------------------------------
        # Process every worksheet
        # -------------------------------------------------

        for sheet_name in workbook.sheet_names:

            try:

                df = pd.read_excel(
                    file_path,
                    sheet_name=sheet_name,
                )

            except Exception as error:

                print(
                    f"Could not read "
                    f"{file_path.name} / {sheet_name}: "
                    f"{error}"
                )

                continue

            # -------------------------------------------------
            # Ignore lookup/reference sheets
            # -------------------------------------------------

            if not is_customer_complaint_sheet(df):

                continue

            # -------------------------------------------------
            # Normalize
            # -------------------------------------------------

            normalized_df = (
                normalize_customer_complaints(
                    df=df,
                    location_code=location_code,
                    source_file=file_path.name,
                    sheet_name=sheet_name,
                )
            )

            # Only keep sheets containing actual records
            if not normalized_df.empty:

                all_dataframes.append(
                    normalized_df
                )

    # ---------------------------------------------------------
    # No valid complaint sheets
    # ---------------------------------------------------------

    if not all_dataframes:

        raise ValueError(
            "Excel files were found, but no valid "
            "Customer Complaint data sheets were found."
        )

    # ---------------------------------------------------------
    # Combine all locations + all sheets
    # ---------------------------------------------------------

    combined_df = pd.concat(
        all_dataframes,
        ignore_index=True,
    )

    # ---------------------------------------------------------
    # Sort
    # ---------------------------------------------------------

    combined_df = combined_df.sort_values(
        by=[
            "date",
            "location",
        ]
    ).reset_index(
        drop=True
    )

    return combined_df