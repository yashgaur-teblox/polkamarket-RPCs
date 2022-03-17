import axios from 'axios';

export class Etherscan {
  public baseUrl: string;
  public apiKey: string;

  constructor() {
    if (!process.env.ETHERSCAN_URL || !process.env.ETHERSCAN_API_KEY) throw("ETHERSCAN_URL and ETHERSCAN_API_KEY are not configured")

    // var has to be defined
    this.baseUrl = process.env.ETHERSCAN_URL;
    // fetching random api key from set of keys
    const apiKeys = process.env.ETHERSCAN_API_KEY.split(',');
    this.apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  }

  public async getEvents(contract, address, fromBlock, toBlock, eventName, filter) {
    let etherscanUrl = `${this.baseUrl}/api?module=logs&action=getLogs&apikey=${this.apiKey}`;
    etherscanUrl += `&address=${address}`;
    if (fromBlock) etherscanUrl += `&fromBlock=${fromBlock}`;
    if (toBlock) etherscanUrl += `&toBlock=${toBlock}`;

    const eventOptions = contract.getContract()._generateEventOptions(eventName, {
      filter,
      fromBlock,
      toBlock,
    });

    // adding topics to query string
    eventOptions.params.topics.forEach((topic, index) => {
      if (topic) {
        etherscanUrl += `&topic${index}=${topic}`;
      }
    });

    const { data } = await axios.get(etherscanUrl);

    // error fetching data
    if (data.status === '0' && data.message === 'No records found') throw (data.result);

    // hitting etherscan result limit, have to narrow search
    if (data.result.length === 1000) throw ('Data max limit of 1000 reached. Setup a smaller block range');

    return data.result.map (result => {
      const decodedData = contract.web3.eth.abi.decodeLog(
        eventOptions.event.inputs,
        result.data,
        result.topics.slice(1) // first topic (eventName) is removed from array
      );

      return this.mapEvent(result, decodedData, eventName);
    }).sort((a, b) => a.blockNumber - b.blockNumber);
  }

  private mapEvent(data, decodedData, eventName) {
    return {
      address: data.address,
      blockHash: '',
      blockNumber: parseInt(data.blockNumber),
      logIndex: parseInt(data.logIndex),
      removed: false,
      transactionHash: data.transactionHash,
      transactionIndex: parseInt(data.transactionIndex),
      transactionLogIndex: data.transactionIndex,
      id: '',
      returnValues: decodedData,
      event: eventName,
      signature: data.topics[0],
      raw: {
        data: data.data,
        topics: data.topics
      }
    };
  }
}
