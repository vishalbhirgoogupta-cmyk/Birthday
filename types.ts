
export interface BirthdayWish {
  title: string;
  message: string;
  poem: string;
  shortQuote: string;
  funFact: string;
}

export interface WishFormData {
  name: string;
  age: string;
  relation: string;
  tone: 'heartfelt' | 'funny' | 'grand' | 'poetic' | 'professional';
  language: 'english' | 'hindi' | 'hinglish';
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  DISPLAYING = 'DISPLAYING',
  CAKE_TIME = 'CAKE_TIME'
}
