const Block = require('./block');
const cryptoHash = require('./crypto-hash');

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({ data }) {
        const newBlock = Block.minedBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data
        });

        this.chain.push(newBlock);
    }

    static isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            return false;
        }

        // Start from 1 as the 0 is already valdiated above
        for (let i = 1; i < chain.length; i++) {
            const { timestamp, lastHash, hash, data } = chain[i];
            const actualLastHash = chain[i - 1].hash;

            if (lastHash !== actualLastHash) {
                return false;
            }
            const validatedHash = cryptoHash(timestamp, lastHash, data);

            if (hash !== validatedHash) {
                return false;
            }

        }

        return true;
    }

    replaceChain(chain) {
        if(chain.length <= this.chain.length){
            console.error("The incoming chain must be longer");
            return;
        }

        if(!Blockchain.isValidChain(chain)){
            console.error("The incoming chain must be valid");
            return;
        }

        console.log("Replacing chain with ", chain);
        this.chain = chain;
    }
}

module.exports = Blockchain;