import { useEffect, useState } from "react";
import { fetchCustomerComplaints } from "./api/customerComplaints";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetchCustomerComplaints();

      setData(response.data || []);
    } catch (err) {
      console.error("Failed to load customer complaints:", err);

      setError(
        "Unable to connect to the InsightEdge backend."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          Loading Customer Complaints...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Backend Connection Error</h2>
          <p>{error}</p>

          <button onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>InsightEdge</h1>
          <p>Quality Intelligence</p>
        </div>

        <div className="data-source">
          Customer Complaints
        </div>
      </header>

      <main className="content">

        <section className="connection-card">

          <div>
            <span className="status-dot"></span>
            Backend Connected
          </div>

          <div>
            Records: <strong>{data.length}</strong>
          </div>

        </section>

        <section className="data-card">

          <div className="section-header">
            <div>
              <h2>Customer Complaint Data</h2>
              <p>
                Data loaded directly from the FastAPI backend.
              </p>
            </div>

            <button onClick={loadData}>
              Refresh
            </button>
          </div>

          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Part No.</th>
                  <th>Part Name</th>
                  <th>Defect</th>
                  <th>Rejection Qty</th>
                  <th>Sale Qty</th>
                  <th>Location</th>
                </tr>
              </thead>

              <tbody>

                {data.map((row, index) => (
                  <tr key={index}>

                    <td>
                      {row.date}
                    </td>

                    <td>
                      {row.part_no_clean}
                    </td>

                    <td>
                      {row.part_name_clean}
                    </td>

                    <td>
                      {row.defect}
                    </td>

                    <td>
                      {row["rejection quantity"]}
                    </td>

                    <td>
                      {row["sale quantity"]}
                    </td>

                    <td>
                      {row.location}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </section>

      </main>
    </div>
  );
}

export default App;