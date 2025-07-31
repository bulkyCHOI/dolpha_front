/**
 * EnhancedDataTable - 자동 컬럼 최적화를 지원하는 DataTable
 */

import DataTable from 'react-data-table-component';
import styled from 'styled-components';

const StyledEnhancedDataTable = styled(DataTable)`
  .rdt_Table {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
  }
  
  .rdt_TableHeadRow {
    background-color: #f8f9fa;
    border-bottom: 2px solid #e9ecef;
    font-weight: bold;
  }
  
  .rdt_TableRow {
    transition: background-color 0.2s ease;
    &:nth-of-type(odd) {
      background-color: #fafafa;
    }
    &:hover {
      background-color: #e3f2fd !important;
    }
  }
  
  .rdt_TableCell {
    padding: 12px 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .rdt_TableHead .rdt_TableCell {
    padding: 16px 8px;
    font-weight: bold;
  }
  
  .rdt_Pagination {
    background-color: #f8f9fa;
    border-top: 1px solid #e9ecef;
  }
`;

const EnhancedDataTable = ({ 
  columns, 
  data, 
  autoOptimizeColumns = true,
  ...props 
}) => {
  // 컬럼 너비 자동 최적화
  const optimizedColumns = autoOptimizeColumns 
    ? columns.map(column => {
        // width 속성 제거하여 자동 크기 조정 활성화
        const { width, ...columnWithoutWidth } = column;
        
        // 컬럼 타입에 따른 최적화된 스타일 적용
        let optimizedColumn = { ...columnWithoutWidth };
        
        // 종목명 컬럼 최적화
        if (column.name === '종목') {
          optimizedColumn.minWidth = '140px';
          optimizedColumn.maxWidth = '200px';
        }
        
        // 액션 컬럼 최적화
        if (column.name === '액션') {
          optimizedColumn.minWidth = '80px';
          optimizedColumn.maxWidth = '100px';
        }
        
        // 긴 텍스트 컬럼 최적화
        if (['보유정보', '평가손익'].includes(column.name)) {
          optimizedColumn.minWidth = '120px';
          optimizedColumn.grow = 1;
        }
        
        // 짧은 값 컬럼 최적화
        if (['상태', '손절', '익절'].includes(column.name)) {
          optimizedColumn.minWidth = '60px';
          optimizedColumn.maxWidth = '80px';
        }
        
        return optimizedColumn;
      })
    : columns;

  return (
    <StyledEnhancedDataTable
      columns={optimizedColumns}
      data={data}
      pagination
      paginationPerPage={10}
      paginationRowsPerPageOptions={[5, 10, 15, 20]}
      highlightOnHover
      striped
      responsive
      defaultSortFieldId={1}
      defaultSortAsc={true}
      noHeader={false}
      subHeader={false}
      persistTableHead
      dense={false}
      customStyles={{
        table: {
          style: {
            width: '100%',
            tableLayout: 'auto', // 자동 레이아웃으로 변경
            minWidth: '1200px', // 최소 너비 보장
          },
        },
        headRow: {
          style: {
            backgroundColor: '#f8f9fa',
            borderBottomWidth: '2px',
            borderBottomColor: '#e9ecef',
            fontSize: '14px',
            fontWeight: 'bold'
          },
        },
        rows: {
          style: {
            minHeight: '65px',
            '&:nth-of-type(odd)': {
              backgroundColor: '#fafafa',
            },
            '&:hover': {
              backgroundColor: '#e3f2fd !important',
            },
          },
        },
        cells: {
          style: {
            padding: '12px 8px',
          },
        },
        pagination: {
          style: {
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e9ecef',
            fontSize: '14px'
          },
        },
      }}
      paginationComponentOptions={{
        rowsPerPageText: '페이지당 행 수:',
        rangeSeparatorText: '/',
        noRowsPerPage: false,
        selectAllRowsItem: false,
      }}
      {...props}
    />
  );
};

export default EnhancedDataTable;