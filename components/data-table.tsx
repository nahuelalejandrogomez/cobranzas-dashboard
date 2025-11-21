import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps {
  columns: Array<{
    key: string;
    label: string;
    format?: (value: any) => string;
  }>;
  data: Array<Record<string, any>>;
}

export function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="text-gray-700 font-semibold text-sm"
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx} className="border-t border-gray-200 hover:bg-gray-50">
              {columns.map((col) => (
                <TableCell key={col.key} className="text-sm text-gray-700">
                  {col.format
                    ? col.format(row[col.key])
                    : row[col.key] || '-'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
