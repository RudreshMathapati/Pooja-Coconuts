import * as XLSX from 'xlsx';
import { getTodayDateString } from './formatters';

export const exportToExcel = (dataArray, fileName = 'Report_Data') => {
  if (!dataArray || dataArray.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(dataArray);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DataSheet');

  XLSX.writeFile(workbook, `${fileName}_${getTodayDateString()}.xlsx`);
};
