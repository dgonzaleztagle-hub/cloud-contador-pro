/**
 * Validación de RUT chileno usando algoritmo de módulo 11
 */

/**
 * Limpia el formato del RUT removiendo puntos y guiones
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[.-]/g, '').toUpperCase();
}

/**
 * Formatea un RUT a formato estándar XX.XXX.XXX-X
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  
  if (cleaned.length < 2) return cleaned;
  
  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);
  
  // Formatear con puntos
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formatted}-${dv}`;
}

/**
 * Calcula el dígito verificador de un RUT
 */
export function calculateDV(rut: string): string {
  // Limpiar y obtener solo los números
  const cleaned = cleanRut(rut).slice(0, -1);
  
  if (!/^\d+$/.test(cleaned)) {
    return '';
  }
  
  let sum = 0;
  let multiplier = 2;
  
  // Recorrer de derecha a izquierda
  for (let i = cleaned.length - 1; i >= 0; i--) {
    sum += parseInt(cleaned[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Valida si un RUT es válido
 */
export function validateRut(rut: string): boolean {
  if (!rut || rut.trim() === '') return false;
  
  const cleaned = cleanRut(rut);
  
  // Validar formato básico (al menos 2 caracteres)
  if (cleaned.length < 2) return false;
  
  // Separar número y dígito verificador
  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);
  
  // Validar que el número sea solo dígitos
  if (!/^\d+$/.test(number)) return false;
  
  // Validar que el DV sea dígito o K
  if (!/^[0-9K]$/.test(dv)) return false;
  
  // Calcular y comparar el dígito verificador
  const calculatedDV = calculateDV(cleaned);
  
  return dv === calculatedDV;
}

/**
 * Extrae solo el número del RUT (sin DV)
 */
export function getRutNumber(rut: string): string {
  const cleaned = cleanRut(rut);
  return cleaned.slice(0, -1);
}

/**
 * Extrae el dígito verificador del RUT
 */
export function getRutDV(rut: string): string {
  const cleaned = cleanRut(rut);
  return cleaned.slice(-1);
}
