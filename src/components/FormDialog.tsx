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
    wight?: string;
};

const FormDialog = ({ children, open, handlerClose, title, description, wight }: FormDialogProps) => {
    return (
        <Dialog
            open={open}
            onOpenChange={handlerClose}
        >
            <DialogContent
                className={`sm:max-w-[${wight}]`}
            // onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description ?? ""}</DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
};

export default FormDialog