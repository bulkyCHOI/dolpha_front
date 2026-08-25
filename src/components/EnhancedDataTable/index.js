/**
 * EnhancedDataTable - 자동 컬럼 최적화를 지원하는 DataTable
 */

import DataTable from "react-data-table-component";
import styled from "styled-components";
import { COLORS } from "constants/styles";

const StyledEnhancedDataTable = styled(DataTable)`
  /*
   * react-data-table-component 는 표·헤더·셀에 흰 배경과 rgba(0, 0, 0, 0.87)
   * 글자를 기본값으로 깐다. 배경만 덮으면 다크에서 표 바깥 테두리가 흰 판으로
   * 남고 글자는 검은색 그대로다. 배경과 글자를 함께 지정해야 한다.
   */
  .rdt_Table {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
    background-color: ${COLORS.SURFACE};
    color: ${COLORS.TEXT};
  }

  .rdt_TableHeadRow {
    background-color: ${COLORS.SURFACE_ALT};
    color: ${COLORS.TEXT};
    border-bottom: 2px solid ${COLORS.BORDER};
    font-weight: bold;
  }

  .rdt_TableRow {
    transition: background-color 0.2s ease;
    background-color: ${COLORS.SURFACE};
    color: ${COLORS.TEXT};
    &:nth-of-type(odd) {
      background-color: ${COLORS.SURFACE_ALT};
    }
    &:hover {
      background-color: ${COLORS.ROW_HOVER} !important;
    }
  }

  .rdt_TableCell {
    padding: 12px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rdt_TableCol {
    padding: 16px 8px;
    color: ${COLORS.TEXT};
    font-weight: bold;
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

  .rdt_Pagination {
    background-color: ${COLORS.SURFACE_ALT};
    color: ${COLORS.TEXT};
    border-top: 1px solid ${COLORS.BORDER};

    button {
      fill: ${COLORS.TEXT};
      color: ${COLORS.TEXT};
    }
    button:disabled {
      fill: ${COLORS.TEXT_MUTED};
      color: ${COLORS.TEXT_MUTED};
    }
    select {
      background-color: ${COLORS.SURFACE};
      color: ${COLORS.TEXT};
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
              backgroundColor: COLORS.SURFACE_ALT,
              // 색을 지정하지 않으면 react-data-table-component 기본값
              // rgba(0, 0, 0, 0.87) 이 남아 다크에서 헤더가 배경에 묻힌다.
              color: COLORS.TEXT,
              borderBottomWidth: "2px",
              borderBottomColor: COLORS.BORDER,
              fontSize: "14px",
              fontWeight: "bold",
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
              // 기본 테마는 흰 배경 · 검은 글자다. 지정하지 않으면 다크에서
              // 짝수 행만 흰 판으로 남는다.
              backgroundColor: COLORS.SURFACE,
              color: COLORS.TEXT,
              "&:nth-of-type(odd)": {
                backgroundColor: COLORS.SURFACE_ALT,
              },
              // hover 는 전용 토큰을 쓴다. 시세 의미색(TINT_DOWN)을 끌어다 쓰면
              // 뜻이 어긋나고, 다크에서 파란 면이 그대로 도드라진다.
              "&:hover": {
                backgroundColor: `${COLORS.ROW_HOVER} !important`,
              },
            },
            /**
             * highlightOnHover · striped 를 켜면 라이브러리가 자체 테마 값을
             * rows.style 뒤에 덧붙인다 (호버 #EEEEEE, 줄무늬 #FAFAFA).
             * 여기서 덮지 않으면 다크에서 행 하나가 흰 판으로 뜬다.
             */
            highlightOnHoverStyle: {
              backgroundColor: COLORS.ROW_HOVER,
              color: COLORS.TEXT,
              borderBottomColor: COLORS.BORDER,
              outlineColor: COLORS.SURFACE,
            },
            stripedStyle: {
              backgroundColor: COLORS.SURFACE_ALT,
              color: COLORS.TEXT,
            },
          },
          cells: {
            style: {
              padding: "12px 8px",
            },
          },
          pagination: {
            style: {
              backgroundColor: COLORS.SURFACE_ALT,
              // "페이지당 행 수:" 등은 기본값 rgba(0, 0, 0, 0.54) 라 다크에서 읽히지 않는다.
              color: COLORS.TEXT,
              borderTop: `1px solid ${COLORS.BORDER}`,
              fontSize: "14px",
            },
            pageButtonsStyle: {
              color: COLORS.TEXT,
              fill: COLORS.TEXT,
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
