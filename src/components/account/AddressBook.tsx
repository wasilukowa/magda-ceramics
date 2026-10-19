"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SavedAddress, SavedAddressInput } from "@/contracts/server/auth";
import { deleteAddress } from "@/server-actions/addresses";
import { getAddressLines, MAX_SAVED_ITEMS } from "@/lib/helpers/savedDelivery";
import { buttonClass } from "@/components/ui/button";
import { ButtonVariant } from "@/contracts/shared";
import AddressForm from "./AddressForm";

const NEW_ADDRESS = "new";

export const ACCOUNT_LINK_CLASS =
  "text-[10px] tracking-widest uppercase underline underline-offset-4 hover:text-[var(--muted)] transition-colors disabled:opacity-40";

type Props = {
  addresses: SavedAddress[];
  // Imię i nazwisko z profilu — od nich zaczyna się nowy adres.
  firstName: string;
  lastName: string;
};

// Adresy dostawy w zakładce „Adresy": każdy jak na kopercie, pod nim
// „Edytuj" i „Usuń" (prośba Natalii 2026-10-19). Pola pojawiają się dopiero
// po „Edytuj" albo „Dodaj adres".
export default function AddressBook({ addresses, firstName, lastName }: Props) {
  const t = useTranslations("account");
  const locale = useLocale();
  // Numer adresu, którego pola są otwarte (NEW_ADDRESS — nowy), albo null.
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDeleting] = useTransition();

  const blank: SavedAddressInput = {
    firstName,
    lastName,
    phone: "",
    street: "",
    street2: "",
    postcode: "",
    city: "",
    country: "PL",
  };

  function open(id: string) {
    setNotice(null);
    setError(null);
    setEditing(id);
  }

  function close(message?: string) {
    setEditing(null);
    setNotice(message ?? null);
  }

  function remove(id: string) {
    setNotice(null);
    setError(null);
    startDeleting(async () => {
      if (!(await deleteAddress(id))) setError(t("addresses.failed"));
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {addresses.length === 0 && editing !== NEW_ADDRESS && (
        <p className="text-sm text-[var(--muted)]">{t("addresses.emptyAddresses")}</p>
      )}

      {addresses.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-4">
          {addresses.map((address) =>
            editing === address.id ? (
              <li key={address.id} className="sm:col-span-2">
                <AddressForm id={address.id} initial={address} onDone={close} />
              </li>
            ) : (
              <li
                key={address.id}
                className="border border-[var(--color-control-border)] p-5 flex flex-col gap-4"
              >
                <address className="not-italic text-sm leading-relaxed">
                  {getAddressLines(address, locale).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {address.phone && (
                    <span className="block text-[var(--muted)]">{address.phone}</span>
                  )}
                </address>
                <div className="flex gap-5">
                  <button
                    type="button"
                    onClick={() => open(address.id)}
                    disabled={deleting}
                    className={ACCOUNT_LINK_CLASS}
                  >
                    {t("addresses.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(address.id)}
                    disabled={deleting}
                    className={ACCOUNT_LINK_CLASS}
                  >
                    {t("addresses.delete")}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {editing === NEW_ADDRESS ? (
        <AddressForm initial={blank} onDone={close} />
      ) : (
        addresses.length < MAX_SAVED_ITEMS && (
          <button
            type="button"
            onClick={() => open(NEW_ADDRESS)}
            className={buttonClass({ variant: ButtonVariant.Secondary, className: "self-start" })}
          >
            {t("addresses.add")}
          </button>
        )
      )}

      {notice && (
        <p aria-live="polite" className="text-xs text-[var(--color-success)]">
          {notice}
        </p>
      )}
      {error && (
        <p aria-live="polite" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
