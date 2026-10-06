import PlotlyChart from "../components/PlotlyChart";
import { getProcessSummary } from "../data/dataEngine";

function ProcessAnalysis({ data }) {
  const processSummary = getProcessSummary(data);

  const sortedProcesses = [...processSummary]
    .sort(
      (a, b) =>
        Number(b.rejectionQuantity || 0) -
        Number(a.rejectionQuantity || 0)
    );

  const chartData = [
    {
      x: sortedProcesses.map(
        (item) => item.process || "Unknown"
      ),
      y: sortedProcesses.map(
        (item) =>
          Number(item.rejectionQuantity || 0)
      ),
      type: "bar",
      text: sortedProcesses.map((item) =>
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
      text: "Rejection Quantity by Process",
      font: {
        size: 16,
        color: "#e7ebf0",
      },
    },
    xaxis: {
      title: "Process",
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
          <h1>Process Analysis</h1>
          <p>
            Analyze rejection quantity across
            different processes.
          </p>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card full-width">
          <PlotlyChart
            data={chartData}
            layout={chartLayout}
            style={{
              minHeight: "450px",
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
            <h2>Process Summary</h2>
            <p>
              Rejection quantity by process for the
              selected filters.
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Process</th>
                <th>Rejection Quantity</th>
                <th>Records</th>
              </tr>
            </thead>

            <tbody>
              {sortedProcesses.map(
                (item, index) => (
                  <tr
                    key={
                      item.process ||
                      `process-${index}`
                    }
                  >
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {item.process || "Unknown"}
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

              {sortedProcesses.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="empty-table"
                  >
                    No process data available for the
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

export default ProcessAnalysis;