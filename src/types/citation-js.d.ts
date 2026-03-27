declare module 'citation-js' {
  type CiteDataInput = unknown;
  type CiteOptions = Record<string, unknown>;

  export class Cite {
    constructor(data: CiteDataInput, options?: CiteOptions);
    format(format: string, options?: CiteOptions): string;
    data: unknown[];
  }
}
