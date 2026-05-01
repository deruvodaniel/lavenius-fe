declare module 'zxcvbn' {
  export type ZXCVBNResult = {
    score: number;
    feedback: {
      warning: string;
      suggestions: string[];
    };
  };

  export default function zxcvbn(password: string, userInputs?: string[]): ZXCVBNResult;
}