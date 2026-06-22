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

export async function updateAddress(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const t = await getTranslations("account");
  const session = await getSession();
  if (!session) return unauthorized(t("errors.unauthorized"));

  const schema = z.object({
    firstName: z.string().min(1, t("errors.firstName")),
    lastName: z.string().min(1, t("errors.lastName")),
    phone: z.string().optional().default(""),
    street: z.string().min(1, t("errors.street")),
    city: z.string().min(1, t("errors.city")),
    postcode: z.string().min(1, t("errors.postcode")),
    country: z.string().min(2, t("errors.country")),
  });

  const parsed = schema.safeParse({
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    street: String(formData.get("street") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    postcode: String(formData.get("postcode") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
  });

  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.validation"),
      errors: Object.fromEntries(
        Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]]),
      ),
    };
  }

  try {
    await customerService.updateCustomer(session.customerId, {
      billing: parsed.data,
    });
    revalidatePath("/account", "layout");
    return { status: "success", message: t("address.success") };
  } catch (err) {
    console.error("Update address failed:", err);
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
