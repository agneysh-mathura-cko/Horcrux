const Blockchain = require('../../blockchain');
const Block = require('../../blockchain/block');
const { cryptoHash } = require('../../util');

describe('Blockchain()', () => {
    let blockchain, newChain, originalChain;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();

        originalChain = blockchain.chain;
    })

    it('contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it('starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    it('adds a new block to the chain', () => {
        const newData = "horcrux 1";
        blockchain.addBlock({ data: newData });
        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
    });

    describe('isValidChain()', () => {

        beforeEach(() => {
            blockchain.addBlock({ data: "Alpha" });
            blockchain.addBlock({ data: "Bravo" });
            blockchain.addBlock({ data: "Charlie" });

        })

        describe('when the chain does not start with the genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = { data: "fake-genesis" };
                expect(Blockchain.isValidChain(blockchain.chain)).toEqual(false);
            });
        });

        describe('when the chain starts with the genesis block and has multiple blocks', () => {
            describe('and a `lastHash` reference has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-lastHash';
                    expect(Blockchain.isValidChain(blockchain.chain)).toEqual(false);

                });
            });
        });

        describe('and the chain contains a block with jumped difficulty', () => {
            it('returns false', () => {
                const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                const lastHash = lastBlock.hash;
                const timestamp = Date.now();
                const nonce = 0;
                const data = [];
                const difficulty = lastBlock.difficulty - 3;
                const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);

                const badBlock = new Block({ timestamp, lastHash, hash, nonce, difficulty, data });

                blockchain.chain.push(badBlock);
                expect(Blockchain.isValidChain(blockchain.chain)).toEqual(false);
            });
        });

        describe('and the chain contains a block with an invalid field', () => {
            it('returns false', () => {
                blockchain.chain[2].data = 'broke-data';
                expect(Blockchain.isValidChain(blockchain.chain)).toEqual(false);
            });
        });

        describe('and the chain does not contain any invalid blocks', () => {
            it('returns true', () => {
                expect(Blockchain.isValidChain(blockchain.chain)).toEqual(true);
            });
        });

    });


    describe('replaceChain()', () => {

        let errorMock, logMock;

        beforeEach(() => {
            errorMock = jest.fn();
            logMock = jest.fn();

            global.console.error = errorMock;
            global.console.log = logMock;
        });

        describe('when the new chain is not longer', () => {
            beforeEach(() => {
                newChain.chain[0] = { new: 'chain' };
                blockchain.replaceChain(newChain.chain);
            });

            it('does not replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain);
            });

            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('when the new chain is longer', () => {

            beforeEach(() => {
                newChain.addBlock({ data: "Alpha" });
                newChain.addBlock({ data: "Bravo" });
                newChain.addBlock({ data: "Charlie" });

            })

            describe('and the chain is invalid', () => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'fake-hash-used';
                    blockchain.replaceChain(newChain.chain);
                })

                it('does not replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain);
                });


                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled();
                });

            });

            describe('and the chain is valid', () => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain);
                })

                it('replaces the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('logs an info for the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });

    });
});