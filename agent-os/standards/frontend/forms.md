# React Forms

Build section and question forms with React Hook Form and the shared form primitives.

- Create form state with `useForm` in create/edit wrappers.
- Provide form state through `FormProvider`.
- Read nested form state with `useFormContext`.
- Render fields with `FormField`, `FormItem`, `FormLabel`, `FormControl`, and `FormMessage`.
- Disable submit actions while `formState.isSubmitting` is true.

```tsx
<FormProvider {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="titulo" render={renderField} />
  </form>
</FormProvider>
```
