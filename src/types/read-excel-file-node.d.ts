declare module 'read-excel-file/node' {
  type CellValue = string | number | boolean | Date | null;

  export default function readXlsxFile(
    input: Buffer,
  ): Promise<CellValue[][]>;
}