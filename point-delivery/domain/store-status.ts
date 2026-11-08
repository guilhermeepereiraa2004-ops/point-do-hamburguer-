export class StoreClosedError extends Error {
  constructor() { super("A loja está fechada no momento. Volte quando abrirmos para fazer seu pedido."); this.name = "StoreClosedError"; }
}
