const famon : {[key: string]: number} = {
    Water: 1,
    Fire: 1,
    Nature: 1,
};

const hability : {[key: string]: number} = {
    'Hability 1': 0.02,
    'Hability 2': 0.02,
    'Hability 3': 0.02,
    'Hability 4': 0.05,
    'Hability 5': 0.05,
    'Hability 6': 0.05,
    'Hability 7': 0.08,
    'Hability 8': 0.08,
    'Hability 9': 0.08,
    'Hability 10': 0.11,
    'Hability 11': 0.11,
    'Hability 12': 0.11,
    'Hability 13': 0.11,
    'Hability 14': 0.11,
    'Hability 15': 0.11,
};

const randomizeFamon = () => {
    const rFamon = weightedRandomize(famon, 3);
    const habilityModded = { ...hability };

    const rHability1 = weightedRandomize(habilityModded);
    delete habilityModded[rHability1];

    const rHability2 = weightedRandomize(habilityModded, 1 - hability[rHability1]);
    delete habilityModded[rHability2];

    const rHability3 = weightedRandomize(habilityModded, 1 - hability[rHability1] - hability[rHability2]);

    return { type: rFamon, h1: rHability1, h2: rHability2, h3: rHability3 };
};

const randomize = (data: any) => {
    let total = 0;
    for (let i = 0; i < data.length; ++i) {
        total += data[i][1];
    }

    const threshold = Math.random() * total;

    total = 0;
    for (let i = 0; i < data.length - 1; ++i) {
        total += data[i][1];

        if (total >= threshold) {
            return data[i][0];
        }
    }

    return data[data.length - 1][0];
};

function weightedRandomize(spec: any, total = 1) {
    var i,
        sum = 0,
        r = Math.random() * total;

    for (i in spec) {
        sum += spec[i];
        if (r <= sum) return i;
    }

    return spec[spec.length - 1];
}

export default randomize;

export { randomizeFamon, weightedRandomize };
