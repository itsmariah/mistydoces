"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError, toActionError } from "@/lib/errors";
import * as addressService from "@/services/address-service";
import { addressSchema } from "@/validations/order";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function parseInput(input: unknown) {
  return addressSchema.safeParse(input);
}

export async function createAddress(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      },
    };
  }

  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const address = await addressService.createAddress(session.user.id, parsed.data);
    revalidatePath("/conta/enderecos");
    return { success: true, data: { id: address.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function updateAddress(
  addressId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = parseInput(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      },
    };
  }

  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    await addressService.updateAddress(session.user.id, addressId, parsed.data);
    revalidatePath("/conta/enderecos");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    await addressService.deleteAddress(session.user.id, addressId);
    revalidatePath("/conta/enderecos");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function setDefaultAddress(addressId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    await addressService.setDefaultAddress(session.user.id, addressId);
    revalidatePath("/conta/enderecos");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
