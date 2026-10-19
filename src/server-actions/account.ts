"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { AccountFormState } from "@/contracts/server/auth";
import { getSession } from "@/lib/auth/dal";
import { authService } from "@/lib/service/auth";
import { customerService } from "@/lib/service/customer";

const unauthorized = (message: string): AccountFormState => ({
  status: "error",
  message,
});

export async function updateProfile(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const t = await getTranslations("account");
  const session = await getSession();
  if (!session) return unauthorized(t("errors.unauthorized"));

  const schema = z.object({
    firstName: z.string().min(1, t("errors.firstName")),
    lastName: z.string().min(1, t("errors.lastName")),
    email: z.email(t("errors.email")),
  });

  const parsed = schema.safeParse({
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  });

  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.validation"),
      errors: {
        firstName: fieldErrors.firstName?.[0],
        lastName: fieldErrors.lastName?.[0],
        email: fieldErrors.email?.[0],
      },
    };
  }

  try {
    await customerService.updateCustomer(session.customerId, parsed.data);
    revalidatePath("/account", "layout");
    return { status: "success", message: t("profile.success") };
  } catch (err) {
    console.error("Update profile failed:", err);
    return { status: "error", message: t("errors.server") };
  }
}

export async function changePassword(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const t = await getTranslations("account");
  const session = await getSession();
  if (!session) return unauthorized(t("errors.unauthorized"));

  const schema = z.object({
    current: z.string().min(1, t("errors.passwordRequired")),
    next: z.string().min(8, t("errors.passwordLength")),
  });

  const parsed = schema.safeParse({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("next") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.validation"),
      errors: {
        current: fieldErrors.current?.[0],
        next: fieldErrors.next?.[0],
      },
    };
  }

  try {
    const ok = await authService.verifyPassword(
      session.email,
      parsed.data.current,
    );
    if (!ok) {
      return {
        status: "error",
        message: t("errors.wrongPassword"),
        errors: { current: t("errors.wrongPassword") },
      };
    }

    await customerService.updateCustomer(session.customerId, {
      password: parsed.data.next,
    });
    return { status: "success", message: t("password.success") };
  } catch (err) {
    console.error("Change password failed:", err);
    return { status: "error", message: t("errors.server") };
  }
}
