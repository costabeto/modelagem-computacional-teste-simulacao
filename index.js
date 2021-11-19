const respostas = require('./data.json');
const fs = require('fs');

const constants = {
  gasoline: {
    price: 5.847,
    density: 0.75,
    co2Factor: 3.7,
    ethanolVolume: 0.82,
  },
  gnv: {
    price: 3.545,
    gasolineEconomy: 1.29,
  },
};

const { co2Factor, density, ethanolVolume } = constants.gasoline;

const kgCO2perGasolineLiter = 1 * co2Factor * density * ethanolVolume;

const decimalAdjust = (number) => {
  return Number(Number(number).toFixed(2));
};

const getCosume = {
  gasolineLiters: ({ kmL, avgKm }) => {
    return decimalAdjust(avgKm / kmL);
  },
  gnvM3: ({ avgKm, kmM3 }) => {
    return decimalAdjust(avgKm / kmM3);
  },
};

const gnvConversion = {
  gnvM3fromGasolineKmL: ({ gasolineKmL }) => {
    return decimalAdjust(gasolineKmL / 1.29);
  },
  gnvCo2FromGasoline: ({ gasolineCo2Emission }) => {
    return decimalAdjust(gasolineCo2Emission - gasolineCo2Emission * 0.2);
  },
};

const calcGasoline = ({ avgKm, cityKmL, roadKmL }) => {
  const cityLiters = getCosume.gasolineLiters({
    avgKm: avgKm,
    kmL: cityKmL,
  });

  const roadLiters = getCosume.gasolineLiters({
    avgKm: avgKm,
    kmL: roadKmL,
  });

  const gasoline = {
    city: {
      liters: cityLiters,
      cost: decimalAdjust(cityLiters * constants.gasoline.price),
      co2: decimalAdjust(kgCO2perGasolineLiter * avgKm),
    },
    road: {
      liters: roadLiters,
      cost: decimalAdjust(roadLiters * constants.gasoline.price),
      co2: decimalAdjust(kgCO2perGasolineLiter * avgKm),
    },
  };

  return gasoline;
};

const calcGnv = ({ cityKmL, roadKmL, gasoline, avgKm }) => {
  const gnvKmM3 = {
    city: gnvConversion.gnvM3fromGasolineKmL({
      gasolineKmL: cityKmL,
    }),
    road: gnvConversion.gnvM3fromGasolineKmL({
      gasolineKmL: roadKmL,
    }),
  };

  const cityM3 = getCosume.gnvM3({ avgKm, kmM3: gnvKmM3.city });
  const roadM3 = getCosume.gnvM3({ avgKm, kmM3: gnvKmM3.road });

  const gnv = {
    city: {
      m3: cityM3,
      cost: decimalAdjust(cityM3 * constants.gnv.price),
      co2: gnvConversion.gnvCo2FromGasoline({
        gasolineCo2Emission: gasoline.city.co2,
      }),
    },
    road: {
      m3: roadM3,
      cost: decimalAdjust(roadM3 * constants.gnv.price),
      co2: gnvConversion.gnvCo2FromGasoline({
        gasolineCo2Emission: gasoline.road.co2,
      }),
    },
  };

  return gnv;
};

const calc = ({ days = 1, data = respostas }) => {
  return data.map((item) => {
    const { cityKmL, roadKmL, avgKmDay } = item;

    const avgKm = days * avgKmDay;

    const gasoline = calcGasoline({
      avgKm,
      cityKmL,
      roadKmL,
      days,
    });

    const gnv = calcGnv({ avgKm, days, cityKmL, roadKmL, gasoline });

    return { gasoline, gnv };
  });
};

const result = calc({ days: 5, data: respostas });

fs.writeFileSync('resultado.json', JSON.stringify(result));
