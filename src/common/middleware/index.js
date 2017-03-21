export const analytics = () => {
  return (next) => {
    return (action) => {
      const dl = window.dataLayer || [];

      dl.push({
        event: action.type,
        payload: action.payload
      });

      return next(action);
    };
  };
};
