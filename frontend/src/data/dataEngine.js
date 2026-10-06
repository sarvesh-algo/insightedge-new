function cleanNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(
    String(value).replace(/,/g, "")
  );

  return Number.isFinite(number) ? number : 0;
}

function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

export function normalizeCustomerComplaints(rows) {
  return rows
    .map((row) => {
      const date = row.date
        ? new Date(row.date)
        : null;

      return {
        ...row,

        date:
          date && !Number.isNaN(date.getTime())
            ? date.toISOString().slice(0, 10)
            : "",

        partNo: cleanText(
          row.part_no_clean
        ),

        partName: cleanText(
          row.part_name_clean
        ),

        defect: cleanText(
          row.defect
        ),

        defectDescription: cleanText(
          row.defect_description
        ),

        process: cleanText(
          row.process
        ),

        processDescription: cleanText(
          row.process_description
        ),

        unitLocation: cleanText(
          row.unit_location
        ),

        machine: cleanText(
          row.machine
        ),

        location: cleanText(
          row.location
        ),

        rejectionQuantity:
          cleanNumber(
            row["rejection quantity"]
          ),

        saleQuantity:
          cleanNumber(
            row["sale quantity"]
          ),

        costPerPart:
          cleanNumber(
            row["cost per part"]
          ),

        rejectionCost:
          cleanNumber(
            row["rejection cost"]
          ),

        debitCost:
          cleanNumber(
            row["debit cost"]
          ),

        totalRejectionCost:
          cleanNumber(
            row["total rejection cost"]
          ),

        monthStart:
          row.month_start
            ? String(row.month_start).slice(
                0,
                10
              )
            : "",
      };
    })
    .filter(
      (row) =>
        row.date &&
        row.partNo
    );
}

/* =========================================================
   PPM
========================================================= */

export function calculatePPM(
  rejectionQuantity,
  saleQuantity
) {
  const rejection =
    cleanNumber(rejectionQuantity);

  const sale =
    cleanNumber(saleQuantity);

  if (sale <= 0) {
    return 0;
  }

  return (
    rejection * 1000000
  ) / sale;
}

/* =========================================================
   TOTALS
========================================================= */

export function calculateTotals(
  data
) {
  const totalRejection =
    data.reduce(
      (sum, row) =>
        sum +
        cleanNumber(
          row.rejectionQuantity
        ),
      0
    );

  const totalSale =
    data.reduce(
      (sum, row) =>
        sum +
        cleanNumber(
          row.saleQuantity
        ),
      0
    );

  const totalRejectionCost =
    data.reduce(
      (sum, row) =>
        sum +
        cleanNumber(
          row.totalRejectionCost
        ),
      0
    );

  const ppm =
    calculatePPM(
      totalRejection,
      totalSale
    );

  const rejectionRate =
    totalSale > 0
      ? (totalRejection /
          totalSale) *
        100
      : 0;

  const affectedParts =
    new Set(
      data
        .filter(
          (row) =>
            row.rejectionQuantity > 0
        )
        .map(
          (row) =>
            row.partNo
        )
        .filter(Boolean)
    ).size;

  return {
    totalRejection,
    totalSale,
    totalRejectionCost,
    ppm,
    rejectionRate,
    affectedParts,
  };
}

/* =========================================================
   FILTERING
========================================================= */

export function filterData(
  data,
  {
    location = "ALL",
    startDate = "",
    endDate = "",
    processFilter = [],
    machineFilter = [],
    partFilter = [],
    defectFilter = [],
  } = {}
) {
  return data.filter((row) => {

    /* LOCATION */

    if (
      location &&
      location !== "ALL" &&
      location !== "All" &&
      row.location !== location
    ) {
      return false;
    }

    /* DATE */

    if (
      startDate &&
      row.date < startDate
    ) {
      return false;
    }

    if (
      endDate &&
      row.date > endDate
    ) {
      return false;
    }

    /* PROCESS */

    if (
      processFilter.length > 0 &&
      !processFilter.includes(
        row.process
      )
    ) {
      return false;
    }

    /* MACHINE */

    if (
      machineFilter.length > 0 &&
      !machineFilter.includes(
        row.machine
      )
    ) {
      return false;
    }

    /* PART */

    if (
      partFilter.length > 0 &&
      !partFilter.includes(
        row.partNo
      )
    ) {
      return false;
    }

    /* DEFECT */

    if (
      defectFilter.length > 0 &&
      !defectFilter.includes(
        row.defect
      )
    ) {
      return false;
    }

    return true;
  });
}

/* =========================================================
   LOCATION SUMMARY
========================================================= */

export function getLocationSummary(
  data
) {
  const grouped = {};

  data.forEach((row) => {
    const location =
      row.location || "Unknown";

    if (!grouped[location]) {
      grouped[location] = {
        location,
        records: 0,
        rejectionQuantity: 0,
        saleQuantity: 0,
        rejectionCost: 0,
      };
    }

    grouped[location].records += 1;

    grouped[location]
      .rejectionQuantity +=
      row.rejectionQuantity;

    grouped[location]
      .saleQuantity +=
      row.saleQuantity;

    grouped[location]
      .rejectionCost +=
      row.totalRejectionCost;
  });

  return Object.values(grouped)
    .map((row) => ({
      ...row,
      ppm: calculatePPM(
        row.rejectionQuantity,
        row.saleQuantity
      ),
    }))
    .sort(
      (a, b) =>
        b.rejectionQuantity -
        a.rejectionQuantity
    );
}

/* =========================================================
   PART SUMMARY
========================================================= */

export function getPartSummary(
  data
) {
  const grouped = {};

  data.forEach((row) => {
    const part =
      row.partNo || "Unknown";

    if (!grouped[part]) {
      grouped[part] = {
        partNo: part,
        partName:
          row.partName || "",
        rejectionQuantity: 0,
        saleQuantity: 0,
        rejectionCost: 0,
        totalRejectionCost: 0,
        locations: new Set(),
      };
    }

    grouped[part]
      .rejectionQuantity +=
      row.rejectionQuantity;

    grouped[part]
      .saleQuantity +=
      row.saleQuantity;

    grouped[part]
      .rejectionCost +=
      row.rejectionCost;

    grouped[part]
      .totalRejectionCost +=
      row.totalRejectionCost;

    if (row.location) {
      grouped[part]
        .locations
        .add(row.location);
    }
  });

  return Object.values(grouped)
    .map((row) => ({
      ...row,

      location:
        Array.from(
          row.locations
        ).join(", "),

      ppm: calculatePPM(
        row.rejectionQuantity,
        row.saleQuantity
      ),
    }))
    .sort(
      (a, b) =>
        b.rejectionQuantity -
        a.rejectionQuantity
    );
}

/* =========================================================
   DEFECT SUMMARY
========================================================= */

export function getDefectSummary(
  data
) {
  const grouped = {};

  data.forEach((row) => {
    const defect =
      row.defect || "Unknown";

    if (!grouped[defect]) {
      grouped[defect] = {
        defect,
        rejectionQuantity: 0,
        records: 0,
      };
    }

    grouped[defect].records += 1;

    grouped[defect]
      .rejectionQuantity +=
      row.rejectionQuantity;
  });

  return Object.values(grouped)
    .sort(
      (a, b) =>
        b.rejectionQuantity -
        a.rejectionQuantity
    );
}

/* =========================================================
   PROCESS SUMMARY
========================================================= */

export function getProcessSummary(
  data
) {
  const grouped = {};

  data.forEach((row) => {
    const process =
      row.process || "Unknown";

    if (!grouped[process]) {
      grouped[process] = {
        process,
        rejectionQuantity: 0,
        records: 0,
      };
    }

    grouped[process].records += 1;

    grouped[process]
      .rejectionQuantity +=
      row.rejectionQuantity;
  });

  return Object.values(grouped)
    .sort(
      (a, b) =>
        b.rejectionQuantity -
        a.rejectionQuantity
    );
}

/* =========================================================
   MACHINE SUMMARY
========================================================= */

export function getMachineSummary(
  data
) {
  const grouped = {};

  data.forEach((row) => {
    const machine =
      row.machine || "Unknown";

    if (!grouped[machine]) {
      grouped[machine] = {
        machine,
        rejectionQuantity: 0,
        records: 0,
      };
    }

    grouped[machine].records += 1;

    grouped[machine]
      .rejectionQuantity +=
      row.rejectionQuantity;
  });

  return Object.values(grouped)
    .sort(
      (a, b) =>
        b.rejectionQuantity -
        a.rejectionQuantity
    );
}