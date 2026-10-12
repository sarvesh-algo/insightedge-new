
import { useEffect, useMemo, useState, useCallback } from "react";

import Sidebar from "./components/Sidebar";
import Filters from "./components/Filters";
import KPIStrip from "./components/KPIStrip";
import DatasetManager from "./components/DatasetManager";

import Overview from "./pages/Overview";
import PPMDashboard from "./pages/PPMDashboard";
import LocationAnalysis from "./pages/LocationAnalysis";
import PartAnalysis from "./pages/PartAnalysis";
import DefectAnalysis from "./pages/DefectAnalysis";
import ProcessAnalysis from "./pages/ProcessAnalysis";
import MachineAnalysis from "./pages/MachineAnalysis";
import CostAnalysis from "./pages/CostAnalysis";

import {
  getCustomerComplaints,
  getDatasetPreview,
} from "./api/customerComplaints";

import {
  normalizeCustomerComplaints,
  filterData,
} from "./data/dataEngine";

function toInputDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function App() {
  const [activePage, setActivePage] = useState("overview");

  const [source, setSource] = useState("customer_complaints");
  const [rawData, setRawData] = useState([]);
  const [datasetPreview, setDatasetPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [processFilter, setProcessFilter] = useState([]);
  const [machineFilter, setMachineFilter] = useState([]);
  const [partFilter, setPartFilter] = useState([]);
  const [defectFilter, setDefectFilter] = useState([]);

  const [compareParts, setCompareParts] = useState([]);
  const [ppmSingle, setPpmSingle] = useState("ALL");

  const refreshDataset = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        if (source === "internal_rejections") {
          const preview = await getDatasetPreview(source);

          if (cancelled) return;

          setDatasetPreview(preview);
          setRawData([]);
          return;
        }

        const response = await getCustomerComplaints();

        if (cancelled) return;

        const normalized = normalizeCustomerComplaints(
          response.data || []
        );

        setRawData(normalized);
        setDatasetPreview(null);

        if (normalized.length > 0) {
          const dates = normalized
            .map((row) => row.date)
            .filter(Boolean)
            .sort();

          setStartDate(toInputDate(dates[0]));
          setEndDate(toInputDate(dates[dates.length - 1]));
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load dataset:", err);

        setError(
          `Unable to load ${
            source === "customer_complaints"
              ? "Customer Complaints"
              : "Internal Rejections"
          } data. Check that the backend is running and the dataset is available.`
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [source, refreshKey]);

  const filteredData = useMemo(() => {
    if (source !== "customer_complaints") return [];

    return filterData(rawData, {
      location: selectedLocation,
      startDate,
      endDate,
      processFilter,
      machineFilter,
      partFilter,
      defectFilter,
    });
  }, [
    source,
    rawData,
    selectedLocation,
    startDate,
    endDate,
    processFilter,
    machineFilter,
    partFilter,
    defectFilter,
  ]);

  function handleSourceChange(nextSource) {
    if (nextSource === source) return;

    setSource(nextSource);
    setSelectedLocation("ALL");

    setProcessFilter([]);
    setMachineFilter([]);
    setPartFilter([]);
    setDefectFilter([]);

    setCompareParts([]);
    setPpmSingle("ALL");
    setError("");
  }

  function renderPage() {
    switch (activePage) {
      case "overview":
        return <Overview data={filteredData} />;

      case "ppm":
        return (
          <PPMDashboard
            data={filteredData}
            compareParts={compareParts}
            ppmSingle={ppmSingle}
          />
        );

      case "location":
        return <LocationAnalysis data={filteredData} />;

      case "part":
        return <PartAnalysis data={filteredData} />;

      case "defect":
        return <DefectAnalysis data={filteredData} />;

      case "process":
        return <ProcessAnalysis data={filteredData} />;

      case "machine":
        return <MachineAnalysis data={filteredData} />;

      case "cost":
        return <CostAnalysis data={filteredData} />;

      default:
        return <Overview data={filteredData} />;
    }
  }

  if (loading) {
    return (
      <div className="app">
        <main className="main">
          <div className="welcome">
            <div className="welcome-mark">◇</div>
            <h1>Loading InsightEdge...</h1>
            <p>Loading the selected dataset.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        data={rawData}
        processFilter={processFilter}
        setProcessFilter={setProcessFilter}
        machineFilter={machineFilter}
        setMachineFilter={setMachineFilter}
        partFilter={partFilter}
        setPartFilter={setPartFilter}
        defectFilter={defectFilter}
        setDefectFilter={setDefectFilter}
        compareParts={compareParts}
        setCompareParts={setCompareParts}
        ppmSingle={ppmSingle}
        setPpmSingle={setPpmSingle}
      />

      <main className="main">
        <div className="page-head">
          <div>
            <div className="page-title">
              InsightEdge Quality Intelligence
            </div>
            <div className="page-sub">
              Quality, rejection and PPM performance
            </div>
          </div>

          <div className="page-sub">
            Executive Quality Dashboard
          </div>
        </div>

        <section className="dataset-source-panel">
          <div>
            <div className="dataset-source-label">DATA SOURCE</div>
            <div className="dataset-source-options">
              <button
                type="button"
                className={
                  source === "customer_complaints"
                    ? "dataset-source-button active"
                    : "dataset-source-button"
                }
                onClick={() => handleSourceChange("customer_complaints")}
              >
                Customer Complaints
              </button>

              <button
                type="button"
                className={
                  source === "internal_rejections"
                    ? "dataset-source-button active"
                    : "dataset-source-button"
                }
                onClick={() => handleSourceChange("internal_rejections")}
              >
                Internal Rejections
              </button>
            </div>
          </div>

          <div className="dataset-source-status">
            <span className="dataset-status-dot" />
            {source === "customer_complaints"
              ? `${rawData.length} loaded records`
              : `${datasetPreview?.rows ?? 0} preview records`}
          </div>
        </section>

        <DatasetManager
          source={source}
          onUploaded={refreshDataset}
        />

        {error ? (
          <div className="warning">{error}</div>
        ) : source === "internal_rejections" ? (
          <section className="dataset-placeholder">
            <h2>Internal Rejections</h2>
            <p>
              The files are stored and the preview endpoint is connected.
              Upload or select your dataset above. Dashboard charts will be
              enabled after the Internal Rejections columns are mapped.
            </p>

            {datasetPreview && (
              <>
                <div className="dataset-preview-stats">
                  <div>
                    <span>Combined rows</span>
                    <strong>{datasetPreview.rows}</strong>
                  </div>
                  <div>
                    <span>Locations detected</span>
                    <strong>
                      {datasetPreview.locations?.join(", ") || "None"}
                    </strong>
                  </div>
                </div>

                <h3>Detected columns</h3>
                <div className="dataset-column-list">
                  {datasetPreview.columns?.map((column) => (
                    <span key={column} className="dataset-column">
                      {column}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>
        ) : (
          <>
            <Filters
              data={rawData}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />

            {filteredData.length === 0 ? (
              <div className="warning">
                No rows match the current filters. Expand the date range or
                clear one or more sidebar filters.
              </div>
            ) : (
              <>
                {activePage !== "ppm" && (
                  <KPIStrip data={filteredData} />
                )}
                {renderPage()}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
