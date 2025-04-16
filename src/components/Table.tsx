import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { Seccion } from '@/types/seccion'

type TableProps<T> = {
    data: T[]
}

const TableMod = <T,>({ data }: TableProps<T>) => {

    const columns: string[] = Object.getOwnPropertyNames(data[0])

    return (
        <Table>
            {/* <TableCaption>Hooooo</TableCaption> */}
            <TableHeader>
                <TableRow>
                    {
                        columns.map(x =>
                            <TableHead key={x} className='capitalize'>{x}</TableHead>
                        )
                    }
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    data.map(row => (
                        <TableRow className='text-left'>
                            {
                                columns.map((columnName) => (
                                    <TableCell className='max-w-[200px] truncate whitespace-nowrap overflow-hidden'> {String(row[columnName as keyof T])} </TableCell>
                                ))
                            }
                        </TableRow>
                    ))
                }
            </TableBody>
        </Table>
    )
}

export default TableMod