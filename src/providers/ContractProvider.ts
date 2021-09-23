export interface ContractProvider {
  getContract: (contract: string, address: string) => any;
}
