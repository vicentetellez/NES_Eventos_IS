export const response = {
  success: (res, statusCode, message, data = null) => {
    console.log("Proceso exitoso:", message);
    return res.status(statusCode).json({
      status: "Success",
      message,
      data,
    });
  },

  clientError: (res, statusCode, message, errorDetails = null) => {
    console.error("Error de Cliente:", message, errorDetails);
    return res.status(statusCode).json({
      status: "Client error",
      message,
      error: errorDetails,
    });
  },

  serverError: (res, statusCode, message, errorDetails = null) => {
    console.error("Error de Servidor:", message, errorDetails);
    return res.status(statusCode).json({
      status: "Server error",
      message,
      error: errorDetails || "Internal Server Error",
    });
  }
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError"; // Para identificarlo en el middleware
  }
}