// include cookies and auto-attach CSRF token to every request

export const swaggerUiOptions = {
  swaggerOptions: {
    requestCredentials: 'include',
    requestInterceptor: (req: any) => {
      try {
        const cookie = typeof document !== 'undefined' ? document.cookie : '';
        const m = cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
        if (m && m[1]) req.headers['X-CSRF-Token'] = decodeURIComponent(m[1]);
      } catch (e) {
        // ignore in non-browser environments
      }
      return req;
    },
  },
};
