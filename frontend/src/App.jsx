import { useEffect, useMemo, useState } from "react";

import Sidebar from "./components/Sidebar";
import Filters from "./components/Filters";
import KPIStrip from "./components/KPIStrip";

import Overview from "./pages/Overview";
import PPMDashboard from "./pages/PPMDashboard";
import LocationAnalysis from "./pages/LocationAnalysis";
import PartAnalysis from "./pages/PartAnalysis";
import DefectAnalysis from "./pages/DefectAnalysis";
import ProcessAnalysis from "./pages/ProcessAnalysis";
import MachineAnalysis from "./pages/MachineAnalysis";
import CostAnalysis from "./pages/CostAnalysis";

import { getCustomerComplaints } from "./api/customerComplaints";
import {
  normalizeCustomerComplaints,
  filterData,
} from "./data/dataEngine";

function toInputDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function App() {
  const [activePage, setActivePage] = useState("overview");

  const [rawData, setRawData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Top filters
  const [selectedLocation, setSelectedLocation] =
    useState("ALL");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sidebar filters
  const [processFilter, setProcessFilter] = useState([]);
  const [machineFilter, setMachineFilter] = useState([]);
  const [partFilter, setPartFilter] = useState([]);
  const [defectFilter, setDefectFilter] = useState([]);

  // PPM sidebar filters
  const [compareParts, setCompareParts] = useState([]);
  const [ppmSingle, setPpmSingle] = useState("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const response = await getCustomerComplaints();

        const normalized = normalizeCustomerComplaints(
          response.data || []
        );

        setRawData(normalized);

        if (normalized.length > 0) {
          const dates = normalized
            .map((row) => row.date)
            .filter(Boolean)
            .sort();

          setStartDate(toInputDate(dates[0]));
          setEndDate(
            toInputDate(dates[dates.length - 1])
          );
        }
      } catch (err) {
        console.error(
          "Failed to load Customer Complaints:",
          err
        );

        setError(
          "Unable to load Customer Complaints data from the backend."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredData = useMemo(() => {
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
    rawData,
    selectedLocation,
    startDate,
    endDate,
    processFilter,
    machineFilter,
    partFilter,
    defectFilter,
  ]);

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

            <h1>
              Loading InsightEdge...
            </h1>

            <p>
              Connecting to the Customer Complaints
              backend.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <main className="main">
          <div className="warning">
            {error}
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
              Real-time quality, rejection and PPM
              performance
            </div>
          </div>

          <div className="page-sub">
            Executive Quality Dashboard
          </div>

        </div>

        <Filters
          data={rawData}

          selectedLocation={selectedLocation}
          setSelectedLocation={
            setSelectedLocation
          }

          startDate={startDate}
          setStartDate={setStartDate}

          endDate={endDate}
          setEndDate={setEndDate}
        />

        {filteredData.length === 0 ? (
          <div className="warning">
            No rows match the current filters.
            Expand the date range or clear one or
            more sidebar filters.
          </div>
        ) : (
          <>
            {activePage !== "ppm" && (
              <KPIStrip
                data={filteredData}
              />
            )}

            {renderPage()}
          </>
        )}

      </main>
    </div>
  );
}

export default App;