const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const PublisherSubscriber = require('./app/publisher-subscriber');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const config = require('./config');
const { response } = require('express');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PublisherSubscriber({ blockchain });

const ROOT_NODE_ADDRESS = `http://localhost:${config.PORT}`;


app.use(bodyParser.json());

app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;
    blockchain.addBlock({ data });
    pubsub.broadcastChain();

    res.redirect('/api/blocks');
});

app.post('/api/transact', (request, response) => {
    const { amount, recipient } = request.body;

    let transaction = transactionPool
        .existingTransaction({ inputAddress: wallet.publicKey });

    try {
        var parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount)) {
            console.error('[-] Invalid Amount received');
            return response.status(400).json({ type: 'error', message: "Invalid Amount received" });
        }

        if (transaction) {
            transaction.update({ senderWallet: wallet, recipient, parsedAmount });
        } else {
            transaction = wallet.createTransaction({
                recipient,
                amount
            });
        }
    } catch (error) {
        console.error('[-] ' + error.message);
        return response.status(400).json({ type: 'error', message: error.message });
    }

    transactionPool.setTransaction(transaction);

    response.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool',(request, response) => {

    response.json(transactionPool.transactionMap);

});

const syncChains = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);

            console.log('[+] Replace chain on a sync with');
            blockchain.replaceChain(rootChain);

        } else {
            console.error('[-] An error occured while syncing the chains');
        }
    });
};

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = config.PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || config.PORT;

app.listen(PORT, () => {
    console.log(`[+] Listening on 127.0.0.1:${PORT}`);

    if (PORT !== config.PORT) {
        syncChains();
    }
});