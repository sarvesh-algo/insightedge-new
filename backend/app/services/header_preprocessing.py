
import re
import pandas as pd


# Canonical names expected by the existing Customer Complaints loader.
CANONICAL_HEADERS = {
    "srno": "Sr. No.",
    "date": "Date",
    "partno": "Part No.",
    "partname": "Part Name",
    "defects": "Defects Dropdown (Type of Defects)",
    "defectdescription": "Defect Description",
    "rejectionquantity": "Rejection Quantity (No. of parts rejected)",
    "salequantity": "Sale Quantity (No. of parts dispatched)",
    "costperpart": "Cost per part (Individual part cost)",
    "rejectioncost": "Rejection Cost (Rejection quantity x Cost per part)",
    "debitcost": "Debitcost (Penalty from buyer)",
    "totalrejectioncost": "Total Rejection Cost (Rejection Cost + Debit Cost)",
    "process": "Process Dropdown (Type of Process)",
    "processdescription": "Process Description",
    "unit": "Unit Location",
    "machine": "Machine",
    "location": "Location",
}


# Different source files may use different names for the same field.
HEADER_ALIASES = {
    "serialno": "srno",
    "serialnumber": "srno",
    "srnumber": "srno",
    "partnumber": "partno",
    "partnum": "partno",
    "partdescription": "partname",
    "defect": "defects",
    "typeofdefect": "defects",
    "defectdropdown": "defects",
    "rejectionqty": "rejectionquantity",
    "rejectedquantity": "rejectionquantity",
    "noofpartsrejected": "rejectionquantity",
    "saleqty": "salequantity",
    "salesquantity": "salequantity",
    "noofpartsdispatched": "salequantity",
    "cost": "costperpart",
    "individualpartcost": "costperpart",
    "debit": "debitcost",
    "penaltyfrombuyer": "debitcost",
    "processdropdown": "process",
    "unitlocation": "unit",
    "unitname": "unit",
}


def normalize_header_key(value) -> str:
    """Ignore case, whitespace, punctuation, underscores and line breaks."""
    value = str(value).strip().lower()
    return re.sub(r"[^a-z0-9]", "", value)


def _canonical_key(value) -> str:
    key = normalize_header_key(value)

    # Match either an already-canonical name or a known alias.
    if key in CANONICAL_HEADERS:
        return key

    return HEADER_ALIASES.get(key, key)


def preprocess_headers(frame: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize recognized headers without changing the original cell values.

    If multiple columns map to the same canonical field, combine their
    non-empty values instead of silently discarding data.
    """
    if frame is None:
        raise ValueError("No worksheet data was provided.")

    result = frame.copy()
    result.columns = [str(column).strip() for column in result.columns]

    groups = {}
    for column in result.columns:
        key = _canonical_key(column)
        canonical_name = CANONICAL_HEADERS.get(key, column)
        groups.setdefault(canonical_name, []).append(column)

    output = pd.DataFrame(index=result.index)

    for canonical_name, source_columns in groups.items():
        combined = result[source_columns[0]].copy()

        for source_column in source_columns[1:]:
            candidate = result[source_column]
            empty = combined.isna() | combined.astype(str).str.strip().isin(
                ["", "nan", "None", "NaT"]
            )
            combined = combined.where(~empty, candidate)

        output[canonical_name] = combined

    return output


def is_customer_complaints_sheet(frame: pd.DataFrame) -> bool:
    """Check the required complaint fields after header preprocessing."""
    if frame is None or frame.empty:
        return False

    cleaned = preprocess_headers(frame)
    keys = {normalize_header_key(column) for column in cleaned.columns}

    required = {
        "date",
        "partno",
        "partname",
        "rejectionquantity",
        "salequantity",
    }

    return required.issubset(keys)


def validate_customer_complaints_sheet(frame: pd.DataFrame) -> pd.DataFrame:
    """Return standardized data or raise an actionable validation error."""
    cleaned = preprocess_headers(frame)

    if cleaned.empty:
        raise ValueError("The worksheet is empty.")

    keys = {normalize_header_key(column) for column in cleaned.columns}
    required = {
        "date": "Date",
        "partno": "Part No.",
        "partname": "Part Name",
        "rejectionquantity": "Rejection Quantity",
        "salequantity": "Sale Quantity",
    }

    missing = [
        label for key, label in required.items()
        if key not in keys
    ]

    if missing:
        raise ValueError(
            "This worksheet is not a valid Customer Complaints sheet. "
            "Missing required fields after header preprocessing: "
            + ", ".join(missing)
        )

    return cleaned
