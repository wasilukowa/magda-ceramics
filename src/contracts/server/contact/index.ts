export type ContactFieldErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export type ContactFormValues = {
  name: string;
  email: string;
  message: string;
};

export type ContactFormStatus = "idle" | "success" | "error";

export type ContactFormState = {
  status: ContactFormStatus;
  message: string;
  errors?: ContactFieldErrors;
  values?: ContactFormValues;
};
