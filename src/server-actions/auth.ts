"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import {
  LoginFormState,
  RegisterFormState,
} from "@/contracts/server/auth";
import { authService, EmailExistsError } from "@/lib/service/auth";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

export async function login(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const t = await getTranslations("auth");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const schema = z.object({
    email: z.email(t("errors.email")),
    password: z.string().min(1, t("errors.passwordRequired")),
  });

  const parsed = schema.safeParse({ email, password });
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.validation"),
      errors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
      values: { email },
    };
  }

  try {
    const ok = await authService.verifyPassword(
      parsed.data.email,
      parsed.data.password,
    );
    if (!ok) {
      return {
        status: "error",
        message: t("errors.invalidCredentials"),
        values: { email },
      };
    }

    const customer = await authService.findCustomerByEmail(parsed.data.email);
    if (!customer) {
      return {
        status: "error",
        message: t("errors.invalidCredentials"),
        values: { email },
      };
    }

    await setSessionCookie({ customerId: customer.id, email: customer.email });
    return { status: "success", message: t("login.success") };
  } catch (err) {
    console.error("Login failed:", err);
    return { status: "error", message: t("errors.server"), values: { email } };
  }
}

export async function register(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const t = await getTranslations("auth");

  const values = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };
  const password = String(formData.get("password") ?? "");

  const schema = z.object({
    firstName: z.string().min(1, t("errors.firstName")),
    lastName: z.string().min(1, t("errors.lastName")),
    email: z.email(t("errors.email")),
    password: z.string().min(8, t("errors.passwordLength")),
  });

  const parsed = schema.safeParse({ ...values, password });
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.validation"),
      errors: {
        firstName: fieldErrors.firstName?.[0],
        lastName: fieldErrors.lastName?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
      values,
    };
  }

  try {
    const customer = await authService.register(parsed.data);
    await setSessionCookie({ customerId: customer.id, email: customer.email });
    return { status: "success", message: t("register.success") };
  } catch (err) {
    if (err instanceof EmailExistsError) {
      return {
        status: "error",
        message: t("errors.emailExists"),
        errors: { email: t("errors.emailExists") },
        values,
      };
    }
    console.error("Registration failed:", err);
    return { status: "error", message: t("errors.server"), values };
  }
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
}
