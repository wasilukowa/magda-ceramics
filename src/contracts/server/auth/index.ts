// Domena: uwierzytelnianie i klient (konto). Typy "Raw*" = surowa odpowiedź
// WooCommerce; pozostałe = typy domenowe używane w całej aplikacji.

export type SessionPayload = {
  customerId: number;
  email: string;
  exp: number; // znacznik czasu wygaśnięcia (ms)
};

// --- Klient (domena) ---

export type CustomerAddress = {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
};

export type Customer = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  billing: CustomerAddress;
  wishlist: number[];
};

// --- Surowe typy WooCommerce ---

export type RawWcAddress = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address_1?: string;
  city?: string;
  postcode?: string;
  country?: string;
};

export type RawWcMeta = {
  id?: number;
  key: string;
  value: unknown;
};

export type RawWcCustomer = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  billing?: RawWcAddress;
  shipping?: RawWcAddress;
  meta_data?: RawWcMeta[];
};

// --- Stany formularzy (wzorzec useActionState) ---

export type AuthFormStatus = "idle" | "success" | "error";

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export type LoginFormValues = {
  email: string;
};

export type LoginFormState = {
  status: AuthFormStatus;
  message: string;
  errors?: LoginFieldErrors;
  values?: LoginFormValues;
};

export type RegisterFieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
};

export type RegisterFormState = {
  status: AuthFormStatus;
  message: string;
  errors?: RegisterFieldErrors;
  values?: RegisterFormValues;
};

export type AccountFormState = {
  status: AuthFormStatus;
  message: string;
  errors?: Record<string, string | undefined>;
};
