"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ForgotPasswordFormState,
  LoginFormState,
  RegisterFormState,
  ResetPasswordFormState,
} from "@/contracts/server/auth";
import { SITE_URL } from "@/content/data";
import { authService, EmailExistsError } from "@/lib/service/auth";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth/resetToken";
import {
  hasExceededLimit,
  isRateLimited,
  recordAttempt,
} from "@/lib/helpers/rateLimit";
import { customerService } from "@/lib/service/customer";
import { mailService } from "@/lib/service/mail";
import { buildPasswordResetMail } from "@/lib/service/mail/helpers";
import { getPathname } from "@/i18n/navigation";

// Adres, z którego przyszło żądanie. Za serwerem Vercela prawdziwy adres
// klienta stoi pierwszy w „x-forwarded-for"; gdy nagłówka nie ma (lokalnie),
// wszyscy trafiają do jednego wspólnego kubełka i to w zupełności wystarcza.
const clientIp = async (): Promise<string> => {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
};

// Logowanie: zapora liczy WYŁĄCZNIE nieudane próby, więc klient, który wpisuje
// hasło poprawnie, nigdy się o nią nie obije. Limit na adres e-mail zatrzymuje
// zgadywanie hasła do jednego konta, limit na IP — przebieganie po wielu
// kontach z jednego miejsca. Bez tego nasz własny formularz byłby wygodniejszy
// do zgadywania haseł niż panel WordPressa, bo omija wszystko, co pilnuje tego
// po tamtej stronie.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT_PER_EMAIL = 5;
const LOGIN_LIMIT_PER_IP = 20;

// Rejestracja: tu liczy się każda próba, bo każda zakłada konto w WooCommerce.
// Okno jest godzinne, a limity niskie — nikt nie zakłada sobie trzech kont
// w ciągu godziny, a bot zakładałby ich tysiąc.
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_LIMIT_PER_EMAIL = 3;
const REGISTER_LIMIT_PER_IP = 5;

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

  const address = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  const emailKey = `login:email:${address}`;
  const ipKey = `login:ip:${ip}`;

  if (
    hasExceededLimit(emailKey, LOGIN_LIMIT_PER_EMAIL) ||
    hasExceededLimit(ipKey, LOGIN_LIMIT_PER_IP)
  ) {
    // Bez adresu i bez IP w logu — to dane osobowe, a do zauważenia, że ktoś
    // wali w formularz, wystarczy sam ślad.
    console.warn("Login: rate limit hit");
    return {
      status: "error",
      message: t("errors.tooManyAttempts"),
      values: { email },
    };
  }

  // Zła próba wygląda tak samo niezależnie od tego, czy konto istnieje —
  // inaczej formularz mówiłby obcej osobie, kto ma konto w sklepie.
  const rejected = (): LoginFormState => {
    recordAttempt(emailKey, LOGIN_WINDOW_MS);
    recordAttempt(ipKey, LOGIN_WINDOW_MS);
    return {
      status: "error",
      message: t("errors.invalidCredentials"),
      values: { email },
    };
  };

  try {
    const ok = await authService.verifyPassword(
      parsed.data.email,
      parsed.data.password,
    );
    if (!ok) return rejected();

    const customer = await authService.findCustomerByEmail(parsed.data.email);
    if (!customer) return rejected();

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

  const ip = await clientIp();
  if (
    isRateLimited(
      `register:email:${parsed.data.email.toLowerCase()}`,
      REGISTER_LIMIT_PER_EMAIL,
      REGISTER_WINDOW_MS,
    ) ||
    isRateLimited(`register:ip:${ip}`, REGISTER_LIMIT_PER_IP, REGISTER_WINDOW_MS)
  ) {
    console.warn("Registration: rate limit hit");
    return {
      status: "error",
      message: t("errors.tooManyAttempts"),
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

// Limity są celowo niskie: prośba o link do zmiany hasła wysyła maila pod
// CUDZY adres, więc bez nich formularz byłby darmowym narzędziem do zasypania
// czyjejś skrzynki. Patrz lib/helpers/rateLimit.ts — to zapora na najprostszy
// przypadek, nie twarda gwarancja.
const RESET_WINDOW_MS = 15 * 60 * 1000;
const RESET_LIMIT_PER_EMAIL = 3;
const RESET_LIMIT_PER_IP = 10;

export async function requestPasswordReset(
  _prevState: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const t = await getTranslations("auth");
  const locale = await getLocale();

  const email = String(formData.get("email") ?? "").trim();
  const parsed = z.email(t("errors.email")).safeParse(email);

  if (!parsed.success) {
    return {
      status: "error",
      message: t("errors.validation"),
      errors: { email: z.flattenError(parsed.error).formErrors[0] },
      values: { email },
    };
  }

  // Odpowiedź jest ZAWSZE ta sama, niezależnie od tego, czy konto istnieje.
  // Inaczej formularz mówiłby obcej osobie, kto ma konto w sklepie.
  const sent: ForgotPasswordFormState = {
    status: "success",
    message: t("forgot.success"),
  };

  const ip = await clientIp();
  const address = parsed.data.toLowerCase();

  if (
    isRateLimited(`reset:email:${address}`, RESET_LIMIT_PER_EMAIL, RESET_WINDOW_MS) ||
    isRateLimited(`reset:ip:${ip}`, RESET_LIMIT_PER_IP, RESET_WINDOW_MS)
  ) {
    // Bez adresu i bez IP — to dane osobowe, a do zauważenia, że ktoś wali
    // w formularz, wystarczy sam ślad w logu.
    console.warn("Password reset: rate limit hit");
    return sent;
  }

  try {
    const customer = await authService.findCustomerByEmail(address);
    if (!customer) return sent;

    const token = createPasswordResetToken({
      customerId: customer.id,
      email: customer.email,
      modifiedAt: customer.modifiedAt,
    });

    // Adres liczony z trasy, więc link trafia we właściwą wersję językową
    // („/nowe-haslo" albo „/reset-password") bez wpisywania go z ręki.
    const path = getPathname({ locale, href: "/reset-password" });
    const url = new URL(path, SITE_URL);
    url.searchParams.set("token", token);

    const message = await buildPasswordResetMail({
      to: customer.email,
      locale,
      url: url.toString(),
    });

    const ok = await mailService.send(message);
    if (!ok) {
      return { status: "error", message: t("errors.server"), values: { email } };
    }
  } catch (err) {
    console.error("Password reset request failed:", err);
    return { status: "error", message: t("errors.server"), values: { email } };
  }

  return sent;
}

export async function resetPassword(
  _prevState: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const t = await getTranslations("auth");

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const schema = z
    .object({
      password: z.string().min(8, t("errors.passwordLength")),
      confirm: z.string().min(1, t("errors.confirmRequired")),
    })
    .refine((data) => data.password === data.confirm, {
      path: ["confirm"],
      message: t("errors.passwordsDiffer"),
    });

  const parsed = schema.safeParse({ password, confirm });
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.validation"),
      errors: {
        password: fieldErrors.password?.[0],
        confirm: fieldErrors.confirm?.[0],
      },
    };
  }

  const payload = verifyPasswordResetToken(token);
  if (!payload) {
    return { status: "error", message: t("reset.invalidLink") };
  }

  try {
    const customer = await customerService.getCustomerById(payload.customerId);

    // Konto zniknęło, zmieniło adres albo zostało w międzyczasie zmienione —
    // to ostatnie znaczy, że z linku ktoś już skorzystał. Patrz resetToken.ts.
    if (
      !customer ||
      customer.email !== payload.email ||
      customer.modifiedAt !== payload.modifiedAt
    ) {
      return { status: "error", message: t("reset.invalidLink") };
    }

    await customerService.updateCustomer(customer.id, {
      password: parsed.data.password,
    });
  } catch (err) {
    console.error("Password reset failed:", err);
    return { status: "error", message: t("errors.server") };
  }

  return { status: "success", message: t("reset.success") };
}
