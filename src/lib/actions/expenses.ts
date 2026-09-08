"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFinanceAccess } from "@/lib/permissions";
import { expenseSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
export type { ActionState } from "@/lib/actions/orders";
import type { ActionState } from "@/lib/actions/orders";

export async function createExpense(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireFinanceAccess();

  const parsed = expenseSchema.safeParse({
    orderId: formData.get("orderId") || "",
    category: formData.get("category"),
    amount: formData.get("amount"),
    description: formData.get("description") || "",
    date: formData.get("date") || "",
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields." };
  const data = parsed.data;

  await prisma.expense.create({
    data: {
      orderId: data.orderId || null,
      category: data.category,
      amount: data.amount,
      description: data.description || null,
      date: data.date ? new Date(data.date) : new Date(),
      createdById: session.user.id,
    },
  });

  await logAudit({ userId: session.user.id, action: "EXPENSE_CREATED", entityType: "Expense" });
  revalidatePath("/finance");
  return {};
}
