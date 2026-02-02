/** @jsxImportSource @emotion/react */
import React, { useState, useCallback, useMemo } from "react";
import { 
  EuiDataGrid, 
  EuiDataGridColumn,
  EuiDataGridCellValueElementProps,
  EuiHealth,
  useEuiTheme,
} from "@elastic/eui";
import { css } from "@emotion/react";

export interface TableColumn {
  id: string;
  displayAsText: string;
  /** Optional: 'number' for right-aligned numeric columns, 'status' for status indicators */
  dataType?: 'string' | 'number' | 'status';
}

export interface TableRow {
  [key: string]: string | number | null | undefined;
}

interface TablePanelProps {
  /** Column definitions */
  columns: TableColumn[];
  /** Row data */
  data: TableRow[];
  /** Optional: Column ID to apply color coding based on value */
  colorCodeColumn?: string;
  /** Optional: Custom render for null values */
  nullDisplay?: string;
  /** Optional: Custom render for empty/blank values */
  blankDisplay?: string;
}

export const TablePanel: React.FC<TablePanelProps> = ({
  columns,
  data,
  colorCodeColumn,
  nullDisplay = "(null)",
  blankDisplay = "(blank)",
}) => {
  const { euiTheme } = useEuiTheme();
  
  // Pagination state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  
  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map(col => col.id)
  );

  // Get color for value based on its magnitude relative to other values in the column
  const getValueColor = useCallback((value: number | null | undefined, columnId: string) => {
    if (value === null || value === undefined || columnId !== colorCodeColumn) {
      return undefined;
    }
    
    // Get all numeric values in the color-coded column
    const columnValues = data
      .map(row => row[columnId])
      .filter((v): v is number => typeof v === 'number');
    
    if (columnValues.length === 0) return undefined;
    
    const maxValue = Math.max(...columnValues);
    const minValue = Math.min(...columnValues);
    const range = maxValue - minValue;
    
    if (range === 0) return euiTheme.colors.success;
    
    const normalizedValue = (value - minValue) / range;
    
    // Green for high values, yellow/orange for lower values
    if (normalizedValue > 0.8) return euiTheme.colors.success;
    if (normalizedValue > 0.5) return '#E6B045'; // Yellow/gold
    if (normalizedValue > 0.3) return euiTheme.colors.warning;
    return euiTheme.colors.warningText;
  }, [data, colorCodeColumn, euiTheme]);

  // Get column config by id
  const getColumnConfig = useCallback((columnId: string) => {
    return columns.find(col => col.id === columnId);
  }, [columns]);

  // Get status color based on value
  const getStatusColor = useCallback((status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'online' || lowerStatus === 'active' || lowerStatus === 'healthy' || lowerStatus === 'success') {
      return euiTheme.colors.vis.euiColorVis0; // Teal/cyan
    }
    if (lowerStatus === 'offline' || lowerStatus === 'inactive' || lowerStatus === 'error' || lowerStatus === 'failed') {
      return euiTheme.colors.vis.euiColorVis9; // Coral/red
    }
    if (lowerStatus === 'warning' || lowerStatus === 'degraded') {
      return euiTheme.colors.warning;
    }
    return euiTheme.colors.textSubdued;
  }, [euiTheme]);

  // Cell render function
  const renderCellValue = useCallback(
    ({ rowIndex, columnId }: EuiDataGridCellValueElementProps) => {
      const row = data[rowIndex];
      const value = row?.[columnId];
      const columnConfig = getColumnConfig(columnId);
      
      // Handle null values
      if (value === null) {
        return (
          <span css={css`color: ${euiTheme.colors.textSubdued};`}>
            {nullDisplay}
          </span>
        );
      }
      
      // Handle undefined or empty string values
      if (value === undefined || value === '') {
        return (
          <span css={css`color: ${euiTheme.colors.textSubdued};`}>
            {blankDisplay}
          </span>
        );
      }
      
      // Handle status column with colored indicators
      if (columnConfig?.dataType === 'status' && typeof value === 'string') {
        const statusColor = getStatusColor(value);
        return (
          <EuiHealth color={statusColor}>
            {value}
          </EuiHealth>
        );
      }
      
      // Handle color-coded column
      if (columnId === colorCodeColumn && typeof value === 'number') {
        const color = getValueColor(value, columnId);
        return (
          <span css={css`color: ${color}; font-weight: 500;`}>
            {value.toLocaleString()}
          </span>
        );
      }
      
      // Default rendering
      return <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>;
    },
    [data, euiTheme, nullDisplay, blankDisplay, colorCodeColumn, getValueColor, getColumnConfig, getStatusColor]
  );

  // Convert columns to EuiDataGrid format
  const gridColumns: EuiDataGridColumn[] = useMemo(() => 
    columns.map(col => ({
      id: col.id,
      displayAsText: col.displayAsText,
      schema: col.dataType,
    })),
    [columns]
  );

  const onChangeItemsPerPage = useCallback(
    (pageSize: number) => setPagination((prev) => ({ ...prev, pageSize, pageIndex: 0 })),
    []
  );

  const onChangePage = useCallback(
    (pageIndex: number) => setPagination((prev) => ({ ...prev, pageIndex })),
    []
  );

  return (
    <div
      css={css`
        height: 100%;
        width: 100%;
        
        .euiDataGrid {
          height: 100%;
        }
        
        .euiDataGrid__content {
          height: 100%;
        }
        
        .euiDataGridHeaderCell {
          background-color: ${euiTheme.colors.backgroundBasePrimary};
        }
        
        .euiDataGridRowCell__content {
          display: flex;
          align-items: center;
        }
      `}
    >
      <EuiDataGrid
        aria-label="Data table"
        columns={gridColumns}
        columnVisibility={{ visibleColumns, setVisibleColumns }}
        rowCount={data.length}
        renderCellValue={renderCellValue}
        pagination={{
          ...pagination,
          pageSizeOptions: [5, 10, 25, 50],
          onChangeItemsPerPage,
          onChangePage,
        }}
        toolbarVisibility={false}
        gridStyle={{
          border: 'none',
          header: 'shade',
          rowHover: 'highlight',
          stripes: false,
        }}
      />
    </div>
  );
};
