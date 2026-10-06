import PlotlyChart from "../components/PlotlyChart";
import { getDefectSummary } from "../data/dataEngine";

function DefectAnalysis({ data }) {
  const defectSummary = getDefectSummary(data);

  const sortedDefects = [...defectSummary]
    .sort(
      (a, b) =>
        Number(b.rejectionQuantity || 0) -
        Number(a.rejectionQuantity || 0)
    );

  const top15 = sortedDefects.slice(0, 15);

  const chartData = [
    {
      x: top15.map((item) => item.defect || "Unknown"),
      y: top15.map(
        (item) =>
          Number(item.rejectionQuantity || 0)
      ),
      type: "bar",
      text: top15.map((item) =>
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
      text: "Top 15 Defects by Rejection Quantity",
      font: {
        size: 16,
        color: "#e7ebf0",
      },
    },
    xaxis: {
      title: "Defect",
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
      b: 130,
    },
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Defect Analysis</h1>
          <p>
            Analyze rejection patterns by defect type.
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
            <h2>Defect Summary</h2>
            <p>
              Rejection quantity by defect type for
              the selected filters.
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Defect</th>
                <th>Rejection Quantity</th>
                <th>Records</th>
              </tr>
            </thead>

            <tbody>
              {sortedDefects.map(
                (item, index) => (
                  <tr
                    key={
                      item.defect ||
                      `defect-${index}`
                    }
                  >
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {item.defect || "Unknown"}
                      </strong>
                    </td>

                    <td>
                      {Number(
                        item.rejectionQuantity ||
                          0
                      ).toLocaleString()}
                    </td>

                    <td>
                      {Number(
                        item.records || 0
                      ).toLocaleString()}
                    </td>
                  </tr>
                )
              )}

              {sortedDefects.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="empty-table"
                  >
                    No defect data available for the
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

export default DefectAnalysis;