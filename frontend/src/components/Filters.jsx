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

function Filters({
  data,
  selectedLocation,
  setSelectedLocation,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) {
  const locations = Array.from(
    new Set(
      data
        .map((row) => row.location)
        .filter(Boolean)
    )
  ).sort();

  const dates = data
    .map((row) => row.date)
    .filter(Boolean)
    .sort();

  const minDate =
    dates.length > 0
      ? dates[0]
      : "";

  const maxDate =
    dates.length > 0
      ? dates[dates.length - 1]
      : "";

  return (
    <div className="top-controls">

      <SelectControl
        label="Location"
        value={selectedLocation}
        options={[
          "ALL",
          ...locations,
        ]}
        onChange={setSelectedLocation}
      />

      <div className="date-control">
        <label>
          Date Range
        </label>

        <div className="date-pair">

          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={startDate}
            onChange={(event) =>
              setStartDate(
                event.target.value
              )
            }
          />

          <span>–</span>

          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={endDate}
            onChange={(event) =>
              setEndDate(
                event.target.value
              )
            }
          />

        </div>
      </div>

    </div>
  );
}

export default Filters;