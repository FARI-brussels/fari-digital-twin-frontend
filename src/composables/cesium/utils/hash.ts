export function hashWMS(url: string, layers: string, options: Record<string, unknown> = {}): string {
  return `${url}|${layers}|${JSON.stringify(options)}`
}

export function hashModel(url: string, position: [number, number, number], options: Record<string, unknown> = {}): string {
  return `${url}|${position.join(',')}|${JSON.stringify(options)}`
}