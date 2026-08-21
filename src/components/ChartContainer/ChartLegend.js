import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * 차트 pane별 지표 범례.
 * 좁은 pane에서 축 라벨이 겹치는 문제 때문에, 시리즈 식별은 범례가 담당한다.
 */
function ChartLegend({ groups }) {
  return (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 0.5, px: 0.5 }}
    >
      {groups.map((group) => (
        <Box key={group.title} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {group.title}
          </Typography>
          {group.items.map((item) => (
            <Box key={item.field} sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              <Box sx={{ width: 12, height: 2, borderRadius: 1, backgroundColor: item.color }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "11px" }}>
                {item.label}
              </Typography>
            </Box>
          ))}
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
};

export default ChartLegend;
