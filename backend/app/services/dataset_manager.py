
from pathlib import Path
from typing import Literal

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"

SUPPORTED_EXTENSIONS = {".xlsx", ".xls", ".csv"}

LOCATIONS = {
    "pune": "PUN",
    "lkn": "LKN",
    "jsr": "JSR",
}

SOURCES = {"customer_complaints", "internal_rejections"}


def _read_file(path: Path) -> list[tuple[str, pd.DataFrame]]:
    """Read CSV files or all readable sheets from an Excel workbook."""
    if path.suffix.lower() == ".csv":
        return [("CSV", pd.read_csv(path))]

    frames = []
    with pd.ExcelFile(path) as workbook:
        for sheet_name in workbook.sheet_names:
            try:
                frame = pd.read_excel(workbook, sheet_name=sheet_name)
                if not frame.empty:
                    frames.append((sheet_name, frame))
            except Exception as exc:
                print(
                    f"Skipping sheet '{sheet_name}' in "
                    f"'{path.name}': {exc}"
                )

    return frames


def _clean_headers(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.copy()
    frame.columns = [str(column).strip() for column in frame.columns]
    return frame


def _header_key(value: str) -> str:
    """Make header comparisons tolerant of spaces, punctuation and case."""
    return "".join(
        character
        for character in str(value).strip().lower()
        if character.isalnum()
    )


def _column_keys(frame: pd.DataFrame) -> set[str]:
    return {_header_key(column) for column in frame.columns}



def _is_customer_complaints_sheet(frame: pd.DataFrame) -> bool:
    keys = _column_keys(frame)

    required_groups = [
        {"date"},
        {"partno"},
        {"partname"},
        {
            "rejectionquantitynopartsrejected",
            "rejectionquantitynoofpartsrejected",
            "rejectionquantity",
            "rejectionqty",
        },
        {
            "salequantitynopartsdispatched",
            "salequantitynoofpartsdispatched",
            "salequantity",
            "saleqty",
        },
    ]

    return all(bool(group & keys) for group in required_groups)


def _is_internal_rejections_sheet(frame: pd.DataFrame) -> bool:
    keys = _column_keys(frame)

    has_date = "date" in keys
    has_part_number = bool(
        {"partno", "partnumber", "partnoclean"} & keys
    )
    has_part_name = bool(
        {"partname", "partdescription"} & keys
    )
    has_quality_quantity = bool(
        {
            "rejectionquantity",
            "rejectionqty",
            "productionquantity",
            "productionqty",
            "reworkquantity",
            "reworkqty",
            "segregationquantity",
            "segregationqty",
            "deviationquantity",
            "deviationqty",
        } & keys
    )

    return (
        has_date
        and has_part_number
        and has_part_name
        and has_quality_quantity
    )


def _is_valid_sheet(
    frame: pd.DataFrame,
    source: str,
) -> bool:
    if source == "customer_complaints":
        return _is_customer_complaints_sheet(frame)

    return _is_internal_rejections_sheet(frame)


def load_combined_dataset(
    source: Literal["customer_complaints", "internal_rejections"],
) -> pd.DataFrame:
    """
    Combine all valid records from the Pune, LKN and JSR master files.

    Each upload is stored in:
        data/<source>/<location>/

    The location folder is authoritative for the Location value.
    Rows are not automatically deduplicated because identical-looking
    records may represent legitimate separate rejection events.
    """
    if source not in SOURCES:
        raise ValueError(f"Unsupported dataset source: {source}")

    source_dir = DATA_DIR / source
    frames = []

    for location_folder, location_code in LOCATIONS.items():
        location_dir = source_dir / location_folder

        if not location_dir.exists():
            continue

        files = sorted(
            path
            for path in location_dir.iterdir()
            if path.is_file()
            and path.suffix.lower() in SUPPORTED_EXTENSIONS
            and not path.name.startswith("~$")
        )

        for path in files:
            try:
                sheets = _read_file(path)

                for sheet_name, raw_frame in sheets:
                    frame = _clean_headers(raw_frame)

                    if not _is_valid_sheet(frame, source):
                        print(
                            f"Skipping unrelated sheet '{sheet_name}' "
                            f"in '{path.name}' for source '{source}'."
                        )
                        continue

                    # Folder assignment prevents inconsistent location
                    # values inside workbooks from mixing locations.
                    frame["Location"] = location_code
                    frame["_source_file"] = path.name
                    frame["_source_sheet"] = sheet_name

                    frames.append(frame)

            except Exception as exc:
                print(f"Unable to read '{path.name}': {exc}")

    if not frames:
        return pd.DataFrame()

    # This is where the location datasets are appended vertically.
    combined = pd.concat(
        frames,
        ignore_index=True,
        sort=False,
    )

    return combined.reset_index(drop=True)


def get_dataset_status() -> dict:
    """Return file and record counts for every source/location combination."""
    status = {}

    for source in sorted(SOURCES):
        source_status = {
            "rows": 0,
            "locations": {},
            "files": {},
        }

        for location_folder, location_code in LOCATIONS.items():
            location_dir = DATA_DIR / source / location_folder

            files = (
                sorted(
                    path
                    for path in location_dir.iterdir()
                    if path.is_file()
                    and path.suffix.lower() in SUPPORTED_EXTENSIONS
                    and not path.name.startswith("~$")
                )
                if location_dir.exists()
                else []
            )

            source_status["files"][location_code] = [
                path.name for path in files
            ]

            source_status["locations"][location_code] = 0

        combined = load_combined_dataset(source)

        if not combined.empty and "Location" in combined.columns:
            counts = combined["Location"].value_counts()

            for location_code in source_status["locations"]:
                source_status["locations"][location_code] = int(
                    counts.get(location_code, 0)
                )

            source_status["rows"] = len(combined)

        status[source] = source_status

    return status
