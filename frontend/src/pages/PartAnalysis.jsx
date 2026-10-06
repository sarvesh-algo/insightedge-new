import PlotlyChart from "../components/PlotlyChart";
import {
  getPartSummary,
  calculatePPM,
} from "../data/dataEngine";

function formatMonth(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function PartAnalysis({ data }) {
  const partSummary = getPartSummary(data);

  const top15 = [...partSummary]
    .sort(
      (a, b) =>
        Number(b.rejectionQuantity || 0) -
        Number(a.rejectionQuantity || 0)
    )
    .slice(0, 15);

  /*
   * Build month-wise rejection quantity for all parts.
   * The current filtered date range automatically controls
   * which months appear in this table.
   */
  const monthMap = new Map();

  data.forEach((row) => {
    if (!row.date || !row.partNo) return;

    const date = new Date(`${row.date}T00:00:00`);

    if (Number.isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        key: monthKey,
        label: formatMonth(
          `${monthKey}-01`
        ),
      });
    }
  });

  const months = Array.from(monthMap.values()).sort(
    (a, b) => a.key.localeCompare(b.key)
  );

  const partMap = new Map();

  data.forEach((row) => {
    if (!row.partNo) return;

    const partNo = String(row.partNo);
    const partName = row.partName || "-";

    if (!partMap.has(partNo)) {
      partMap.set(partNo, {
        partNo,
        partName,
        totalRejection: 0,
        months: {},
      });
    }

    const part = partMap.get(partNo);

    const rejection = Number(
      row.rejectionQuantity || 0
    );

    part.totalRejection += rejection;

    if (row.date) {
      const date = new Date(
        `${row.date}T00:00:00`
      );

      if (!Number.isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        part.months[monthKey] =
          (part.months[monthKey] || 0) +
          rejection;
      }
    }
  });

  const top50 = Array.from(partMap.values())
    .sort(
      (a, b) =>
        b.totalRejection - a.totalRejection
    )
    .slice(0, 50);

  const chartData = [
    {
      x: top15.map((item) => item.partNo),
      y: top15.map(
        (item) =>
          Number(item.rejectionQuantity || 0)
      ),
      type: "bar",
      text: top15.map(
        (item) =>
          Number(
            item.rejectionQuantity || 0
          ).toLocaleString()
      ),
      textposition: "outside",
      hovertemplate:
        "<b>%{x}</b><br>" +
        "Rejection Qty: %{y:,}<extra></extra>",
    },
  ];

  const chartLayout = {
    title: {
      text: "Top 15 Parts by Rejection Quantity",
      font: {
        size: 16,
        color: "#e7ebf0",
      },
    },
    xaxis: {
      title: "Part No.",
      tickangle: -45,
      automargin: true,
    },
    yaxis: {
      title: "Rejection Quantity",
      automargin: true,
    },
    margin: {
      l: 70,
      r: 30,
      t: 65,
      b: 120,
    },
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Part Analysis</h1>
          <p>
            Analyze rejection quantity and monthly
            rejection patterns by part.
          </p>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card full-width">
          <PlotlyChart
            data={chartData}
            layout={chartLayout}
            style={{
              minHeight: "470px",
            }}
          />
        </div>
      </div>

      <div
        className="table-card"
        style={{
          marginTop: "28px",
        }}
      >
        <div className="table-header">
          <div>
            <h2>
              Top 50 Parts with Highest Rejection
              Occurrences
            </h2>
            <p>
              Month-wise rejection quantity for the
              selected date range.
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Part No.</th>
                <th>Part Description</th>

                {months.map((month) => (
                  <th key={month.key}>
                    {month.label}
                  </th>
                ))}

                <th>Total Rejection</th>
              </tr>
            </thead>

            <tbody>
              {top50.map((part, index) => (
                <tr key={part.partNo}>
                  <td>{index + 1}</td>

                  <td>
                    <strong>
                      {part.partNo}
                    </strong>
                  </td>

                  <td>
                    {part.partName}
                  </td>

                  {months.map((month) => (
                    <td key={month.key}>
                      {Number(
                        part.months[
                          month.key
                        ] || 0
                      ).toLocaleString()}
                    </td>
                  ))}

                  <td>
                    <strong>
                      {Number(
                        part.totalRejection || 0
                      ).toLocaleString()}
                    </strong>
                  </td>
                </tr>
              ))}

              {top50.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      4 + months.length
                    }
                    className="empty-table"
                  >
                    No part data available for the
                    selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PartAnalysis;