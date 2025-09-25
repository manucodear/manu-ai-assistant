export class CustomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CustomError";
    }
}

export const throwError = (message: string): never => {
    throw new CustomError(message);
}