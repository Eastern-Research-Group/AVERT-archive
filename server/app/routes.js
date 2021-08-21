const route = require('koa-route');

const controllers = require('./controllers');

const routes = [
  route.get('/api/v1', (ctx) => {
    ctx.body = 'AVERT web service is running...';
  }),

  // debugging only (not called in web app)
  route.get('/api/v1/rdf', controllers.rdf.list),

  // web app method: fetchRegion()
  // (from panel 1, user clicks 'Set EE/RE Impacts' button)
  route.get('/api/v1/rdf/:region', controllers.rdf.show),

  // debugging only (not called in web app)
  route.get('/api/v1/eere', controllers.eere.list),

  // web app method: fetchRegion()
  // (from panel 1, user clicks 'Set EE/RE Impacts' button)
  route.get('/api/v1/eere/:region', controllers.eere.show),

  // web app method: calculateDisplacement()
  // (from panel 2, user clicks 'Get Results' button)
  route.post('/api/v1/generation', controllers.displacement.calculateGeneration),
  route.post('/api/v1/so2', controllers.displacement.calculateSO2),
  route.post('/api/v1/nox', controllers.displacement.calculateNOx),
  route.post('/api/v1/co2', controllers.displacement.calculateCO2),
  route.post('/api/v1/pm25', controllers.displacement.calculatePM25), // TODO: remove
  route.post('/api/v1/nei', controllers.displacement.calculateNEIMetrics),
];

module.exports = routes;
