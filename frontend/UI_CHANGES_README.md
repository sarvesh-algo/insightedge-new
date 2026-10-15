# InsightEdge UI updates

This bundle contains the updated React/Vite source for the requested UI refinements.

## Included changes
- Coordinated multi-color palette for bar charts and distinct series colors for line charts.
- Removed gridlines from Monthly Rejection Trend, PPM Trend, and Monthly PPM by Location.
- Improved Top 10 Parts by Rejection with a sorted horizontal ranking, values, spacing, and readable labels.
- Changed Part Analysis Top 15 Parts by Rejection Quantity to a horizontal ranking chart.
- Changed Top 15 Parts by Rejection Cost to a horizontal ranking chart.
- Anchored sidebar multi-select dropdowns directly beneath their filter buttons.

## Apply
1. Stop the Vite dev server.
2. Back up your current `src` folder.
3. Extract this ZIP into your existing `quality-dashboard` folder, allowing the updated `src` files to overwrite the matching files.
4. Do not copy `node_modules` or `dist` from any other bundle.
5. Start the frontend with `npm run dev`.

The chart data calculations, data filters, KPI logic, API calls, and tables have been left in place.
