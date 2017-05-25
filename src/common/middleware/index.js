export const analytics = () => {
  return (next) => {
    return (action) => {
      // only handle analytics on the client side
      if (typeof window !== 'undefined') {
        const dl = window.dataLayer || [];

        dl.push({
          event: action.type,
          payload: action.payload
        });
      }

      return next(action);
    };
  };
};
