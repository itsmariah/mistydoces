export class AppError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado.") {
    super("NOT_FOUND", message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Você precisa estar autenticado.") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não tem permissão para esta ação.") {
    super("FORBIDDEN", message, 403);
  }
}

export class ProductUnavailableError extends AppError {
  constructor(productName: string) {
    super(
      "PRODUCT_UNAVAILABLE",
      `O produto "${productName}" não está disponível no momento.`,
      409,
    );
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(
      "INVALID_STATUS_TRANSITION",
      `Não é possível alterar o status de "${from}" para "${to}".`,
      409,
    );
  }
}

/** Formata um erro de domínio ou inesperado em uma resposta padronizada para Server Actions. */
export function toActionError(error: unknown): { code: string; message: string } {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }

  console.error(error);
  return {
    code: "INTERNAL_ERROR",
    message: "Ocorreu um erro inesperado. Tente novamente em instantes.",
  };
}
