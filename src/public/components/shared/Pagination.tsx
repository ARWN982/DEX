import {
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPagination
} from '@elastic/eui';
import React from 'react';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (pageIndex: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ totalPages, currentPage, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <>
      <EuiSpacer size="l" />
      <EuiFlexGroup justifyContent="center">
        <EuiFlexItem grow={false}>
          <EuiPagination
            aria-label="Metrics pagination"
            pageCount={totalPages}
            activePage={currentPage}
            onPageClick={onPageChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};