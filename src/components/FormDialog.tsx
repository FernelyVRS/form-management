import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ReactNode } from "react"

type FormDialogProps = {
    open: boolean;
    handlerClose: () => void;
    title: string;
    description?: string
    children: ReactNode;
};

const FormDialog = ({ children, open, handlerClose, title, description }: FormDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={handlerClose}>
            <DialogContent className="sm:max-w-[800px]" >
                <DialogHeader>
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description ?? ""}
                    </DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    )
}

export default FormDialog