import { useEffect, useRef, useState } from "react";

function FilterMulti({
  label,
  values,
  selected,
  setSelected,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(event) {
      if (
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
    };
  }, []);

  const filteredValues = values.filter((value) =>
    String(value)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function toggleValue(value) {
    if (selected.includes(value)) {
      setSelected(
        selected.filter((item) => item !== value)
      );
    } else {
      setSelected([...selected, value]);
    }
  }

  function selectAll() {
    setSelected(values);
  }

  function clearAll() {
    setSelected([]);
  }

  return (
    <div
      className="filter-block"
      ref={ref}
    >
      <label>{label}</label>

      <button
        type="button"
        className="multi-select"
        onClick={() => setOpen(!open)}
      >
        <span>
          {selected.length === 0
            ? `All ${label}s`
            : `${selected.length} selected`}
        </span>

        <span className="single-select-arrow">
          ▾
        </span>
      </button>

      {open && (
        <div className="dropdown-menu">

          <div className="dropdown-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            />
          </div>

          <div className="dropdown-actions">
            <button
              type="button"
              onClick={selectAll}
            >
              Select All
            </button>

            <button
              type="button"
              onClick={clearAll}
            >
              Clear
            </button>
          </div>

          <div className="dropdown-options">
            {filteredValues.length === 0 ? (
              <div className="no-options">
                No matching {label.toLowerCase()}
              </div>
            ) : (
              filteredValues.map((value) => {
                const checked =
                  selected.includes(value);

                return (
                  <button
                    type="button"
                    key={value}
                    className={`dropdown-option ${
                      checked ? "selected" : ""
                    }`}
                    onClick={() =>
                      toggleValue(value)
                    }
                  >
                    <span
                      className={`checkbox ${
                        checked ? "checked" : ""
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>

                    <span className="option-text">
                      {value}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="dropdown-footer">
            {selected.length === 0
              ? `All ${label}s`
              : `${selected.length} selected`}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="selected-preview">
          {selected
            .slice(0, 2)
            .map((value) => (
              <span key={value}>
                {value}
              </span>
            ))}

          {selected.length > 2 && (
            <span className="more-pill">
              +{selected.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <div className="filter-block">
      <label>{label}</label>

      <div className="single-select">
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        >
          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <span className="single-select-arrow">
          ▾
        </span>
      </div>
    </div>
  );
}

function Sidebar({
  activePage,
  setActivePage,

  data,

  processFilter,
  setProcessFilter,

  machineFilter,
  setMachineFilter,

  partFilter,
  setPartFilter,

  defectFilter,
  setDefectFilter,

  compareParts,
  setCompareParts,

  ppmSingle,
  setPpmSingle,
}) {
  const pages = [
    ["🏠", "overview", "Overview"],
    ["📊", "ppm", "PPM Dashboard"],
    ["📍", "location", "Location Analysis"],
    ["📦", "part", "Part Analysis"],
    ["❌", "defect", "Defect Analysis"],
    ["⚙️", "process", "Process Analysis"],
    ["🏭", "machine", "Machine Analysis"],
    ["💰", "cost", "Cost Analysis"],
  ];

  const uniqueValues = (field) =>
    Array.from(
      new Set(
        data
          .map((row) => row[field])
          .filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              String(value).trim() !== ""
          )
          .map((value) => String(value))
      )
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
      })
    );

  const processes = uniqueValues("process");
  const machines = uniqueValues("machine");
  const parts = uniqueValues("partNo");
  const defects = uniqueValues("defect");

  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="brand">
        <div className="brand-mark">
          ◇
        </div>

        <div>
          <div className="brand-title">
            InsightEdge
          </div>

          <div className="brand-sub">
            Quality Intelligence
          </div>
        </div>
      </div>

      {/* DATA SOURCE */}

      <div className="nav-label">
        Data Source
      </div>

      <div className="data-source-card">

        <div className="data-source-icon">
          ✓
        </div>

        <div>
          <div className="data-source-title">
            Customer Complaints
          </div>

          <div className="data-source-status">
            ● Backend Connected
          </div>
        </div>

      </div>

      {/* NAVIGATION */}

      <div className="nav-label">
        Navigation
      </div>

      <div className="navigation">

        {pages.map(
          ([icon, id, label]) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${
                activePage === id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActivePage(id)
              }
            >
              <span className="nav-icon">
                {icon}
              </span>

              <span>
                {label}
              </span>
            </button>
          )
        )}

      </div>

      {/* SIDEBAR FILTERS */}

      <div className="sidebar-divider" />

      <div className="nav-label">
        Dashboard Filters
      </div>

      <FilterMulti
        label="Process"
        values={processes}
        selected={processFilter}
        setSelected={setProcessFilter}
      />

      <FilterMulti
        label="Machine"
        values={machines}
        selected={machineFilter}
        setSelected={setMachineFilter}
      />

      <FilterMulti
        label="Part"
        values={parts}
        selected={partFilter}
        setSelected={setPartFilter}
      />

      <FilterMulti
        label="Defect"
        values={defects}
        selected={defectFilter}
        setSelected={setDefectFilter}
      />

      {/* PPM FILTERS */}

      {activePage === "ppm" && (
        <>
          <div className="sidebar-divider" />

          <div className="nav-label">
            PPM Part Analysis
          </div>

          <FilterMulti
            label="Compare Parts"
            values={parts}
            selected={compareParts}
            setSelected={setCompareParts}
          />

          <SelectControl
            label="PPM Over Time · Part"
            value={ppmSingle}
            options={[
              "ALL",
              ...parts,
            ]}
            onChange={setPpmSingle}
          />
        </>
      )}

      {/* DATASET */}

      <div className="sidebar-divider" />

      <div className="nav-label">
        Dataset
      </div>

      <div className="dataset-info">

        <div>
          <span>
            Source
          </span>

          <strong>
            Customer Complaints
          </strong>
        </div>

        <div>
          <span>
            Locations
          </span>

          <strong>
            PUN · LKN · JSR
          </strong>
        </div>

        <div>
          <span>
            Records
          </span>

          <strong>
            {data.length.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>
            Mode
          </span>

          <strong>
            Backend Connected
          </strong>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;