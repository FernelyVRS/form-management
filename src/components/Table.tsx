import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TableRowActions from './TableRowActions'

type TableProps<T> = {
    data: T[]
}

const TableMod = <T,>({ data }: TableProps<T>) => {

    const columns: string[] = Object.getOwnPropertyNames(data[0])

    return (
        <>
            <div className='rounded-md border'>
                <Table className='text-left'>
                    <TableHeader>
                        <TableRow>
                            {
                                columns.map(x =>
                                    <TableHead key={x} className='capitalize'>{x}</TableHead>
                                )
                            }
                            <TableHead className='capitalize'></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            data.map(row => (
                                <TableRow key={String(row['id' as keyof T])} >
                                    {
                                        columns.map((columnName) => (
                                            <TableCell className='max-w-[200px] truncate whitespace-nowrap overflow-hidden' key={columnName}>
                                                {String(row[columnName as keyof T])}
                                            </TableCell>
                                        ))
                                    }
                                    <TableCell className='max-w-[200px] truncate whitespace-nowrap overflow-hidden'>
                                        <TableRowActions
                                            rowId={
                                                String(row['id' as keyof T])
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </div >
        </>
    )
}

export default TableMod