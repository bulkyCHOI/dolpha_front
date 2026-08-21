import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * 차트 지표 범례.
 *
 * 좁은 pane에서는 축 라벨이 겹치므로 시리즈 식별은 범례가 담당한다.
 * 크로스헤어 위치의 값(values)을 함께 보여주고, 항목을 누르면 해당
 * 계열을 숨기거나 다시 보인다 (Chart.js 기본 범례가 하던 동작).
 */
function formatValue(value) {
  if (value == null || Number.isNaN(value)) return null;
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
  return rounded.toLocaleString("ko-KR");
}

function ChartLegend({ groups, values, hiddenIds, onToggle }) {
  return (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 0.5, px: 0.5 }}
    >
      {groups.map((group) => (
        <Box key={group.title} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {group.title}
          </Typography>
          {group.items.map((item) => {
            const isHidden = hiddenIds.includes(item.field);
            const value = values ? formatValue(values[item.field]) : null;

            return (
              <Box
                key={item.field}
                component={onToggle ? "button" : "div"}
                type={onToggle ? "button" : undefined}
                onClick={onToggle ? () => onToggle(item.field) : undefined}
                title={onToggle ? "클릭하면 표시/숨김" : undefined}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  border: "none",
                  background: "none",
                  p: 0,
                  cursor: onToggle ? "pointer" : "default",
                  opacity: isHidden ? 0.35 : 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <Box sx={{ width: 12, height: 2, borderRadius: 1, backgroundColor: item.color }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "11px" }}>
                  {item.label}
                </Typography>
                {value !== null && !isHidden && (
                  <Typography
                    variant="caption"
                    sx={{ color: item.color, fontSize: "11px", fontWeight: 600 }}
                  >
                    {value}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

ChartLegend.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          field: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          color: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  /** 크로스헤어 위치의 시리즈별 값 { [field]: number } */
  values: PropTypes.object,
  /** 숨긴 시리즈 id 목록 */
  hiddenIds: PropTypes.arrayOf(PropTypes.string),
  /** 항목 클릭 핸들러. 주지 않으면 토글 불가(표시 전용) */
  onToggle: PropTypes.func,
};

ChartLegend.defaultProps = {
  values: null,
  hiddenIds: [],
  onToggle: undefined,
};

export default ChartLegend;
