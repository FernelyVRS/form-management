import { createBrowserRouter } from "react-router";
import FormListPage from "./features/forms/pages/FormListPage";
import FormBuilderPage from "./features/forms/pages/FormBuilderPage";
import FormVersionViewPage from "./features/forms/pages/FormVersionViewPage";
import CreateFormPage from "./features/forms/pages/CreateFormPage";
import FormDetailPage from "./features/forms/pages/FormDetailPage";

export const router = createBrowserRouter([
    {
        children: [
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
                element: <FormBuilderPage />,
            },
            {
                path: "/forms/:formId/versions/:versionId/view",
                element: <FormVersionViewPage />,
            },
            {
                path: "/create",
                element: <CreateFormPage />,
            }
        ]
    }
]);
