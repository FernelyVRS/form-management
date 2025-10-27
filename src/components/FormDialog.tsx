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
    width?: string; // Fixed typo
};

const FormDialog = ({ children, open, handlerClose, title, description, width }: FormDialogProps) => {
    const dialogWidth = width ?? '800'; // Default to 800

    return (
        <Dialog
            open={open}
            onOpenChange={handlerClose}
        >
            <DialogContent
                style={{ maxWidth: `${dialogWidth}px` }} // Use style instead of className
                className="sm:w-full"
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