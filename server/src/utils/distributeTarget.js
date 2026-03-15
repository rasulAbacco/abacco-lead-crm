function distributeTarget(target, percents) {
    const raw = percents.map(p => (target * p) / 100);
    const floor = raw.map(Math.floor);

    let remaining = target - floor.reduce((a, b) => a + b, 0);

    const remainders = raw.map((v, i) => ({
        index: i,
        remainder: v - Math.floor(v)
    }));

    remainders.sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < remaining; i++) {
        floor[remainders[i].index]++;
    }

    return floor;
}