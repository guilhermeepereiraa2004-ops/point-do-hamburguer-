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
