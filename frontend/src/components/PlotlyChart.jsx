import Plot from "react-plotly.js";

const PALETTE = [
  "#36B7A8", // teal
  "#F07C65", // coral
  "#F2B84B", // amber
  "#9B8AFB", // violet
  "#56C596", // green
  "#4DA8DA", // sky
  "#D979B8", // rose
  "#E89A54", // orange
  "#75B7A5", // sage
  "#A5A0E8", // lavender
];

const COLORS = {
  GRID: "rgba(151, 180, 210, 0.10)",
  TEXT: "#dce8f6",
  MUTED: "#8fa9c4",
};

function PlotlyChart({
  data,
  layout = {},
  config = {},
  style = {},
  className = "",
}) {
  // Give bar categories distinct, coordinated colors instead of making
  // every bar the same blue. Preserve any explicit color set by a page.
  const styledData = data.map((trace, traceIndex) => {
    if (trace.type === "bar") {
      const pointCount = Math.max(
        trace.x?.length || 0,
        trace.y?.length || 0,
        trace.labels?.length || 0,
      );

      return {
        ...trace,
        marker: {
          ...(trace.marker || {}),
          color:
            trace.marker?.color ??
            Array.from(
              { length: pointCount },
              (_, index) => PALETTE[index % PALETTE.length],
            ),
          line: {
            color: "rgba(255,255,255,0.12)",
            width: 0.5,
            ...(trace.marker?.line || {}),
          },
        },
      };
    }

    if (trace.type === "scatter" && (trace.mode || "").includes("lines")) {
      const color = trace.line?.color || PALETTE[traceIndex % PALETTE.length];
      return {
        ...trace,
        line: {
          ...(trace.line || {}),
          color,
        },
        marker: {
          ...(trace.marker || {}),
          color: trace.marker?.color || color,
        },
      };
    }

    return trace;
  });

  const defaultMargin = {
    l: 55,
    r: 30,
    t: 48,
    b: 50,
  };

  const defaultAxis = {
    color: COLORS.MUTED,
    tickfont: {
      size: 10,
      color: COLORS.MUTED,
    },
    title: {
      font: {
        size: 10,
        color: COLORS.MUTED,
      },
    },
    gridcolor: COLORS.GRID,
    zerolinecolor: COLORS.GRID,
    automargin: true,
  };

  const defaultLayout = {
    autosize: true,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    colorway: PALETTE,
    hovermode: "closest",
    ...layout,
    font: {
      family:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      color: COLORS.TEXT,
      size: 11,
      ...(layout.font || {}),
    },
    margin: {
      ...defaultMargin,
      ...(layout.margin || {}),
    },
    xaxis: {
      ...defaultAxis,
      ...(layout.xaxis || {}),
      title:
        typeof layout.xaxis?.title === "string"
          ? layout.xaxis.title
          : {
              ...defaultAxis.title,
              ...(layout.xaxis?.title || {}),
            },
      tickfont: {
        ...defaultAxis.tickfont,
        ...(layout.xaxis?.tickfont || {}),
      },
    },
    yaxis: {
      ...defaultAxis,
      ...(layout.yaxis || {}),
      title:
        typeof layout.yaxis?.title === "string"
          ? layout.yaxis.title
          : {
              ...defaultAxis.title,
              ...(layout.yaxis?.title || {}),
            },
      tickfont: {
        ...defaultAxis.tickfont,
        ...(layout.yaxis?.tickfont || {}),
      },
    },
    legend: {
      bgcolor: "rgba(0,0,0,0)",
      ...(layout.legend || {}),
      font: {
        size: 10,
        color: COLORS.MUTED,
        ...(layout.legend?.font || {}),
      },
    },
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
        data={styledData}
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
