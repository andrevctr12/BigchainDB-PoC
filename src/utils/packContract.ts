import { ethers } from 'ethers';
import BuyFamon from './BuyFamon.json';
import provider from './provider';

const contractAddress = '0x561C47b01CA447578867a05E0A9f68D83df1bC3A';
const abi = BuyFamon.abi;

export default new ethers.Contract(contractAddress, abi, provider);

