/**
 * FlowTable — 매매동향 모달 전용 표.
 *
 * MUI `<Table stickyHeader>` 는 스크롤 컨테이너 안에서 thead/tbody 폭이 어긋나므로
 * (Dolpha 표 함정 참고) div 기반인 EnhancedDataTable 을 쓴다.
 * EnhancedDataTable 의 기본값은 15컬럼짜리 자동매매 설정 표 기준이라
 * minWidth(1200px)·행 높이·페이지네이션을 모달용으로 덮어쓴다.
 */

import Box from "@mui/material/Box";
import EnhancedDataTable from "components/EnhancedDataTable";
import { COLORS, alpha } from "constants/styles";

const ROW_MIN_HEIGHT = "40px";
const SCROLL_HEIGHT = "380px";

export default function FlowTable({ columns, data, minWidth }) {
  const hoverBg = alpha(COLORS.CHARTBOOK.INK, 0.06);

  return (
    <Box sx={{ overflowX: "auto", mt: 1 }}>
      <EnhancedDataTable
        columns={columns}
        data={data}
        autoOptimizeColumns={false}
        pagination={false}
        fixedHeader
        fixedHeaderScrollHeight={SCROLL_HEIGHT}
        dense
        customStyles={{
          table: {
            style: { width: "100%", tableLayout: "auto", minWidth },
          },
          headRow: {
            style: {
              backgroundColor: COLORS.CHARTBOOK.GROUND,
              borderBottomWidth: "1px",
              borderBottomColor: COLORS.CHARTBOOK.GRID,
              fontSize: "13px",
              fontWeight: "bold",
              minHeight: ROW_MIN_HEIGHT,
            },
          },
          headCells: {
            style: { padding: "8px", whiteSpace: "nowrap" },
          },
          rows: {
            style: {
              minHeight: ROW_MIN_HEIGHT,
              fontSize: "13px",
              "&:nth-of-type(odd)": { backgroundColor: COLORS.CHARTBOOK.GROUND },
              "&:hover": { backgroundColor: `${hoverBg} !important` },
            },
          },
          cells: {
            style: { padding: "6px 8px" },
          },
        }}
      />
    </Box>
  );
}
