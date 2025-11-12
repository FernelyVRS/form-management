import { createBrowserRouter } from "react-router";
import FormListPage from "./features/forms/components/FormList/";
import FormPage from "./features/forms/pages/FormPage";
// import FormCreatePage from "./features/forms/pages/FormCreatePage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <FormListPage />,
    },
    {
        path: "/create",
        element: <FormPage />,
    }

]);
