import PlotlyChart from "../components/PlotlyChart";
import { getPartSummary } from "../data/dataEngine";

function CostAnalysis({ data }) {
  const totalRejectionCost = data.reduce(
    (sum, row) =>
      sum + Number(row.rejectionCost || 0),
    0
  );

  const totalDebitCost = data.reduce(
    (sum, row) =>
      sum + Number(row.debitCost || 0),
    0
  );

  const totalCost = data.reduce(
    (sum, row) =>
      sum + Number(row.totalRejectionCost || 0),
    0
  );

  const partSummary = getPartSummary(data);

  const top15 = [...partSummary]
    .sort(
      (a, b) =>
        Number(b.totalRejectionCost || 0) -
        Number(a.totalRejectionCost || 0)
    )
    .slice(0, 15);

  const chartData = [
    {
      x: top15.map((item) => item.partNo),
      y: top15.map(
        (item) =>
          Number(item.totalRejectionCost || 0)
      ),
      type: "bar",
      text: top15.map((item) =>
        Number(
          item.totalRejectionCost || 0
        ).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      ),
      textposition: "outside",
      hovertemplate:
        "<b>%{x}</b><br>" +
        "Total Rejection Cost: %{y:,.2f}<extra></extra>",
    },
  ];

  const chartLayout = {
    title: {
      text: "Top 15 Parts by Rejection Cost",
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
      title: "Total Rejection Cost",
      automargin: true,
    },
    margin: {
      l: 80,
      r: 30,
      t: 65,
      b: 120,
    },
  };

  const costBreakdownData = [
    {
      labels: [
        "Rejection Cost",
        "Debit Cost",
      ],
      values: [
        totalRejectionCost,
        totalDebitCost,
      ],
      type: "pie",
      hole: 0.55,
      textinfo: "label+percent",
      hovertemplate:
        "<b>%{label}</b><br>" +
        "Amount: %{value:,.2f}<br>" +
        "Share: %{percent}<extra></extra>",
    },
  ];

  const costBreakdownLayout = {
    title: {
      text: "Cost Breakdown",
      font: {
        size: 16,
        color: "#e7ebf0",
      },
    },
    showlegend: true,
    legend: {
      orientation: "h",
      y: -0.05,
    },
    margin: {
      l: 30,
      r: 30,
      t: 65,
      b: 30,
    },
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Cost Analysis</h1>
          <p>
            Analyze rejection and debit costs across
            the selected data.
          </p>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">
            Rejection Cost
          </div>
          <div className="kpi-value">
            {totalRejectionCost.toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Debit Cost
          </div>
          <div className="kpi-value">
            {totalDebitCost.toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Total Rejection Cost
          </div>
          <div className="kpi-value">
            {totalCost.toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </div>
        </div>
      </div>

      <div
        className="chart-grid"
        style={{
          marginTop: "28px",
        }}
      >
        <div className="chart-card">
          <PlotlyChart
            data={chartData}
            layout={chartLayout}
            style={{
              minHeight: "470px",
            }}
          />
        </div>

        <div className="chart-card">
          <PlotlyChart
            data={costBreakdownData}
            layout={costBreakdownLayout}
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
            <h2>Part-wise Cost Summary</h2>
            <p>
              Top parts ranked by total rejection cost.
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
                <th>Rejection Qty</th>
                <th>Rejection Cost</th>
                <th>Total Rejection Cost</th>
              </tr>
            </thead>

            <tbody>
              {top15.map((item, index) => (
                <tr key={item.partNo}>
                  <td>{index + 1}</td>

                  <td>
                    <strong>
                      {item.partNo}
                    </strong>
                  </td>

                  <td>
                    {item.partName || "-"}
                  </td>

                  <td>
                    {Number(
                      item.rejectionQuantity || 0
                    ).toLocaleString()}
                  </td>

                  <td>
                    {Number(
                      item.rejectionCost || 0
                    ).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </td>

                  <td>
                    <strong>
                      {Number(
                        item.totalRejectionCost ||
                          0
                      ).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </strong>
                  </td>
                </tr>
              ))}

              {top15.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-table"
                  >
                    No cost data available for the
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

export default CostAnalysis;