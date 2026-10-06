import { useMemo } from "react";

import PlotlyChart from "../components/PlotlyChart";

import {
  calculatePPM,
  getPartSummary,
  getLocationSummary,
} from "../data/dataEngine";


function PPMDashboard({ data }) {

  // ========================================================
  // LOCATION PPM
  // ========================================================

  const locationSummary = useMemo(
    () => getLocationSummary(data),
    [data]
  );


  // ========================================================
  // TOP 10 PARTS BY PPM
  // ========================================================

  const topPartsByPPM = useMemo(() => {

    return getPartSummary(data)
      .filter(
        (part) =>
          part.saleQuantity > 0
      )
      .sort(
        (a, b) => b.ppm - a.ppm
      )
      .slice(0, 10);

  }, [data]);


  // ========================================================
  // MONTHLY PPM
  // ========================================================

  const monthlyPPM = useMemo(() => {

    const grouped = {};

    data.forEach((row) => {

      if (!row.month_start) {
        return;
      }

      const month =
        row.month_start
          .toISOString()
          .slice(0, 7);

      if (!grouped[month]) {
        grouped[month] = {
          rejection: 0,
          sale: 0,
        };
      }

      grouped[month].rejection +=
        row.rejectionQuantity;

      grouped[month].sale +=
        row.saleQuantity;
    });


    return Object.entries(grouped)
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .map(
        ([month, values]) => ({
          month,
          ppm: calculatePPM(
            values.rejection,
            values.sale
          ),
        })
      );

  }, [data]);


  // ========================================================
  // LOCATION CHART
  // ========================================================

  const locationChart = [
    {
      x: locationSummary.map(
        (item) => item.location
      ),

      y: locationSummary.map(
        (item) => item.ppm
      ),

      type: "bar",

      name: "PPM",

      marker: {
        color: "#5b8def",
      },
    },
  ];


  // ========================================================
  // MONTHLY TREND CHART
  // ========================================================

  const trendChart = [
    {
      x: monthlyPPM.map(
        (item) => item.month
      ),

      y: monthlyPPM.map(
        (item) => item.ppm
      ),

      type: "scatter",

      mode: "lines+markers",

      name: "PPM",

      line: {
        color: "#8b7cf6",
        width: 3,
      },

      marker: {
        size: 7,
      },
    },
  ];


  // ========================================================
  // COMMON LAYOUT
  // ========================================================

  const commonLayout = {

    paper_bgcolor: "transparent",

    plot_bgcolor: "transparent",

    font: {
      color: "#cbd2dc",
    },

    margin: {
      l: 60,
      r: 25,
      t: 35,
      b: 65,
    },

    xaxis: {
      gridcolor: "#242c36",
      zerolinecolor: "#303844",
      color: "#8f99a8",
    },

    yaxis: {
      gridcolor: "#242c36",
      zerolinecolor: "#303844",
      color: "#8f99a8",
    },
  };


  return (
    <div className="analysis-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="page-header">

        <div>

          <div className="page-eyebrow">
            CUSTOMER COMPLAINTS
          </div>

          <h2>
            PPM Dashboard
          </h2>

          <p>
            Parts-per-million quality performance
            across locations and time.
          </p>

        </div>

      </div>


      {/* ==================================================
          TOP CHARTS
      ================================================== */}

      <div className="chart-grid">

        {/* -----------------------------------------------
            LOCATION BY PPM
        ----------------------------------------------- */}

        <div className="chart-card">

          <div className="chart-card-header">

            <div>

              <h3>
                Location by PPM
              </h3>

              <p>
                PPM comparison across locations
              </p>

            </div>

          </div>

          <PlotlyChart
            data={locationChart}
            layout={{
              ...commonLayout,

              xaxis: {
                ...commonLayout.xaxis,

                title: {
                  text: "Location",
                },
              },

              yaxis: {
                ...commonLayout.yaxis,

                title: {
                  text: "PPM",
                },

                rangemode: "tozero",
              },
            }}

            style={{
              height: "360px",
            }}
          />

        </div>


        {/* -----------------------------------------------
            PPM TREND
        ----------------------------------------------- */}

        <div className="chart-card">

          <div className="chart-card-header">

            <div>

              <h3>
                PPM Trend
              </h3>

              <p>
                Monthly customer complaint PPM
              </p>

            </div>

          </div>

          <PlotlyChart
            data={trendChart}
            layout={{
              ...commonLayout,

              xaxis: {
                ...commonLayout.xaxis,

                title: {
                  text: "Month",
                },
              },

              yaxis: {
                ...commonLayout.yaxis,

                title: {
                  text: "PPM",
                },

                rangemode: "tozero",
              },
            }}

            style={{
              height: "360px",
            }}
          />

        </div>

      </div>


      {/* ==================================================
          TOP 10 PARTS BY PPM
      ================================================== */}

      <div className="table-card">

        <div className="chart-card-header">

          <div>

            <h3>
              Top 10 Parts by PPM
            </h3>

            <p>
              Parts with the highest calculated
              customer complaint PPM.
            </p>

          </div>

        </div>


        <div className="table-wrapper">

          <table className="dashboard-table">

            <thead>

              <tr>

                <th>
                  Rank
                </th>

                <th>
                  Part No.
                </th>

                <th>
                  Part Description
                </th>

                <th>
                  Rejection Qty
                </th>

                <th>
                  Location
                </th>

                <th>
                  PPM
                </th>

              </tr>

            </thead>


            <tbody>

              {topPartsByPPM.map(
                (part, index) => (

                  <tr
                    key={part.partNo}
                  >

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {part.partNo}
                    </td>

                    <td>
                      {part.partName || "-"}
                    </td>

                    <td>
                      {part.rejectionQuantity.toLocaleString()}
                    </td>

                    <td>
                      {part.locations.join(", ") || "-"}
                    </td>

                    <td>
                      {part.ppm.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
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

      </div>

    </div>
  );
}


export default PPMDashboard;