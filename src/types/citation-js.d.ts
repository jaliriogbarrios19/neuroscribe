declare module 'citation-js' {
  export class Cite {
    constructor(data: string | object | unknown[], options?: Record<string, unknown>);
    format(format: string, options?: Record<string, unknown>): string;
    data: Record<string, unknown>[];
  }
}
