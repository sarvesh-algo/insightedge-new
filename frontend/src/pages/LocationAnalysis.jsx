import { useMemo } from "react";
import PlotlyChart from "../components/PlotlyChart";
import {
  calculatePPM,
  getLocationSummary,
} from "../data/dataEngine";

function LocationAnalysis({ data }) {
  const locationSummary = useMemo(
    () => getLocationSummary(data),
    [data]
  );

  const monthlyLocationData =
    useMemo(() => {
      const grouped = {};

      data.forEach((row) => {
        if (!row.date || !row.location) {
          return;
        }

        const month =
          row.date.slice(0, 7);

        const key =
          `${month}__${row.location}`;

        if (!grouped[key]) {
          grouped[key] = {
            month,
            location: row.location,
            rejectionQuantity: 0,
            saleQuantity: 0,
          };
        }

        grouped[key]
          .rejectionQuantity +=
          row.rejectionQuantity;

        grouped[key]
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

  const locations = Array.from(
    new Set(
      monthlyLocationData.map(
        (row) => row.location
      )
    )
  );

  /* =====================================================
     REJECTIONS BY LOCATION
  ===================================================== */

  const rejectionChart = {
    x: locationSummary.map(
      (row) => row.location
    ),

    y: locationSummary.map(
      (row) =>
        row.rejectionQuantity
    ),

    type: "bar",

    hovertemplate:
      "Location: %{x}<br>" +
      "Rejections: %{y:,}<extra></extra>",
  };

  /* =====================================================
     PPM BY LOCATION
  ===================================================== */

  const ppmChart = {
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
     MONTHLY LOCATION PPM
  ===================================================== */

  const monthlyTraces =
    locations.map(
      (location) => {
        const rows =
          monthlyLocationData.filter(
            (row) =>
              row.location ===
              location
          );

        return {
          x: rows.map(
            (row) => row.month
          ),

          y: rows.map(
            (row) => row.ppm
          ),

          type: "scatter",
          mode: "lines+markers",

          name: location,

          line: {
            width: 2,
          },

          marker: {
            size: 6,
          },

          hovertemplate:
            `${location}<br>` +
            "Month: %{x}<br>" +
            "PPM: %{y:,.0f}" +
            "<extra></extra>",
        };
      }
    );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">
            Location Analysis
          </div>

          <div className="page-sub">
            Rejection and PPM performance
            across locations
          </div>
        </div>
      </div>

      {/* =================================================
          ROW 1
      ================================================= */}

      <div className="two-col">

        <div className="plot-card">

          <PlotlyChart
            data={[
              rejectionChart,
            ]}
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
                rangemode:
                  "tozero",
              },

              height: 340,
            }}
          />

        </div>

        <div className="plot-card">

          <PlotlyChart
            data={[
              ppmChart,
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

              height: 340,
            }}
          />

        </div>

      </div>

      {/* =================================================
          MONTHLY PPM
      ================================================= */}

      <div className="two-col">

        <div className="plot-card">

          <PlotlyChart
            data={monthlyTraces}
            layout={{
              title: {
                text:
                  "Monthly PPM by Location",
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

              height: 360,

              legend: {
                orientation: "h",
              },
            }}
          />

        </div>

      </div>

      {/* =================================================
          LOCATION SUMMARY
      ================================================= */}

      <h2>
        Location Summary
      </h2>

      <div className="table-wrapper">

        <table>

          <thead>
            <tr>
              <th>Location</th>
              <th>Records</th>
              <th>Rejection Qty</th>
              <th>Sale Qty</th>
              <th>PPM</th>
              <th>Rejection Cost</th>
            </tr>
          </thead>

          <tbody>

            {locationSummary.map(
              (row) => (
                <tr
                  key={row.location}
                >
                  <td>
                    {row.location}
                  </td>

                  <td>
                    {row.records.toLocaleString()}
                  </td>

                  <td>
                    {row.rejectionQuantity.toLocaleString()}
                  </td>

                  <td>
                    {row.saleQuantity.toLocaleString()}
                  </td>

                  <td>
                    {row.ppm.toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 0,
                      }
                    )}
                  </td>

                  <td>
                    ₹{" "}
                    {row.rejectionCost.toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 2,
                      }
                    )}
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

export default LocationAnalysis;