declare module '@small-tech/eff-diceware-passphrase' {
  export default class EFFDicewarePassphrase {
    constructor(crypto?: unknown);
    words(count: number): string[];
    entropy(minimum: number): string[];
  }
}
