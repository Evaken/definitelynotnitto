import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The slip handed over at the end of a run, laid out like a real one: printed
 * on paper, splits down the page, elapsed time and speed at the bottom.
 */
export function TimingSlipCard({ slip, carName }) {
    if (slip.incomplete) {
        return (_jsxs("div", { className: "slip", children: [_jsx("h3", { className: "slip__heading", children: "Time Slip" }), _jsx("p", { className: "slip__subheading", children: carName }), _jsx("div", { className: "slip__row", children: _jsx("span", { children: "Run not completed" }) })] }));
    }
    return (_jsxs("div", { className: "slip", children: [_jsx("h3", { className: "slip__heading", children: "Time Slip" }), _jsxs("p", { className: "slip__subheading", children: [carName, " \u00B7 Quarter Mile"] }), _jsx(Row, { label: "R/T", value: slip.reactionTime.toFixed(3) }), _jsx(Row, { label: "60 ft", value: slip.sixtyFoot.toFixed(3) }), _jsx(Row, { label: "330 ft", value: slip.threeThirty.toFixed(3) }), _jsx(Row, { label: "1/8 ET", value: slip.eighthMileEt.toFixed(3) }), _jsx(Row, { label: "1/8 MPH", value: slip.eighthMileMph.toFixed(2) }), _jsx(Row, { label: "1000 ft", value: slip.thousandFoot.toFixed(3) }), _jsxs("div", { className: "slip__row slip__row--total", children: [_jsx("span", { children: "1/4 ET" }), _jsx("span", { children: slip.quarterMileEt.toFixed(3) })] }), _jsxs("div", { className: "slip__row slip__row--total", children: [_jsx("span", { children: "1/4 MPH" }), _jsx("span", { children: slip.quarterMileMph.toFixed(2) })] }), slip.foul && _jsx("div", { className: "slip__foul", children: "Red Light \u2014 Foul" })] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "slip__row", children: [_jsx("span", { children: label }), _jsx("span", { children: value })] }));
}
//# sourceMappingURL=TimingSlipCard.js.map