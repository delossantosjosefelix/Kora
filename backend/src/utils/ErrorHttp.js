export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.status = status;
  }
}
