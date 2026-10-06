/**
 * Chave do tema no localStorage. Fica fora do `theme-provider` ("use client") de propósito:
 * o layout raiz (servidor) usa o valor no script que aplica o tema antes da hidratação, e
 * importar uma constante de um módulo de cliente no servidor entrega uma referência, não o texto.
 */
export const THEME_STORAGE_KEY = "mistydoces-theme";
