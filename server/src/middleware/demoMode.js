export const demoMode = (req, res, next) => {
  const isDemo = req.headers['x-demo-mode'] === 'true' || req.query.demo === 'true';
  req.demoMode = isDemo;
  next();
};
