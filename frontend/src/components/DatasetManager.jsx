
import { useState } from "react";
import { uploadDatasetFile } from "../api/customerComplaints";

const LOCATIONS = [
  { value: "pune", label: "Pune" },
  { value: "lkn", label: "LKN" },
  { value: "jsr", label: "JSR" },
];

export default function DatasetManager({ source, onUploaded }) {
  const [location, setLocation] = useState("pune");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) {
      setError("Choose an Excel or CSV file first.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const result = await uploadDatasetFile({
        source,
        location,
        file,
      });

      setMessage(result.message);
      setFile(null);

      if (onUploaded) {
        await onUploaded();
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Upload failed. Check that the backend is running."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="dataset-manager">
      <div className="dataset-manager-heading">
        <div>
          <h3>Upload dataset</h3>
          <p>Upload the latest file for a location.</p>
        </div>
      </div>

      <div className="dataset-manager-controls">
        <label>
          Location
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            {LOCATIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Excel / CSV file
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) =>
              setFile(event.target.files?.[0] || null)
            }
          />
        </label>

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? "Uploading..." : "Upload file"}
        </button>
      </div>

      {message && <p className="upload-success">{message}</p>}
      {error && <p className="upload-error">{error}</p>}
    </section>
  );
}
