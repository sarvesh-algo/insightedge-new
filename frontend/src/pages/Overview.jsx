import { useMemo } from "react";
import PlotlyChart from "../components/PlotlyChart";
import {
  calculatePPM,
  getLocationSummary,
  getPartSummary,
} from "../data/dataEngine";

function Overview({ data }) {
  const monthlyData = useMemo(() => {
    const grouped = {};

    data.forEach((row) => {
      if (!row.date) return;

      const month = row.date.slice(0, 7);

      if (!grouped[month]) {
        grouped[month] = {
          month,
          rejectionQuantity: 0,
          saleQuantity: 0,
        };
      }

      grouped[month].rejectionQuantity +=
        row.rejectionQuantity;

      grouped[month].saleQuantity +=
        row.saleQuantity;
    });

    return Object.values(grouped).sort(
      (a, b) =>
        a.month.localeCompare(b.month)
    );
  }, [data]);

  const locationSummary = useMemo(
    () => getLocationSummary(data),
    [data]
  );

  const partSummary = useMemo(
    () => getPartSummary(data),
    [data]
  );

  /* =====================================================
     MONTHLY REJECTION TREND
  ===================================================== */

  const monthlyChart = {
    x: monthlyData.map(
      (row) => row.month
    ),

    y: monthlyData.map(
      (row) =>
        row.rejectionQuantity
    ),

    type: "scatter",
    mode: "lines+markers",

    line: {
      width: 2,
    },

    marker: {
      size: 6,
    },

    hovertemplate:
      "Month: %{x}<br>" +
      "Rejections: %{y:,}<extra></extra>",
  };

  /* =====================================================
     REJECTIONS BY LOCATION
  ===================================================== */

  const locationChart = {
    x: locationSummary.map(
      (row) => row.location
    ),

    y: locationSummary.map(
      (row) =>
        row.rejectionQuantity
    ),

    type: "bar",

    hovertemplate:
      "%{x}<br>" +
      "Rejections: %{y:,}<extra></extra>",
  };

  /* =====================================================
     PPM BY LOCATION
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
      "%{x}<br>" +
      "PPM: %{y:,.0f}<extra></extra>",
  };

  /* =====================================================
     TOP 10 PARTS
  ===================================================== */

  const topParts = partSummary
    .slice(0, 10);

  const topPartsChart = {
    x: topParts.map(
      (row) =>
        row.rejectionQuantity
    ),

    y: topParts.map(
      (row) => row.partNo
    ),

    type: "bar",
    orientation: "h",

    hovertemplate:
      "Part: %{y}<br>" +
      "Rejections: %{x:,}<extra></extra>",
  };

  /* =====================================================
     PPM CONTROL CHART
  ===================================================== */

  const ppmValues =
    monthlyData.map((row) =>
      calculatePPM(
        row.rejectionQuantity,
        row.saleQuantity
      )
    );

  const ppmMean =
    ppmValues.length > 0
      ? ppmValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / ppmValues.length
      : 0;

  const variance =
    ppmValues.length > 1
      ? ppmValues.reduce(
          (sum, value) =>
            sum +
            Math.pow(
              value - ppmMean,
              2
            ),
          0
        ) / ppmValues.length
      : 0;

  const ppmStd =
    Math.sqrt(variance);

  const upperLimit =
    ppmMean +
    3 * ppmStd;

  const lowerLimit =
    Math.max(
      0,
      ppmMean -
        3 * ppmStd
    );

  const controlChartData = [
    {
      x: monthlyData.map(
        (row) => row.month
      ),

      y: ppmValues,

      type: "scatter",
      mode: "lines+markers",

      name: "PPM",

      line: {
        width: 2,
      },

      marker: {
        size: 6,
      },
    },

    {
      x: monthlyData.map(
        (row) => row.month
      ),

      y: monthlyData.map(
        () => ppmMean
      ),

      type: "scatter",
      mode: "lines",

      name: "Mean",

      line: {
        dash: "dash",
        width: 1.5,
      },
    },

    {
      x: monthlyData.map(
        (row) => row.month
      ),

      y: monthlyData.map(
        () => upperLimit
      ),

      type: "scatter",
      mode: "lines",

      name: "UCL",

      line: {
        dash: "dot",
        width: 1,
      },
    },

    {
      x: monthlyData.map(
        (row) => row.month
      ),

      y: monthlyData.map(
        () => lowerLimit
      ),

      type: "scatter",
      mode: "lines",

      name: "LCL",

      line: {
        dash: "dot",
        width: 1,
      },
    },
  ];

  return (
    <>
      <h2>Overview</h2>

      {/* =================================================
          ROW 1
      ================================================= */}

      <div className="two-col wide-left">

        <div className="plot-card">
          <PlotlyChart
            data={[monthlyChart]}
            layout={{
              title: {
                text:
                  "Monthly Rejection Trend",
                font: {
                  size: 13,
                },
              },

              xaxis: {
                title: "Month",
                type: "category",
              },

              yaxis: {
                title:
                  "Rejection Quantity",
              },

              height: 330,
            }}
          />
        </div>

        <div className="plot-card">
          <PlotlyChart
            data={[locationChart]}
            layout={{
              title: {
                text:
                  "Rejections by Location",
                font: {
                  size: 13,
                },
              },

              xaxis: {
                title: "Location",
              },

              yaxis: {
                title:
                  "Rejection Quantity",
              },

              height: 330,
            }}
          />
        </div>

      </div>

      {/* =================================================
          ROW 2
      ================================================= */}

      <div className="two-col">

        <div className="plot-card">
          <PlotlyChart
            data={[locationPPMChart]}
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
              },

              height: 330,
            }}
          />
        </div>

        <div className="plot-card">
          <PlotlyChart
            data={[topPartsChart]}
            layout={{
              title: {
                text:
                  "Top 10 Parts by Rejection",
                font: {
                  size: 13,
                },
              },

              xaxis: {
                title:
                  "Rejection Quantity",
              },

              yaxis: {
                title: "Part No.",
                automargin: true,
              },

              height: 330,

              margin: {
                l: 100,
                r: 25,
                t: 55,
                b: 50,
              },
            }}
          />
        </div>

      </div>

      {/* =================================================
          CONTROL CHART
      ================================================= */}

      <div className="two-col">

        <div className="plot-card">
          <PlotlyChart
            data={controlChartData}
            layout={{
              title: {
                text:
                  "PPM Control Chart · 3σ Limits",
                font: {
                  size: 13,
                },
              },

              xaxis: {
                title: "Month",
              },

              yaxis: {
                title: "PPM",
              },

              height: 330,
            }}
          />
        </div>

      </div>

      {/* =================================================
          TOP 10 PARTS TABLE
      ================================================= */}

      <h2>
        Top 10 Parts by Rejection Quantity
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
            </tr>
          </thead>

          <tbody>

            {topParts.map(
              (part, index) => (
                <tr
                  key={
                    `${part.partNo}-${index}`
                  }
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
                </tr>
              )
            )}

          </tbody>

        </table>

      </div>
    </>
  );
}

export default Overview;