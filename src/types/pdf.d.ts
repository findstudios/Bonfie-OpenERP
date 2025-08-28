declare module 'jspdf' {
  interface jsPDF {
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number
    ): jsPDF
    save(filename: string): void
    addPage(): jsPDF
  }
}

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number
    useCORS?: boolean
    allowTaint?: boolean
    backgroundColor?: string
    width?: number
    height?: number
  }
  
  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>
  export = html2canvas
}