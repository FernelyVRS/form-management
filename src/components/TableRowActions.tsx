import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Edit, Ellipsis, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import FormDialog from './FormDialog'
import EditQuestion from './forms/EditQuestion'
import { useState } from 'react'
import DeleteQuestion from './forms/DeleteQuestion'


type TableRowActionsProps = {
    rowId: string
}

const TableRowActions = ({ rowId }: TableRowActionsProps) => {

    const [openEditQuestionDialog, setOpenEditQuestionDialog] = useState(false)
    const [isOpenDropDown, setIsOpenDropDown] = useState(false)

    const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)

    const handlerClose = () => {
        setOpenEditQuestionDialog(false)
    }

    const handleOpenDialog = () => {
        setIsOpenDropDown(false)
        setOpenEditQuestionDialog(true)
    }

    const handlerOpenDeleteDialog = () => {
        setIsOpenDropDown(false)
        setIsOpenDeleteDialog(true)
    }

    const handleCloseDeleteDialog = () => {
        setIsOpenDeleteDialog(false)
    }

    return (
        <>
            <FormDialog open={openEditQuestionDialog} handlerClose={handlerClose} title='Editar pregunta' wight='800px'>
                <EditQuestion setOpen={setOpenEditQuestionDialog} questionId={rowId} />
            </FormDialog>

            <FormDialog open={isOpenDeleteDialog} handlerClose={handleCloseDeleteDialog} title='Eliminar pregunta'
                description='¿Estás seguro de que deseas eliminar esta pregunta?' wight=''>
                <DeleteQuestion handlerClose={handleCloseDeleteDialog} questionId={rowId} />
            </FormDialog>

            <DropdownMenu open={isOpenDropDown} onOpenChange={setIsOpenDropDown}>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-9 w-9 p-0'>
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                {isOpenDropDown &&
                    <DropdownMenuContent align='end' className='w-[150px] '>
                        <DropdownMenuItem onClick={handleOpenDialog} >
                            <Edit />
                            <span> Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handlerOpenDeleteDialog}>
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