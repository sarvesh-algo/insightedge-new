import { useMemo } from "react";
import PlotlyChart from "../components/PlotlyChart";
import {
  calculatePPM,
  getLocationSummary,
  getPartSummary,
} from "../data/dataEngine";

function PPMDashboard({
  data,
}) {
  const locationSummary = useMemo(
    () => getLocationSummary(data),
    [data]
  );

  const partSummary = useMemo(
    () => getPartSummary(data),
    [data]
  );

  /* =====================================================
     MONTHLY PPM
  ===================================================== */

  const monthlyPPM = useMemo(() => {
    const grouped = {};

    data.forEach((row) => {
      if (!row.date) return;

      const month =
        row.date.slice(0, 7);

      if (!grouped[month]) {
        grouped[month] = {
          month,
          rejectionQuantity: 0,
          saleQuantity: 0,
        };
      }

      grouped[month]
        .rejectionQuantity +=
        row.rejectionQuantity;

      grouped[month]
        .saleQuantity +=
        row.saleQuantity;
    });

    return Object.values(grouped)
      .map((row) => ({
        ...row,

        ppm: calculatePPM(
          row.rejectionQuantity,
          row.saleQuantity
        ),
      }))
      .sort((a, b) =>
        a.month.localeCompare(
          b.month
        )
      );
  }, [data]);

  /* =====================================================
     LOCATION PPM CHART
  ===================================================== */

  const locationPPMChart = {
    x: locationSummary.map(
      (row) => row.location
    ),

    y: locationSummary.map(
      (row) => row.ppm
    ),

    type: "bar",

    hovertemplate:
      "Location: %{x}<br>" +
      "PPM: %{y:,.0f}<extra></extra>",
  };

  /* =====================================================
     PPM TREND CHART
  ===================================================== */

  const ppmTrendChart = {
    x: monthlyPPM.map(
      (row) => row.month
    ),

    y: monthlyPPM.map(
      (row) => row.ppm
    ),

    type: "scatter",
    mode: "lines+markers",

    line: {
      width: 2,
    },

    marker: {
      size: 7,
    },

    hovertemplate:
      "Month: %{x}<br>" +
      "PPM: %{y:,.0f}<extra></extra>",
  };

  /* =====================================================
     TOP 10 PARTS BY PPM
  ===================================================== */

  const topPartsByPPM = [
    ...partSummary,
  ]
    .filter(
      (row) =>
        row.saleQuantity > 0 &&
        row.rejectionQuantity > 0
    )
    .sort(
      (a, b) =>
        b.ppm - a.ppm
    )
    .slice(0, 10);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">
            PPM Dashboard
          </div>

          <div className="page-sub">
            Parts Per Million performance ·
            PPM = (Rejection Qty × 1,000,000)
            / Sale Qty
          </div>
        </div>
      </div>

      {/* =================================================
          TOP ROW
      ================================================= */}

      <div className="two-col">

        <div className="plot-card">

          <PlotlyChart
            data={[
              locationPPMChart,
            ]}
            layout={{
              title: {
                text:
                  "PPM by Location",
                font: {
                  size: 13,
                },
              },

              xaxis: {
                title: "Location",
              },

              yaxis: {
                title: "PPM",
                rangemode:
                  "tozero",
              },

              height: 350,
            }}
          />

        </div>

        <div className="plot-card">

          <PlotlyChart
            data={[
              ppmTrendChart,
            ]}
            layout={{
              title: {
                text:
                  "PPM Trend",
                font: {
                  size: 13,
                },
              },

              xaxis: {
                title: "Month",
              },

              yaxis: {
                title: "PPM",
                rangemode:
                  "tozero",
              },

              height: 350,
            }}
          />

        </div>

      </div>

      {/* =================================================
          TOP 10 PARTS BY PPM
      ================================================= */}

      <h2>
        Top 10 Parts by PPM
      </h2>

      <div className="table-wrapper">

        <table>

          <thead>
            <tr>
              <th>Rank</th>
              <th>Part No.</th>
              <th>Part Description</th>
              <th>Rejection Qty</th>
              <th>Location</th>
              <th>PPM</th>
            </tr>
          </thead>

          <tbody>

            {topPartsByPPM.map(
              (part, index) => (
                <tr
                  key={`${part.partNo}-${index}`}
                >
                  <td>
                    {index + 1}
                  </td>

                  <td>
                    {part.partNo}
                  </td>

                  <td>
                    {part.partName || "—"}
                  </td>

                  <td>
                    {part.rejectionQuantity.toLocaleString()}
                  </td>

                  <td>
                    {part.location || "—"}
                  </td>

                  <td>
                    {part.ppm.toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 0,
                      }
                    )}
                  </td>
                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

      {topPartsByPPM.length === 0 && (
        <div className="warning">
          No PPM records are available for
          the current filters.
        </div>
      )}
    </>
  );
}

export default PPMDashboard;