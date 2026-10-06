import Plot from "react-plotly.js";

const COLORS = {
  BG: "#07182c",
  CARD: "#0d2540",
  GRID: "rgba(151, 180, 210, 0.12)",
  TEXT: "#dce8f6",
  MUTED: "#8fa9c4",
  BLUE: "#2f8cff",
  CYAN: "#24c8d8",
  GREEN: "#34d399",
  LIME: "#70e36f",
  PURPLE: "#b05cff",
  ORANGE: "#f5a524",
  RED: "#ff5c72",
  YELLOW: "#f7c948",
};

function PlotlyChart({
  data,
  layout = {},
  config = {},
  style = {},
  className = "",
}) {
  const defaultLayout = {
    autosize: true,

    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",

    font: {
      family:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      color: COLORS.TEXT,
      size: 10,
    },

    margin: {
      l: 48,
      r: 25,
      t: 42,
      b: 45,
    },

    hovermode: "closest",

    xaxis: {
      color: COLORS.MUTED,

      tickfont: {
        size: 9,
        color: COLORS.MUTED,
      },

      title: {
        font: {
          size: 9,
          color: COLORS.MUTED,
        },
      },

      gridcolor: COLORS.GRID,
      zerolinecolor: COLORS.GRID,

      automargin: true,
    },

    yaxis: {
      color: COLORS.MUTED,

      tickfont: {
        size: 9,
        color: COLORS.MUTED,
      },

      title: {
        font: {
          size: 9,
          color: COLORS.MUTED,
        },
      },

      gridcolor: COLORS.GRID,
      zerolinecolor: COLORS.GRID,

      automargin: true,
    },

    legend: {
      font: {
        size: 9,
        color: COLORS.MUTED,
      },

      bgcolor: "rgba(0,0,0,0)",
    },

    ...layout,
  };

  const defaultConfig = {
    responsive: true,
    displaylogo: false,

    displayModeBar: false,

    scrollZoom: false,

    ...config,
  };

  return (
    <div
      className={`plot-card ${className}`}
      style={{
        width: "100%",
        minWidth: 0,
        minHeight: "300px",
        ...style,
      }}
    >
      <Plot
        data={data}
        layout={defaultLayout}
        config={defaultConfig}
        useResizeHandler
        style={{
          width: "100%",
          height: "100%",
          minHeight: "300px",
        }}
      />
    </div>
  );
}

export default PlotlyChart;