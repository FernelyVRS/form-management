import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Edit, Ellipsis, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import FormDialog from './FormDialog'
import EditQuestion from './forms/EditQuestion'
import { useState } from 'react'


type TableRowActionsProps = {
    rowId: string
}

const TableRowActions = ({ rowId }: TableRowActionsProps) => {

    const [openEditQuestionDialog, setOpenEditQuestionDialog] = useState(false)
    const [isOpenDropDown, setIsOpenDropDown] = useState(false)

    const handlerClose = () => {
        setOpenEditQuestionDialog(false)
    }

    const handleOpenDialog = () => {
        setIsOpenDropDown(false)
        setOpenEditQuestionDialog(true)
    }

    return (
        <>
            <FormDialog open={openEditQuestionDialog} handlerClose={handlerClose} title='Editar pregunta'>
                <EditQuestion setOpen={setOpenEditQuestionDialog} questionId={rowId} />
                <div></div>
            </FormDialog>

            <DropdownMenu open={isOpenDropDown} onOpenChange={setIsOpenDropDown}>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-9 w-9 p-0'>
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                {isOpenDropDown &&
                    <DropdownMenuContent align='end' className='w-[150px] '>
                        <DropdownMenuItem onClick={() => handleOpenDialog()} >
                            <Edit />
                            <span> Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Trash2 className='text-red-500' />
                            <span className='text-red-500'> Eliminar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                }
            </DropdownMenu>
        </>
    )
}

export default TableRowActions