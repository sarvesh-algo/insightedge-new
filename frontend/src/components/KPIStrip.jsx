import { calculateTotals } from "../data/dataEngine";

function KPICard({
  label,
  value,
}) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        {label}
      </div>

      <div className="kpi-value">
        {value}
      </div>
    </div>
  );
}

function KPIStrip({ data }) {
  const totals = calculateTotals(data);

  return (
    <div className="kpi-grid">

      <KPICard
        label="Total Rejections"
        value={totals.totalRejection.toLocaleString()}
      />

      <KPICard
        label="PPM"
        value={totals.ppm.toLocaleString(
          undefined,
          {
            maximumFractionDigits: 0,
          }
        )}
      />

      <KPICard
        label="Rejection Cost"
        value={`₹ ${(
          totals.totalRejectionCost / 100000
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} L`}
      />

      <KPICard
        label="Sale Quantity"
        value={totals.totalSale.toLocaleString()}
      />

      <KPICard
        label="Rejection Rate"
        value={`${totals.rejectionRate.toFixed(
          3
        )}%`}
      />

      <KPICard
        label="Affected Parts"
        value={totals.affectedParts.toLocaleString()}
      />

    </div>
  );
}

export default KPIStrip;