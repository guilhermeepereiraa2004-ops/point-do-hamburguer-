export const paymentMethods = ["pix", "credito", "debito", "dinheiro"] as const;
export type PaymentMethod = typeof paymentMethods[number];
export const paymentLabels: Record<PaymentMethod, string> = {
  pix: "Pix", credito: "Cartão de crédito", debito: "Cartão de débito", dinheiro: "Dinheiro",
};
export function validatePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== "string" || !paymentMethods.includes(value as PaymentMethod)) {
    throw new Error("Escolha uma forma de pagamento: Pix, cartão de crédito, débito ou dinheiro.");
  }
  return value as PaymentMethod;
}
export function paymentLabel(value: PaymentMethod | null | undefined): string {
  return value ? paymentLabels[value] ?? "Pagamento não informado" : "Pagamento não informado";
}
export function validateCashChange(method: PaymentMethod, choice: unknown, amount: unknown, total: number): { needsChange: number | null; changeFor: number | null } {
  if (method !== "dinheiro") return { needsChange: null, changeFor: null };
  if (choice === "nao") return { needsChange: 0, changeFor: null };
  if (choice !== "sim") throw new Error("Informe se precisa de troco.");
  if (typeof amount !== "string" || !/^\d{1,7}([.,]\d{1,2})?$/.test(amount.trim())) throw new Error("Informe um valor válido para o troco.");
  const [whole, fraction = ""] = amount.trim().replace(",", ".").split(".");
  const changeFor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(changeFor) || changeFor < total || changeFor <= 0) throw new Error("O valor para troco deve ser igual ou maior que o total do pedido.");
  return { needsChange: 1, changeFor };
}
