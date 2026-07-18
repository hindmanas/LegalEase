export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(statusCode).json({
    message: error.message || 'Internal server error',
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
  });
}
