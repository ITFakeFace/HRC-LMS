export enum StatusCodes {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,

    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    CONFLICT = 409,
    PAYLOAD_TOO_LARGE = 413,
    UNSUPPORTED_MEDIA_TYPE = 415,
    UNPROCESSABLE_ENTITY = 422,

    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
}

export class ResponseModel<T = any> {
    status: boolean;
    message: string;
    statusCode: StatusCodes;
    data: T | null;

    constructor(
        status: boolean,
        message: string,
        statusCode: StatusCodes,
        data: T | null,
    ) {
        this.status = status;
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
    }

    static success<T>({message = "Ok", statusCode = StatusCodes.OK, data = null}: {
        data?: T | null;
        message?: string;
        statusCode?: number;
    }): ResponseModel<T> {
        return new ResponseModel<T>(true, message, statusCode, data ?? null);
    }

    static error<T>({message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, data = null}: {
        message: string;
        statusCode?: number;
        data?: T | null;
    }): ResponseModel<T> {
        return new ResponseModel<T>(false, message, statusCode, data ?? null);
    }
}
