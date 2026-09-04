/**
 * EnhancedDataTable - 자동 컬럼 최적화를 지원하는 DataTable
 */

import DataTable from "react-data-table-component";
import styled from "styled-components";
import { COLORS, alpha } from "constants/styles";

const MONO_STACK = "'Fragment Mono', 'Monaco', monospace";
const HEADER_STACK = "'Archivo', 'Helvetica', 'Arial', sans-serif";

const StyledEnhancedDataTable = styled(DataTable)`
  /*
   * Chartbook 세계: 평면 지면, 헤어라인 구분선, 모노 숫자.
   * react-data-table-component 는 표·헤더·셀에 흰 배경과 rgba(0, 0, 0, 0.87)
   * 글자를 기본값으로 깐다. 배경만 덮으면 다크에서 표 바깥 테두리가 흰 판으로
   * 남고 글자는 검은색 그대로다. 배경과 글자를 함께 지정해야 한다.
   */
  .rdt_Table {
    width: 100%;
    background-color: ${COLORS.CHARTBOOK.GROUND};
    color: ${COLORS.CHARTBOOK.INK};
    border-radius: 0;
    box-shadow: none;
  }

  .rdt_TableHeadRow {
    background-color: ${COLORS.CHARTBOOK.GROUND};
    color: ${COLORS.CHARTBOOK.INK};
    border-bottom: 1px solid ${COLORS.CHARTBOOK.GRID};
    font-weight: bold;
    font-family: ${HEADER_STACK};
  }

  .rdt_TableRow {
    transition: background-color 0.2s ease;
    background-color: ${COLORS.CHARTBOOK.GROUND};
    color: ${COLORS.CHARTBOOK.INK};
    border-bottom: 1px solid ${COLORS.CHARTBOOK.GRID};
    &:nth-of-type(odd) {
      background-color: ${COLORS.CHARTBOOK.GROUND};
    }
    &:hover {
      background-color: ${alpha(COLORS.CHARTBOOK.INK, 0.06)} !important;
    }
  }

  .rdt_TableCell {
    padding: 12px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: ${MONO_STACK};
    font-variant-numeric: tabular-nums;
  }

  .rdt_TableCol {
    padding: 16px 8px;
    color: ${COLORS.CHARTBOOK.INK};
    font-weight: bold;
    font-family: ${HEADER_STACK};
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: unset !important;
    word-break: keep-all;
  }

  .rdt_TableCol_Sortable {
    white-space: normal !important;
    overflow: visible !important;
    word-break: keep-all;
  }

  .rdt_TableCol_Sortable::after {
    fill: ${COLORS.CHARTBOOK.INK};
  }

  .rdt_Pagination {
    background-color: ${COLORS.CHARTBOOK.GROUND};
    color: ${COLORS.CHARTBOOK.INK};
    border-top: 1px solid ${COLORS.CHARTBOOK.GRID};

    button {
      fill: ${COLORS.CHARTBOOK.INK};
      color: ${COLORS.CHARTBOOK.INK};
    }
    button:disabled {
      fill: ${COLORS.TEXT_MUTED};
      color: ${COLORS.TEXT_MUTED};
    }
    select {
      background-color: ${COLORS.CHARTBOOK.GROUND};
      color: ${COLORS.CHARTBOOK.INK};
      border: 1px solid ${COLORS.CHARTBOOK.GRID};
    }
  }
`;

/**
 * customStyles 를 섹션 단위로 병합한다.
 *
 * 페이지가 customStyles 를 통째로 넘기면 아래 기본값이 전부 사라진다.
 * 그러면 react-data-table-component 자체 테마(호버 #EEEEEE · 줄무늬 #FAFAFA)가
 * 되살아나 다크에서 행이 흰 판으로 뜬다. 넘긴 섹션만 덮어쓴다.
 */
const mergeCustomStyles = (base, override = {}) =>
  Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(override)])].map((section) => [
      section,
      { ...base[section], ...override[section] },
    ])
  );

const EnhancedDataTable = ({
  columns,
  data,
  autoOptimizeColumns = true,
  customStyles,
  ...props
}) => {
  // 컬럼 너비 자동 최적화
  const optimizedColumns = autoOptimizeColumns
    ? columns.map((column) => {
        // width 속성 제거하여 자동 크기 조정 활성화
        const { width, ...columnWithoutWidth } = column;

        // 컬럼 타입에 따른 최적화된 스타일 적용
        let optimizedColumn = { ...columnWithoutWidth };

        // 종목명 컬럼 최적화
        if (column.name === "종목") {
          optimizedColumn.width = "170px";
          optimizedColumn.style = {
            minWidth: "140px",
            maxWidth: "200px",
          };
        }

        // 액션 컬럼 최적화
        if (column.name === "액션") {
          optimizedColumn.width = "160px";
          optimizedColumn.style = {
            minWidth: "160px",
          };
        }

        // 긴 텍스트 컬럼 최적화
        if (["보유정보", "평가손익"].includes(column.name)) {
          optimizedColumn.grow = 1;
          optimizedColumn.style = {
            minWidth: "120px",
          };
        }

        // 짧은 값 컬럼 최적화
        if (["상태", "손절", "익절"].includes(column.name)) {
          optimizedColumn.width = "70px";
          optimizedColumn.style = {
            minWidth: "60px",
            maxWidth: "80px",
          };
        }

        return optimizedColumn;
      })
    : columns;

  return (
    <StyledEnhancedDataTable
      columns={optimizedColumns}
      data={data}
      pagination
      paginationPerPage={20}
      paginationRowsPerPageOptions={[10, 20, 30, 50]}
      highlightOnHover
      striped
      responsive
      defaultSortFieldId={1}
      defaultSortAsc={true}
      noHeader={false}
      subHeader={false}
      persistTableHead
      dense={false}
      customStyles={mergeCustomStyles(
        {
          table: {
            style: {
              width: "100%",
              tableLayout: "auto", // 자동 레이아웃으로 변경
              minWidth: "1200px", // 최소 너비 보장
            },
          },
          headRow: {
            style: {
              backgroundColor: COLORS.CHARTBOOK.GROUND,
              color: COLORS.CHARTBOOK.INK,
              borderBottomWidth: "1px",
              borderBottomColor: COLORS.CHARTBOOK.GRID,
              fontSize: "14px",
              fontWeight: "bold",
              fontFamily: HEADER_STACK,
            },
          },
          headCells: {
            style: {
              whiteSpace: "normal",
              overflow: "visible",
              textOverflow: "unset",
              wordBreak: "keep-all",
            },
          },
          rows: {
            style: {
              minHeight: "65px",
              backgroundColor: COLORS.CHARTBOOK.GROUND,
              color: COLORS.CHARTBOOK.INK,
              borderBottomColor: COLORS.CHARTBOOK.GRID,
              "&:nth-of-type(odd)": {
                backgroundColor: COLORS.CHARTBOOK.GROUND,
              },
              "&:hover": {
                backgroundColor: `${alpha(COLORS.CHARTBOOK.INK, 0.06)} !important`,
              },
            },
            /**
             * highlightOnHover · striped 를 켜면 라이브러리가 자체 테마 값을
             * rows.style 뒤에 덧붙인다 (호버 #EEEEEE, 줄무늬 #FAFAFA).
             * 여기서 덮지 않으면 다크에서 행 하나가 흰 판으로 뜬다.
             */
            highlightOnHoverStyle: {
              backgroundColor: alpha(COLORS.CHARTBOOK.INK, 0.06),
              color: COLORS.CHARTBOOK.INK,
              borderBottomColor: COLORS.CHARTBOOK.GRID,
              outlineColor: COLORS.CHARTBOOK.GROUND,
            },
            stripedStyle: {
              backgroundColor: COLORS.CHARTBOOK.GROUND,
              color: COLORS.CHARTBOOK.INK,
            },
          },
          cells: {
            style: {
              padding: "12px 8px",
              fontFamily: MONO_STACK,
              fontVariantNumeric: "tabular-nums",
            },
          },
          pagination: {
            style: {
              backgroundColor: COLORS.CHARTBOOK.GROUND,
              color: COLORS.CHARTBOOK.INK,
              borderTop: `1px solid ${COLORS.CHARTBOOK.GRID}`,
              fontSize: "14px",
            },
            pageButtonsStyle: {
              color: COLORS.CHARTBOOK.INK,
              fill: COLORS.CHARTBOOK.INK,
              "&:disabled": {
                color: COLORS.TEXT_MUTED,
                fill: COLORS.TEXT_MUTED,
              },
            },
          },
        },
        customStyles
      )}
      paginationComponentOptions={{
        rowsPerPageText: "페이지당 행 수:",
        rangeSeparatorText: "/",
        noRowsPerPage: false,
        selectAllRowsItem: false,
      }}
      {...props}
    />
  );
};

export default EnhancedDataTable;
