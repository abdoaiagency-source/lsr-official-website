export function isAdminAuthorized(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  return request.headers.get("authorization") === `Bearer ${adminPassword}`;
}

export function adminError(error: string, message: string, status = 400) {
  return { body: { ok: false, error, message }, status };
}
