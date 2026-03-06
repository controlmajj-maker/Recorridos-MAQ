/**
 * Cola global de requests para evitar conexiones simultáneas a la DB.
 * Serializa todas las operaciones de upload + guardado de findings.
 * 
 * Uso:
 *   const result = await requestQueue.enqueue(() => fetch(...));
 * 
 * Si hay una operación en curso, la nueva espera automáticamente.
 * Incluye reintentos automáticos con backoff exponencial.
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  /**
   * Encola una operación async. Devuelve su resultado cuando le toca ejecutarse.
   * Si falla, reintenta hasta MAX_RETRIES veces con backoff exponencial.
   */
  enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        let lastError: unknown;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const result = await operation();
            resolve(result);
            return;
          } catch (err) {
            lastError = err;
            if (attempt < MAX_RETRIES - 1) {
              // Backoff exponencial: 500ms, 1000ms, 2000ms
              await new Promise(r => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)));
            }
          }
        }
        reject(lastError);
      };

      this.queue.push(task);
      this.drain();
    });
  }

  private async drain() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }
    this.running = false;
  }

  /** Cuántas operaciones están esperando */
  get pendingCount() {
    return this.queue.length;
  }

  /** Si hay alguna operación en curso o esperando */
  get isBusy() {
    return this.running || this.queue.length > 0;
  }
}

// Singleton — una sola cola para toda la app
export const requestQueue = new RequestQueue();
