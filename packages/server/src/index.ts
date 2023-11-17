interface BeakProxyProps {
  openAIAPIKey: string;
}

class BeakProxy {
  private openAIAPIKey: string;

  constructor({ openAIAPIKey }: BeakProxyProps) {
    this.openAIAPIKey = openAIAPIKey;
  }
}
