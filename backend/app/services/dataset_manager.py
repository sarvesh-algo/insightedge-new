from pathlib import Path
from typing import Literal

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"

SUPPORTED_EXTENSIONS = {
    ".xlsx",
    ".xls",
    ".csv",
}

LOCATIONS = {
    "pune": "PUN",
    "lkn": "LKN",
    "jsr": "JSR",
}


def _read_file(path: Path) -> list[pd.DataFrame]:
    """Read all data sheets from one uploaded file."""

    frames = []

    if path.suffix.lower() == ".csv":
        frames.append(pd.read_csv(path))
        return frames

    workbook = pd.ExcelFile(path)

    for sheet_name in workbook.sheet_names:
        try:
            frame = pd.read_excel(
                workbook,
                sheet_name=sheet_name,
            )

            if not frame.empty:
                frames.append(frame)

        except Exception as exc:
            print(
                f"Skipping sheet {sheet_name} "
                f"in {path.name}: {exc}"
            )

    return frames


def _normalize_headers(
    frame: pd.DataFrame,
) -> pd.DataFrame:
    """Normalize whitespace in column names."""

    frame = frame.copy()

    frame.columns = [
        str(column).strip()
        for column in frame.columns
    ]

    return frame


def _is_customer_complaints_sheet(
    frame: pd.DataFrame,
) -> bool:
    columns = set(frame.columns)

    required = {
        "Date",
        "Part No.",
        "Part Name",
        "Rejection Quantity (No. of parts rejected)",
        "Sale Quantity (No. of parts dispatched)",
    }

    return required.issubset(columns)


def _is_internal_rejections_sheet(
    frame: pd.DataFrame,
) -> bool:
    """
    Internal Rejection columns have not been configured yet.
    Avoid guessing their schema.
    """

    return False


def _deduplicate(frame):
    if frame.empty:
        return frame

    frame = frame.copy()

    # Exclude blank rows and Excel summary/total rows
    required_columns = ["Date", "Part No.", "Part Name"]

    if all(col in frame.columns for col in required_columns):
        for col in required_columns:
            frame[col] = frame[col].replace(r"^\s*$", pd.NA, regex=True)

        frame = frame.dropna(subset=required_columns)

        # Reject rows with invalid dates
        parsed_dates = pd.to_datetime(
            frame["Date"],
            errors="coerce",
            dayfirst=True,
        )
        frame = frame.loc[parsed_dates.notna()].copy()

    # Remove duplicate records, excluding file provenance
    # so the same record in two uploaded files isn't counted twice
    duplicate_columns = [
        col for col in frame.columns
        if col != "_source_file"
    ]

    frame = frame.drop_duplicates(
        subset=duplicate_columns,
        keep="first",
    )

    return frame.reset_index(drop=True)


def load_combined_dataset(
    source: Literal[
        "customer_complaints",
        "internal_rejections",
    ],
) -> pd.DataFrame:
    """
    Load every supported file for a source, normalize
    location, and combine valid worksheets.
    """

    source_dir = DATA_DIR / source

    if not source_dir.exists():
        return pd.DataFrame()

    frames = []

    for location_folder, location_code in LOCATIONS.items():
        location_dir = (
            source_dir / location_folder
        )

        if not location_dir.exists():
            continue

        files = sorted(
            path
            for path in location_dir.iterdir()
            if path.is_file()
            and path.suffix.lower()
            in SUPPORTED_EXTENSIONS
        )

        for path in files:
            try:
                sheets = _read_file(path)

                for frame in sheets:
                    frame = _normalize_headers(
                        frame
                    )

                    if (
                        source == "customer_complaints"
                        and not _is_customer_complaints_sheet(
                            frame
                        )
                    ):
                        continue

                    if (
                        source == "internal_rejections"
                        and not _is_internal_rejections_sheet(
                            frame
                        )
                    ):
                        continue

                    frame["Location"] = (
                        location_code
                    )

                    frame["_source_file"] = (
                        path.name
                    )

                    frames.append(frame)

            except Exception as exc:
                print(
                    f"Unable to read {path.name}: {exc}"
                )

    if not frames:
        return pd.DataFrame()

    combined = pd.concat(
        frames,
        ignore_index=True,
        sort=False,
    )

    combined = _deduplicate(combined)

    return combined