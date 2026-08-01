export const getApiHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  await response.text();
  throw new Error("Backend zwrócił odpowiedź inną niż JSON.");
};

export const getApiErrorMessage = (response, fallback) => {
  if (response.status === 401) return "Sesja wygasła. Zaloguj się ponownie.";
  if (response.status === 403) return "Nie masz dostępu do tego profilu.";
  if (response.status >= 500) {
    return "Wystąpił błąd serwera. Spróbuj ponownie później.";
  }

  return fallback;
};
