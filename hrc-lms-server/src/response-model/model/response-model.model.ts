export class ResponseModel {
  status: boolean;
  statusCode: number;
  message: string;
  errors?: ResponseError[] = [];
  data: any | null;

  constructor(model: {
    status: boolean;
    statusCode: number;
    message: string;
    errors?: ResponseError[];
    data: any | null;
  }) {
    this.status = model.status;
    this.statusCode = model.statusCode;
    this.message = model.message;
    this.data = model.data;
    model.errors?.forEach((err) => this.errors?.push(err));
  }
}

export class ResponseError {
  key: string;
  value: string[] = [];
}
