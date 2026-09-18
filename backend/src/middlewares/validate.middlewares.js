export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        campo: err.path.join('.'),
        mensaje: err.message,
      }));

      return res.status(400).json({
        error: 'Error de validación en los datos enviados',
        detalles: errors,
      });
    }

    if (target === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[target] = result.data;
    }
    next();
  };
};