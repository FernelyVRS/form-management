import { createBrowserRouter } from "react-router";
import FormListPage from "./features/forms/pages/FormListPage";
import FormPage from "./features/forms/pages/FormPage";
import CreateFormPage from "./features/forms/pages/CreateFormPage";
import FormDetailPage from "./features/forms/pages/FormDetailPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <FormListPage />,
    },
    {
        path: "/forms",
        element: <FormListPage />,
    },
    {
        path: "/forms/create",
        element: <CreateFormPage />,
    },
    {
        path: "/forms/:formId",
        element: <FormDetailPage />,
    },
    {
        path: "/forms/:formId/versions/:versionId/builder",
        element: <FormPage />,
    },
    {
        path: "/forms/:formId/versions/:versionId/view",
        element: <FormPage />,
    },
    {
        path: "/create",
        element: <CreateFormPage />,
    }
]);
