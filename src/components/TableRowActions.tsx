import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Edit, Ellipsis, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FormDialog from './FormDialog'
import EditQuestion from './forms/Question/EditQuestion'
import { useState } from 'react';
import DeleteQuestion from './forms/Question/DeleteQuestion';
import EditSection from './forms/Section/EditSection'
import DeleteSection from './forms/Section/DeleteSection'


type TableRowActionsProps = {
    rowId: string,
    identifier?: string
}

const TableRowActions = ({ rowId, identifier }: TableRowActionsProps) => {
    const [isOpenDropDown, setIsOpenDropDown] = useState(false)

    const [openEditSectionDialog, setOpenEditSectionDialog] = useState(false)
    const [isOpenDeleteSectionDialog, setIsOpenDeleteSectionDialog] = useState(false)

    const [openEditQuestionDialog, setOpenEditQuestionDialog] = useState(false)
    const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)

    const handleOpenQuestionDialog = () => {
        setIsOpenDropDown(false)
        setOpenEditQuestionDialog(true)
    }
    const handlerClose = () => {
        setOpenEditQuestionDialog(false)
        setOpenEditSectionDialog(false)
        setIsOpenDeleteDialog(false)
        setIsOpenDeleteSectionDialog(false)
    }

    const handlerOpenDeleteDialog = () => {
        setIsOpenDropDown(false)
        if (identifier === 'questions') {
            setIsOpenDeleteDialog(true)
        } else {
            setIsOpenDeleteSectionDialog(true)
        }
    }

    const handleCloseDeleteDialog = () => {
        setIsOpenDeleteDialog(false)
        setIsOpenDeleteSectionDialog(false)
    }

    const handlerOpenEditSectionDialog = () => {
        setIsOpenDropDown(false)
        setOpenEditSectionDialog(true)
    }

    const handlerEdit = () => {
        if (identifier === 'questions') {
            handleOpenQuestionDialog()
        }
        if (identifier === 'sections') {
            handlerOpenEditSectionDialog()
        }
    }

    const handlerDelete = () => {
        handlerOpenDeleteDialog()
    }

    return (
        <>
            {
                identifier === 'questions' ?
                    <>
                        <FormDialog open={openEditQuestionDialog} handlerClose={handlerClose} title='Editar pregunta' description='
                        ¿Estás seguro de que deseas editar esta pregunta?' width={'800'}>
                            <EditQuestion setOpen={setOpenEditQuestionDialog} questionId={rowId} />
                        </FormDialog>

                        <FormDialog open={isOpenDeleteDialog} handlerClose={handlerClose} title='Eliminar pregunta'
                            description='¿Estás seguro de que deseas eliminar esta pregunta?' width={'400'}>
                            <DeleteQuestion handlerClose={handleCloseDeleteDialog} questionId={rowId} />
                        </FormDialog>
                    </>
                    :
                    <>
                        <FormDialog open={openEditSectionDialog} handlerClose={handlerClose} title='Editar sección' description='
                        ¿Estás seguro de que deseas editar esta sección?' width='800' >
                            <EditSection handlerClose={handlerClose} sectionId={rowId} />
                        </FormDialog>

                        <FormDialog open={isOpenDeleteSectionDialog} handlerClose={handlerClose} title='Eliminar sección'
                            description='¿Estás seguro de que deseas eliminar esta sección?' width='400'>
                            <DeleteSection handlerClose={handleCloseDeleteDialog} sectionId={rowId} />
                        </FormDialog>
                    </>
            }


            <DropdownMenu open={isOpenDropDown} onOpenChange={setIsOpenDropDown}>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-9 w-9 p-0'>
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                {isOpenDropDown &&
                    <DropdownMenuContent align='end' className='w-[150px] '>
                        <DropdownMenuItem onClick={handlerEdit} >
                            <Edit />
                            <span> Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handlerDelete}>
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