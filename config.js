const PORT = 3000;

const MINE_RATE = 1000;

const INITIAL_DIFFICULTY = 3;

const GENESIS_DATA = {
    timestamp: 1,
    lastHash: "*****",
    hash: "ac = bc mod(m)",
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
};

const STARTING_BALANCE = 10;

module.exports = { GENESIS_DATA, MINE_RATE, PORT, STARTING_BALANCE};