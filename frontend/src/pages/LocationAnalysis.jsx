import { useMemo } from "react";

import PlotlyChart from "../components/PlotlyChart";

import {
  getLocationSummary,
} from "../data/dataEngine";


function LocationAnalysis({ data }) {

  const locationSummary = useMemo(
    () => getLocationSummary(data),
    [data]
  );


  const rejectionChart = [
    {
      x: locationSummary.map(
        (item) => item.location
      ),

      y: locationSummary.map(
        (item) =>
          item.rejectionQuantity
      ),

      type: "bar",

      name: "Rejections",

      marker: {
        color: "#5b8def",
      },
    },
  ];


  const ppmChart = [
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
        color: "#8b7cf6",
      },
    },
  ];


  const trendData = useMemo(() => {

    const grouped = {};

    data.forEach((row) => {

      if (!row.month_start) {
        return;
      }

      const month =
        row.month_start
          .toISOString()
          .slice(0, 7);

      const location =
        row.location || "Unknown";

      if (!grouped[location]) {
        grouped[location] = {};
      }

      if (!grouped[location][month]) {
        grouped[location][month] = {
          rejection: 0,
          sale: 0,
        };
      }

      grouped[location][month].rejection +=
        row.rejectionQuantity;

      grouped[location][month].sale +=
        row.saleQuantity;
    });

    return grouped;

  }, [data]);


  const trendChart = Object.entries(
    trendData
  ).map(
    ([location, months]) => {

      const sortedMonths =
        Object.keys(months).sort();

      return {
        x: sortedMonths,

        y: sortedMonths.map(
          (month) => {

            const values =
              months[month];

            if (!values.sale) {
              return 0;
            }

            return (
              values.rejection *
              1000000 /
              values.sale
            );
          }
        ),

        type: "scatter",

        mode: "lines+markers",

        name: location,

        line: {
          width: 3,
        },

        marker: {
          size: 6,
        },
      };
    }
  );


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

      <div className="page-header">

        <div>

          <div className="page-eyebrow">
            CUSTOMER COMPLAINTS
          </div>

          <h2>
            Location Analysis
          </h2>

          <p>
            Quality performance across
            manufacturing locations.
          </p>

        </div>

      </div>


      <div className="chart-grid">

        <div className="chart-card">

          <div className="chart-card-header">

            <div>

              <h3>
                Rejection by Location
              </h3>

              <p>
                Total rejection quantity
              </p>

            </div>

          </div>

          <PlotlyChart
            data={rejectionChart}
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
                  text: "Rejection Quantity",
                },

                rangemode: "tozero",
              },
            }}
            style={{
              height: "360px",
            }}
          />

        </div>


        <div className="chart-card">

          <div className="chart-card-header">

            <div>

              <h3>
                PPM by Location
              </h3>

              <p>
                Customer complaint PPM
              </p>

            </div>

          </div>

          <PlotlyChart
            data={ppmChart}
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

      </div>


      <div className="chart-card full-width">

        <div className="chart-card-header">

          <div>

            <h3>
              Location PPM Trend
            </h3>

            <p>
              Monthly PPM trend by location
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
            height: "390px",
          }}
        />

      </div>


      <div className="table-card">

        <div className="chart-card-header">

          <div>

            <h3>
              Location Quality Summary
            </h3>

            <p>
              Consolidated quality metrics
              for each location.
            </p>

          </div>

        </div>


        <div className="table-wrapper">

          <table className="dashboard-table">

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
                (item) => (

                  <tr
                    key={item.location}
                  >

                    <td>
                      {item.location}
                    </td>

                    <td>
                      {item.records.toLocaleString()}
                    </td>

                    <td>
                      {item.rejectionQuantity.toLocaleString()}
                    </td>

                    <td>
                      {item.saleQuantity.toLocaleString()}
                    </td>

                    <td>
                      {item.ppm.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>

                    <td>
                      {item.rejectionCost.toLocaleString(
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


export default LocationAnalysis;