const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

const config = require('./config');
const DisplacementsEngine = require('./engines/DisplacementsEngine');

/**
 * RDF Controller
 */
const rdf = {
  list: (ctx) => {
    ctx.body = Object.keys(config.regions);
  },
  show: async (ctx, region) => {
    if (!(region in config.regions)) {
      ctx.throw(404, `${region} region not found`);
    }
    const file = await readFile(`app/data/${config.regions[region].rdf}`);
    ctx.body = JSON.parse(file);
  },
};

/**
 * EERE Controller
 */
const eere = {
  list: (ctx) => {
    ctx.body = Object.keys(config.regions);
  },
  show: async (ctx, region) => {
    if (!(region in config.regions)) {
      ctx.throw(404, `${region} region not found`);
    }
    const file = await readFile(`app/data/${config.regions[region].eere}`);
    ctx.body = JSON.parse(file);
  },
}

/**
 * Receive eere data and region, and return displacement data
 * (used in Displacement Controller)
 */
async function calculatePollutant(ctx, pollutant) {
  const body = await ctx.request.body;
  // parse rdf data from file
  const file = await readFile(`app/data/${config.regions[body.region].rdf}`);
  const rdf = JSON.parse(file);
  // get pollutant data from instance of DisplacementEngine
  const engine = new DisplacementsEngine(rdf, body.eere);
  let data;
  if (pollutant === 'generation') data = engine.getGeneration();
  if (pollutant === 'so2') data = engine.getSo2Total();
  if (pollutant === 'nox') data = engine.getNoxTotal();
  if (pollutant === 'co2') data = engine.getCo2Total();
  if (pollutant === 'pm25') data = engine.getPm25Total();
  // return data to web app
  ctx.body = data;
};

/**
 * Displacement Controller
 */
const displacement = {
  calculateGeneration: (ctx) => calculatePollutant(ctx, 'generation'),
  calculateSo2: (ctx) => calculatePollutant(ctx, 'so2'),
  calculateNox: (ctx) => calculatePollutant(ctx, 'nox'),
  calculateCo2: (ctx) => calculatePollutant(ctx, 'co2'),
  calculatePm25: (ctx) => calculatePollutant(ctx, 'pm25'),
}

module.exports = {
  rdf,
  eere,
  displacement,
};
