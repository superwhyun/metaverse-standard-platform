declare module 'wordcloud' {
  export type WordCloudEntry = [string, number]

  export interface WordCloudOptions {
    list: WordCloudEntry[]
    fontFamily?: string
    backgroundColor?: string
    color?: string | ((word: string, weight: number) => string)
    shape?: string
    gridSize?: number
    ellipticity?: number
  }

  export default function WordCloud(
    element: HTMLCanvasElement | HTMLElement,
    options: WordCloudOptions,
  ): void
}
