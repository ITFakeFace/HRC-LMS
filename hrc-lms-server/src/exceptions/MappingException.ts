export class MappingException extends Error {
  constructor(message: string = 'Cannot map object') {
    super(message);
  }
}
