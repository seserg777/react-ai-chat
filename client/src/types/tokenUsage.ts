export type TokenTurnUsage = {
  input_tokens: number;
  output_tokens: number;
};

export type StreamDoneDetail = {
  usage?: TokenTurnUsage;
  context_window?: number | null;
};
