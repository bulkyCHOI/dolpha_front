/**
 * Advanced CSS utilities for handling table rendering issues
 * These styles address browser-specific and edge case table problems
 */

import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

// Table container with overflow handling
export const TableContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  overflowX: "auto",
  overflowY: "visible",

  // Ensure table takes full width
  "& .rdt_Table": {
    width: "100% !important",
    minWidth: "100% !important",
    tableLayout: "auto !important",
  },

  // Fix for webkit browsers
  WebkitOverflowScrolling: "touch",

  // Ensure proper rendering in all browsers
  "&::-webkit-scrollbar": {
    height: "8px",
  },

  "&::-webkit-scrollbar-track": {
    backgroundColor: "#f1f1f1",
    borderRadius: "4px",
  },

  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#c1c1c1",
    borderRadius: "4px",

    "&:hover": {
      backgroundColor: "#a8a8a8",
    },
  },

  // Mobile optimization
  [theme.breakpoints.down("lg")]: {
    "& .rdt_Table": {
      minWidth: "1200px", // Prevent column crushing on mobile
    },
  },

  // Prevent layout shifts
  "& .rdt_TableHeadRow, & .rdt_TableRow": {
    display: "table-row !important",
    width: "100% !important",
  },

  "& .rdt_TableCell": {
    display: "table-cell !important",
    verticalAlign: "middle",

    // Text overflow handling
    overflow: "hidden",
    textOverflow: "ellipsis",

    // Prevent word breaking in critical columns
    '&[data-column-id*="종목"], &[data-column-id*="전략"]': {
      whiteSpace: "nowrap",
    },

    // Allow wrapping for multi-line content
    '&[data-column-id*="보유정보"], &[data-column-id*="평가손익"]': {
      whiteSpace: "normal",
      lineHeight: 1.2,
      minHeight: "65px",
      verticalAlign: "top",
      paddingTop: "8px",
      paddingBottom: "8px",
    },
  },

  // Responsive font sizing
  [theme.breakpoints.down("xl")]: {
    fontSize: "0.875rem",

    "& .rdt_TableCell": {
      fontSize: "0.8rem",
      padding: "8px 6px",
    },

    "& .rdt_TableHead .rdt_TableCell": {
      fontSize: "0.75rem",
      fontWeight: "bold",
    },
  },

  [theme.breakpoints.down("lg")]: {
    fontSize: "0.8rem",

    "& .rdt_TableCell": {
      fontSize: "0.75rem",
      padding: "6px 4px",
    },

    "& .rdt_TableHead .rdt_TableCell": {
      fontSize: "0.7rem",
    },
  },
}));

// Utility function to calculate optimal column widths
export const calculateColumnWidths = (columns, data, containerWidth) => {
  const totalColumns = columns.length;
  const baseWidth = containerWidth / totalColumns;

  return columns.map((column, index) => {
    // Define minimum widths based on content type
    let minWidth = baseWidth;

    switch (column.name) {
      case "종목":
        minWidth = Math.max(140, baseWidth * 1.2);
        break;
      case "보유정보":
      case "평가손익":
        minWidth = Math.max(120, baseWidth * 1.1);
        break;
      case "전략":
      case "매매모드":
        minWidth = Math.max(80, baseWidth * 0.8);
        break;
      case "상태":
      case "손절":
      case "익절":
      case "최대손실":
        minWidth = Math.max(60, baseWidth * 0.7);
        break;
      case "진입가":
      case "현재가":
        minWidth = Math.max(90, baseWidth);
        break;
      case "액션":
        minWidth = Math.max(80, baseWidth * 0.8);
        break;
      default:
        minWidth = Math.max(80, baseWidth);
    }

    return {
      ...column,
      minWidth: `${minWidth}px`,
      width: "auto",
    };
  });
};

// CSS-in-JS styles for react-data-table-component
export const getCustomTableStyles = (theme) => ({
  table: {
    style: {
      width: "100%",
      tableLayout: "auto",
      borderCollapse: "separate",
      borderSpacing: 0,
    },
  },
  headRow: {
    style: {
      backgroundColor: "#f8f9fa",
      borderBottomWidth: "2px",
      borderBottomColor: "#e9ecef",
      fontSize: "14px",
      fontWeight: "bold",
      minHeight: "52px",

      [theme.breakpoints.down("lg")]: {
        fontSize: "12px",
        minHeight: "48px",
      },
    },
  },
  headCells: {
    style: {
      paddingLeft: "12px",
      paddingRight: "12px",
      paddingTop: "12px",
      paddingBottom: "12px",
      fontWeight: "bold",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",

      [theme.breakpoints.down("lg")]: {
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "8px",
        paddingBottom: "8px",
        fontSize: "0.75rem",
      },
    },
  },
  rows: {
    style: {
      minHeight: "65px",
      borderBottomWidth: "1px",
      borderBottomColor: "#e9ecef",
      "&:nth-of-type(odd)": {
        backgroundColor: "#fafafa",
      },
      "&:hover": {
        backgroundColor: "#e3f2fd !important",
        cursor: "pointer",
      },

      [theme.breakpoints.down("lg")]: {
        minHeight: "55px",
      },
    },
  },
  cells: {
    style: {
      paddingLeft: "12px",
      paddingRight: "12px",
      paddingTop: "8px",
      paddingBottom: "8px",
      fontSize: "14px",
      overflow: "hidden",
      textOverflow: "ellipsis",

      [theme.breakpoints.down("lg")]: {
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "6px",
        paddingBottom: "6px",
        fontSize: "0.8rem",
      },

      [theme.breakpoints.down("md")]: {
        paddingLeft: "6px",
        paddingRight: "6px",
        fontSize: "0.75rem",
      },
    },
  },
  pagination: {
    style: {
      backgroundColor: "#f8f9fa",
      borderTop: "1px solid #e9ecef",
      fontSize: "14px",
      padding: "12px",

      [theme.breakpoints.down("lg")]: {
        fontSize: "12px",
        padding: "8px",
      },
    },
  },
});

export default {
  TableContainer,
  calculateColumnWidths,
  getCustomTableStyles,
};
